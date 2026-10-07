/**
 * Rate limiter for the Mzizi resilience node (N5): an integer token bucket,
 * Resilience4j-style.
 *
 * The bucket counts in units of 1/windowMs of a token, so all arithmetic is integer and
 * every build agrees exactly:
 *
 * - one token = `windowMs` units; capacity `C = (limit + burstAllowance) * windowMs`;
 *   the bucket starts full.
 * - refill adds `elapsed * limit` units, capped at C. The sustained rate is `limit` per
 *   window; `burstAllowance` only raises the ceiling.
 * - `tryAcquire(now)`: with a whole token, take it. Otherwise the wait for one is
 *   `ceil((windowMs - level) / limit)`; with `queueExcess` and a wait <= `maxWaitMs`, the
 *   token is reserved now (the level may go negative, so concurrent waiters queue behind
 *   each other instead of racing for one token) and the caller sleeps the wait; else the
 *   call is rejected with `RateLimitExceededError` (code `rate-limited`) and the wait as
 *   `retryAfterMs`.
 *
 * Framework-free: usable from Astro, React, Workers and Node alike. The Rust build is
 * `mzizi_resilience::rate_limiter`.
 *
 * Contract: contracts/lib/rate-limiter.contract.json
 * Install via: npx shadcn@latest add https://api.mzizi.dev/v1/ui/rate-limiter
 */

import {
  withDefaults,
  checkInt,
  checkMs,
  checkName,
  emit,
  systemClock,
  timerSleep,
  type Clock,
  type OnResilienceEvent,
  type Sleep,
} from "./resilience-core"

export interface RateLimiterConfig {
  /** Identifier for this limiter, e.g. the API it protects. */
  name: string
  /** Calls allowed per window, sustained (>= 1, default 100). */
  limit: number
  /** The window, in ms (>= 1, default 60000). */
  windowMs: number
  /** Extra calls the bucket may hold above `limit` for bursts (>= 0, default 0). */
  burstAllowance: number
  /** Wait for a token instead of rejecting, when the wait is at most `maxWaitMs` (default false). */
  queueExcess: boolean
  /** The longest wait `queueExcess` accepts, in ms (default 5000). */
  maxWaitMs: number
  /** Called when a call is rejected, with the whole tokens left (0). */
  onLimit?: (name: string, remainingTokens: number) => void
  /** Optional event hook (`queued`, `rejected`). */
  onEvent?: OnResilienceEvent
  /** Default `Date.now`. */
  clock?: Clock
  /** The timer a queued call sleeps on (default `setTimeout`). */
  sleep?: Sleep
}

export const RATE_LIMITER_DEFAULTS = {
  limit: 100,
  windowMs: 60_000,
  burstAllowance: 0,
  queueExcess: false,
  maxWaitMs: 5_000,
} as const

/** The call was rejected: no token, and waiting for one was not allowed or would take too long. */
export class RateLimitExceededError extends Error {
  readonly code = "rate-limited" as const
  readonly limiterName: string
  readonly limit: number
  readonly windowMs: number
  /** When a token will be available, in ms. */
  readonly retryAfterMs: number

  constructor(name: string, limit: number, windowMs: number, retryAfterMs: number) {
    super(`Rate limit exceeded for "${name}" — ${limit} calls per ${windowMs}ms. Retry after ${retryAfterMs}ms`)
    this.name = "RateLimitExceededError"
    this.limiterName = name
    this.limit = limit
    this.windowMs = windowMs
    this.retryAfterMs = retryAfterMs
  }
}

export type RateAcquire = { ok: true; waitMs: number } | { ok: false; retryAfterMs: number }

type CoreConfig = Pick<RateLimiterConfig, "name" | "limit" | "windowMs" | "burstAllowance" | "queueExcess" | "maxWaitMs">

function validate(config: Partial<CoreConfig> & { name: string }): CoreConfig {
  const c = withDefaults(RATE_LIMITER_DEFAULTS, config)
  return {
    name: checkName("name", c.name),
    limit: checkInt("limit", c.limit, 1),
    windowMs: checkInt("windowMs", c.windowMs, 1),
    burstAllowance: checkInt("burstAllowance", c.burstAllowance, 0),
    queueExcess: Boolean(c.queueExcess),
    maxWaitMs: checkMs("maxWaitMs", c.maxWaitMs),
  }
}

/** The sans-IO token bucket. Every method takes `now` (integer ms). */
export class RateLimiterCore {
  readonly config: CoreConfig
  /** Units of 1/windowMs token; may be negative while calls are queued. */
  private level: number
  private lastRefill: number
  private readonly capacity: number

  constructor(config: Partial<CoreConfig> & { name: string }, now: number) {
    this.config = validate(config)
    this.capacity = (this.config.limit + this.config.burstAllowance) * this.config.windowMs
    this.level = this.capacity
    this.lastRefill = now
  }

  /** Ask for a token at `now`. */
  tryAcquire(now: number): RateAcquire {
    this.refill(now)
    const { windowMs, limit, queueExcess, maxWaitMs } = this.config
    if (this.level >= windowMs) {
      this.level -= windowMs
      return { ok: true, waitMs: 0 }
    }
    const waitMs = Math.ceil((windowMs - this.level) / limit)
    if (queueExcess && waitMs <= maxWaitMs) {
      this.level -= windowMs
      return { ok: true, waitMs }
    }
    return { ok: false, retryAfterMs: waitMs }
  }

  /** Whole tokens available at `now`. */
  remaining(now: number): number {
    this.refill(now)
    return Math.floor(Math.max(this.level, 0) / this.config.windowMs)
  }

  /** How long until a whole token is available at `now`, in ms (0 if one is). */
  retryAfterMs(now: number): number {
    this.refill(now)
    if (this.level >= this.config.windowMs) return 0
    return Math.ceil((this.config.windowMs - this.level) / this.config.limit)
  }

  /** Refill to capacity. */
  reset(now: number): void {
    this.level = this.capacity
    this.lastRefill = now
  }

  private refill(now: number): void {
    if (now <= this.lastRefill) return
    const add = (now - this.lastRefill) * this.config.limit
    this.level = add >= this.capacity - this.level ? this.capacity : this.level + add
    this.lastRefill = now
  }
}

/**
 * A rate limiter for async calls.
 *
 * Per-provider limits are a pattern: one limiter per API, with that API's quota (for
 * example a provider allowing 25 calls an hour: `{ name: "tomorrow-io", limit: 25, windowMs: 3_600_000 }`).
 *
 * @example
 * ```ts
 * import { RateLimiter, RateLimitExceededError } from "./rate-limiter"
 *
 * const limiter = new RateLimiter({ name: "tomorrow-io", limit: 25, windowMs: 3_600_000 })
 * try {
 *   return await limiter.execute(() => fetchForecast())
 * } catch (error) {
 *   if (error instanceof RateLimitExceededError) return cachedForecast()
 *   throw error
 * }
 * ```
 */
export class RateLimiter {
  readonly core: RateLimiterCore
  private readonly clock: Clock
  private readonly sleep: Sleep
  private readonly onLimit?: (name: string, remainingTokens: number) => void
  private readonly onEvent?: OnResilienceEvent

  constructor(config: Partial<RateLimiterConfig> & { name: string }) {
    const { onLimit, onEvent, clock, sleep, ...core } = config
    this.clock = clock ?? systemClock
    this.sleep = sleep ?? timerSleep
    this.onLimit = onLimit
    this.onEvent = onEvent
    this.core = new RateLimiterCore(core, this.clock.nowMs())
  }

  get name(): string {
    return this.core.config.name
  }

  /** Whether a whole token is available now. */
  get isAllowed(): boolean {
    return this.core.remaining(this.clock.nowMs()) >= 1
  }

  /** Whole tokens available now. */
  get remaining(): number {
    return this.core.remaining(this.clock.nowMs())
  }

  /** How long until a whole token is available, in ms. */
  get retryAfterMs(): number {
    return this.core.retryAfterMs(this.clock.nowMs())
  }

  /** A snapshot for dashboards. */
  get metrics() {
    const remaining = this.remaining
    const { limit, burstAllowance, windowMs } = this.core.config
    return {
      name: this.name,
      remaining,
      limit,
      burstAllowance,
      windowMs,
      utilization: 1 - remaining / (limit + burstAllowance),
    }
  }

  /** Take a token (waiting if `queueExcess` allows) and run `fn`, or reject with `RateLimitExceededError`. */
  async execute<T>(fn: () => Promise<T>, signal?: AbortSignal): Promise<T> {
    const r = this.core.tryAcquire(this.clock.nowMs())
    if (!r.ok) {
      const { limit, windowMs } = this.core.config
      emit(this.onEvent, { module: "rate-limiter", type: "rejected", name: this.name, data: { retryAfterMs: r.retryAfterMs } })
      this.onLimit?.(this.name, 0)
      throw new RateLimitExceededError(this.name, limit, windowMs, r.retryAfterMs)
    }
    if (r.waitMs > 0) {
      emit(this.onEvent, { module: "rate-limiter", type: "queued", name: this.name, data: { waitMs: r.waitMs } })
      await this.sleep.sleep(r.waitMs, signal)
    }
    return fn()
  }

  /** Refill the bucket. */
  reset(): void {
    this.core.reset(this.clock.nowMs())
  }
}
