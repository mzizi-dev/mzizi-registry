/**
 * Circuit breaker for the Mzizi resilience node (N5), Resilience4j-style: CLOSED → OPEN →
 * HALF_OPEN → CLOSED (probe succeeded) or OPEN (probe failed).
 *
 * Harvested from mukoko-weather's production breaker (`weather-core/src/breaker.rs`): a
 * pure sliding-window core with the time passed in. `CircuitBreakerCore` is that core
 * (sans-IO, every method takes `now`); `CircuitBreaker` wraps it for async calls with an
 * injected clock. The Rust build is `mzizi_resilience::circuit_breaker`.
 *
 * - CLOSED: calls go through. A failure is recorded at `now`; failures older than
 *   `windowMs` are dropped; at `failureThreshold` failures the circuit opens.
 * - OPEN: calls are rejected with `CircuitOpenError` (code `circuit-open`) and a
 *   `retryAfterMs`, until `cooldownMs` has passed since it opened.
 * - HALF_OPEN: at most `halfOpenMaxCalls` probes are admitted at once; a success closes
 *   the circuit, a failure opens it again.
 * - An outcome reported while OPEN (a call admitted before it opened) is ignored.
 * - Rejections from inner guards (rate limited, bulkhead full) and errors `isFailure`
 *   declines are not dependency failures: they release a half-open probe slot and change
 *   nothing else.
 *
 * Per-provider configuration is a pattern, not a preset list: give each dependency its own
 * breaker with numbers that fit it. mukoko-weather's, for example:
 *
 * ```ts
 * // Tomorrow.io: 3 failures in 5 min open it for 2 min.
 * const TOMORROW = { failureThreshold: 3, windowMs: 300_000, cooldownMs: 120_000 }
 * // Open-Meteo: 5 failures in 5 min open it for 5 min.
 * const OPEN_METEO = { failureThreshold: 5, windowMs: 300_000, cooldownMs: 300_000 }
 * const tomorrow = new CircuitBreaker({ name: "tomorrow-io", ...TOMORROW })
 * ```
 *
 * The breaker applies no timeout of its own: compose `withTimeout` inside it (or use
 * `createResilience`, which does).
 *
 * Framework-free: usable from Astro, React, Workers and Node alike.
 *
 * Contract: contracts/lib/circuit-breaker.contract.json
 * Install via: npx shadcn@latest add https://api.mzizi.dev/v1/ui/circuit-breaker
 */

import {
  withDefaults,
  checkInt,
  checkMs,
  checkName,
  emit,
  isRejection,
  ResilienceConfigError,
  systemClock,
  type Clock,
  type OnResilienceEvent,
} from "./resilience-core"

/** How a state serialises in every build. */
export type CircuitState = "closed" | "open" | "half_open"

/** A state change, recorded when it is first observed. */
export interface CircuitTransition {
  from: CircuitState
  to: CircuitState
  /** The `now` at which it was observed, in ms. */
  at: number
}

export interface CircuitBreakerConfig {
  /** Identifier for this breaker, e.g. the dependency it protects (`tomorrow-io`). */
  name: string
  /** Failures within `windowMs` that open the circuit (>= 1, default 3). */
  failureThreshold: number
  /** Sliding window for counting failures, in ms (>= 1, default 60000). */
  windowMs: number
  /** How long the circuit stays OPEN before admitting probes, in ms (default 30000). */
  cooldownMs: number
  /** Probes admitted at once while HALF_OPEN (>= 1, default 1). */
  halfOpenMaxCalls: number
  /** Which errors count as a dependency failure (default: every error except rejections). */
  isFailure?: (error: unknown) => boolean
  /** Called on every state change. */
  onStateChange?: (from: CircuitState, to: CircuitState, name: string) => void
  /** Optional event hook (`transition`, `rejected`). */
  onEvent?: OnResilienceEvent
  /** The clock the async wrapper reads (default `Date.now`). */
  clock?: Clock
}

export const CIRCUIT_BREAKER_DEFAULTS = {
  failureThreshold: 3,
  windowMs: 60_000,
  cooldownMs: 30_000,
  halfOpenMaxCalls: 1,
} as const

/**
 * @deprecated Per-provider configuration is a documented pattern (see the module header),
 * not a preset list. These two entries are mukoko-weather's tuning, kept so existing
 * imports compile; define your own constants instead. The other vendor presets and
 * every `timeoutMs` were removed (mzizi-registry#472).
 */
export const PROVIDER_CONFIGS = {
  /** Tomorrow.io: 3 failures in 5 min open it for 2 min. */
  "tomorrow-io": { failureThreshold: 3, windowMs: 300_000, cooldownMs: 120_000 },
  /** Open-Meteo: 5 failures in 5 min open it for 5 min. */
  "open-meteo": { failureThreshold: 5, windowMs: 300_000, cooldownMs: 300_000 },
} as const

/** The call was rejected because the circuit is open (or half-open with every probe slot taken). */
export class CircuitOpenError extends Error {
  readonly code = "circuit-open" as const
  readonly breakerName: string
  readonly state: CircuitState
  /** How long until the breaker may admit a call, in ms (0: a probe slot may free up any time). */
  readonly retryAfterMs: number

  constructor(name: string, retryAfterMs = 0, state: CircuitState = "open") {
    super(`Circuit breaker "${name}" is ${state} — call rejected`)
    this.name = "CircuitOpenError"
    this.breakerName = name
    this.state = state
    this.retryAfterMs = retryAfterMs
  }
}

export type CircuitAcquire = { ok: true } | { ok: false; retryAfterMs: number }

/** How many transitions a breaker remembers (the most recent). */
export const TRANSITION_HISTORY = 64

type CoreConfig = Pick<CircuitBreakerConfig, "name" | "failureThreshold" | "windowMs" | "cooldownMs" | "halfOpenMaxCalls">

function validate(config: Partial<CoreConfig> & { name: string }): CoreConfig {
  if ((config as { timeoutMs?: unknown }).timeoutMs !== undefined) {
    throw new ResilienceConfigError(
      "timeoutMs",
      "is no longer applied by the circuit breaker: wrap the call in withTimeout (or use createResilience)",
    )
  }
  const c = withDefaults(CIRCUIT_BREAKER_DEFAULTS, config)
  return {
    name: checkName("name", c.name),
    failureThreshold: checkInt("failureThreshold", c.failureThreshold, 1),
    windowMs: checkInt("windowMs", c.windowMs, 1),
    cooldownMs: checkMs("cooldownMs", c.cooldownMs),
    halfOpenMaxCalls: checkInt("halfOpenMaxCalls", c.halfOpenMaxCalls, 1),
  }
}

/**
 * The sans-IO breaker. Every method takes `now` (integer ms); nothing reads a clock.
 */
export class CircuitBreakerCore {
  readonly config: CoreConfig
  private current: CircuitState = "closed"
  private failures: number[] = []
  private openedAt = 0
  private probes = 0
  private readonly history: CircuitTransition[] = []
  private readonly onTransition?: (t: CircuitTransition) => void

  constructor(config: Partial<CoreConfig> & { name: string }, onTransition?: (t: CircuitTransition) => void) {
    this.config = validate(config)
    this.onTransition = onTransition
  }

  /** The state at `now`. An open circuit whose cooldown has passed is observed as HALF_OPEN. */
  state(now: number): CircuitState {
    if (this.current === "open" && now - this.openedAt >= this.config.cooldownMs) {
      this.probes = 0
      this.move("half_open", now)
    }
    return this.current
  }

  /** Ask to make a call at `now`. */
  tryAcquire(now: number): CircuitAcquire {
    switch (this.state(now)) {
      case "closed":
        return { ok: true }
      case "open":
        return { ok: false, retryAfterMs: Math.max(0, this.config.cooldownMs - (now - this.openedAt)) }
      case "half_open":
        if (this.probes < this.config.halfOpenMaxCalls) {
          this.probes++
          return { ok: true }
        }
        return { ok: false, retryAfterMs: 0 }
    }
  }

  /** An admitted call succeeded. */
  onSuccess(now: number): void {
    if (this.state(now) === "half_open") {
      this.failures = []
      this.probes = 0
      this.move("closed", now)
    }
  }

  /** An admitted call failed. */
  onFailure(now: number): void {
    const s = this.state(now)
    if (s === "closed") {
      this.failures = this.failures.filter((t) => now - t < this.config.windowMs)
      this.failures.push(now)
      if (this.failures.length >= this.config.failureThreshold) this.open(now)
    } else if (s === "half_open") {
      this.open(now)
    }
    // OPEN: a call admitted before the circuit opened reports late; ignored.
  }

  /**
   * An admitted call ended in a way that says nothing about the dependency (an inner
   * rejection, or an error `isFailure` declines): a half-open probe slot is released.
   */
  onIgnored(now: number): void {
    if (this.state(now) === "half_open" && this.probes > 0) this.probes--
  }

  /** Back to CLOSED with no failures. */
  reset(now = 0): void {
    this.failures = []
    this.probes = 0
    this.openedAt = 0
    if (this.current !== "closed") this.move("closed", now)
  }

  /** Failures inside the window at `now`. */
  failureCount(now: number): number {
    return this.failures.filter((t) => now - t < this.config.windowMs).length
  }

  /** Probes admitted and not yet reported while HALF_OPEN. */
  get probesInFlight(): number {
    return this.probes
  }

  /** The most recent transitions (up to `TRANSITION_HISTORY`), oldest first. */
  get transitions(): readonly CircuitTransition[] {
    return this.history
  }

  private open(now: number): void {
    this.openedAt = now
    this.failures = []
    this.probes = 0
    this.move("open", now)
  }

  private move(to: CircuitState, at: number): void {
    if (this.current === to) return
    const t: CircuitTransition = { from: this.current, to, at }
    this.current = to
    this.history.push(t)
    if (this.history.length > TRANSITION_HISTORY) this.history.shift()
    this.onTransition?.(t)
  }
}

/**
 * A circuit breaker for async calls.
 *
 * @example
 * ```ts
 * import { CircuitBreaker, CircuitOpenError } from "./circuit-breaker"
 * import { withTimeout } from "./timeout"
 *
 * const breaker = new CircuitBreaker({ name: "tomorrow-io", failureThreshold: 3, windowMs: 300_000, cooldownMs: 120_000 })
 * try {
 *   const res = await breaker.execute(() => withTimeout((signal) => fetch(url, { signal }), 5000))
 * } catch (error) {
 *   if (error instanceof CircuitOpenError) return cached()
 *   throw error
 * }
 * ```
 */
export class CircuitBreaker {
  readonly core: CircuitBreakerCore
  private readonly clock: Clock
  private readonly isFailure: (error: unknown) => boolean
  private readonly onEvent?: OnResilienceEvent

  constructor(config: Partial<CircuitBreakerConfig> & { name: string }) {
    const { isFailure, onStateChange, onEvent, clock, ...core } = config
    this.clock = clock ?? systemClock
    this.isFailure = isFailure ?? ((e) => !isRejection(e))
    this.onEvent = onEvent
    this.core = new CircuitBreakerCore(core, (t) => {
      emit(onEvent, { module: "circuit-breaker", type: "transition", name: core.name, data: { from: t.from, to: t.to, at: t.at } })
      onStateChange?.(t.from, t.to, core.name)
    })
  }

  get name(): string {
    return this.core.config.name
  }

  /** The current state. */
  get state(): CircuitState {
    return this.core.state(this.clock.nowMs())
  }

  /** Whether the next call would be admitted (a half-open breaker with free probe slots admits). */
  get isAllowed(): boolean {
    const s = this.state
    return s === "closed" || (s === "half_open" && this.core.probesInFlight < this.core.config.halfOpenMaxCalls)
  }

  /** Failures in the current window. */
  get failureCount(): number {
    return this.core.failureCount(this.clock.nowMs())
  }

  /** Transitions so far (most recent `TRANSITION_HISTORY`). */
  get transitions(): readonly CircuitTransition[] {
    return this.core.transitions
  }

  /** Run `fn` through the breaker. Rejects with `CircuitOpenError` without calling `fn` while open. */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    const acquired = this.core.tryAcquire(this.clock.nowMs())
    if (!acquired.ok) {
      emit(this.onEvent, { module: "circuit-breaker", type: "rejected", name: this.name, data: { retryAfterMs: acquired.retryAfterMs } })
      throw new CircuitOpenError(this.name, acquired.retryAfterMs, this.core.state(this.clock.nowMs()))
    }
    let value: T
    try {
      value = await fn()
    } catch (error) {
      let counts: boolean
      try {
        counts = this.isFailure(error)
      } catch {
        counts = true
      }
      if (counts) this.core.onFailure(this.clock.nowMs())
      else this.core.onIgnored(this.clock.nowMs())
      throw error
    }
    this.core.onSuccess(this.clock.nowMs())
    return value
  }

  /** Back to CLOSED. */
  reset(): void {
    this.core.reset(this.clock.nowMs())
  }
}
