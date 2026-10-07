/**
 * Mzizi resilience (N5): the seven primitives composed into one pipeline, a health monitor,
 * and the fault hook the N8 chaos engine plugs into.
 *
 * The order, outermost first (documented, tested and the same in every build):
 *
 * ```
 * FallbackChain( Retry( CircuitBreaker( RateLimiter( Timeout( Bulkhead( Fault( operation )))))))
 * ```
 *
 * - The primary stage of the fallback chain is the whole inner pipeline; later fallback
 *   stages run plain, each with its own optional timeout.
 * - Retry sees rejections (circuit open, rate limited, bulkhead full) as non-retryable, so
 *   an open circuit goes straight to the fallback.
 * - `validate(value)`, when given, runs on the operation's value inside the pipeline: a value
 *   that fails it throws `MalformedPayloadError` (code `malformed`), which counts for the
 *   breaker and is retried.
 * - `Fault` is the chaos hook: a `FaultInjector` (the N8 chaos engine, or a fixed
 *   `FaultSchedule` in tests) decides a fault per invocation and `applyFault` applies it.
 *
 * Every call reports to a `HealthMonitor` under the pipeline's name: `healthy` (the primary
 * served and the circuit is closed), `degraded` (a fallback served, or the circuit is not
 * closed), `error` (nothing served). Reports carry error CODES only: never a message, a URL
 * or a payload.
 *
 * Framework-free: usable from Astro, React, Workers and Node alike. The React health panel
 * is `mzizi-health-panel`; the section wrapper is `mzizi-section`. The Rust build is the
 * `mzizi-resilience` crate.
 *
 * Contract: contracts/lib/mzizi-resilience.contract.json
 * Install via: npx shadcn@latest add https://api.mzizi.dev/v1/ui/mzizi-resilience
 */

import { Bulkhead, type BulkheadConfig } from "./bulkhead"
import { CircuitBreaker, type CircuitBreakerConfig, type CircuitState } from "./circuit-breaker"
import { withFallbackResult, type FallbackStage } from "./fallback-chain"
import { RateLimiter, type RateLimiterConfig } from "./rate-limiter"
import {
  abortReason,
  checkName,
  emit,
  errorCode,
  ResilienceConfigError,
  systemClock,
  timerSleep,
  type Clock,
  type OnResilienceEvent,
  type Sleep,
} from "./resilience-core"
import { retryPolicy, withRetry, type RetryConfig } from "./retry"
import type { Random } from "./rng"
import { withTimeout } from "./timeout"

export * from "./bulkhead"
export * from "./circuit-breaker"
export * from "./fallback-chain"
export * from "./rate-limiter"
export * from "./resilience-core"
export * from "./retry"
export * from "./rng"
export * from "./timeout"

// ─── The fault hook (implemented by the N8 chaos engine) ────────────────────

/** One injected fault. */
export type Fault =
  | { kind: "error" }
  | { kind: "latency"; ms: number }
  | { kind: "timeout" }
  | { kind: "drop" }
  | { kind: "truncate" }
  | { kind: "malformed" }

/** Decides the fault for each invocation (null: none). The N8 chaos engine implements it. */
export interface FaultInjector {
  decide(): Fault | null
}

/** What a `malformed` fault returns when no `mutate` hook is given. */
export const MALFORMED_MARKER = '{"mzizi-chaos":'

/** A fault was injected (`error`, `drop`, or `truncate`/`malformed` on a value it cannot cut). */
export class ChaosError extends Error {
  readonly code = "chaos" as const
  readonly kind: Fault["kind"]

  constructor(kind: Fault["kind"]) {
    super(`Chaos fault injected: ${kind}`)
    this.name = "ChaosError"
    this.kind = kind
  }
}

/** A value failed `validate` (or a `malformed` fault replaced it). Counts as a failure and is retried. */
export class MalformedPayloadError extends Error {
  readonly code = "malformed" as const
  readonly pipeline: string

  constructor(pipeline: string) {
    super(`Malformed payload in pipeline "${pipeline}"`)
    this.name = "MalformedPayloadError"
    this.pipeline = pipeline
  }
}

function truncateValue<T>(value: T): T {
  if (typeof value === "string") return value.slice(0, Math.floor(value.length / 2)) as T
  if (Array.isArray(value)) return value.slice(0, Math.floor(value.length / 2)) as T
  if (value instanceof ArrayBuffer) return value.slice(0, Math.floor(value.byteLength / 2)) as T
  if (ArrayBuffer.isView(value) && "subarray" in value) {
    const view = value as unknown as { length: number; slice(start: number, end: number): unknown }
    return view.slice(0, Math.floor(view.length / 2)) as T
  }
  throw new ChaosError("truncate")
}

/**
 * Apply one fault to one invocation of `op`:
 *
 * - `null`: run `op`.
 * - `error` / `drop`: throw `ChaosError` without running `op`.
 * - `latency`: wait `ms`, then run `op`.
 * - `timeout`: hang until `ctx.signal` aborts (the Timeout layer's deadline), then reject
 *   with its reason.
 * - `truncate`: run `op` and cut the value to `floor(length / 2)` (strings, arrays, bytes),
 *   or pass it through `mutate`; anything else throws `ChaosError`.
 * - `malformed`: run `op` and replace the value with `mutate`'s output or `MALFORMED_MARKER`.
 */
export async function applyFault<T>(
  fault: Fault | null,
  op: (signal: AbortSignal) => Promise<T>,
  ctx: {
    sleep(ms: number, signal?: AbortSignal): Promise<void>
    signal: AbortSignal
    mutate?: (value: T, kind: "truncate" | "malformed") => T
  },
): Promise<T> {
  if (fault === null) return op(ctx.signal)
  switch (fault.kind) {
    case "error":
    case "drop":
      throw new ChaosError(fault.kind)
    case "latency":
      await ctx.sleep(fault.ms, ctx.signal)
      return op(ctx.signal)
    case "timeout":
      return new Promise<T>((_, reject) => {
        if (ctx.signal.aborted) reject(abortReason(ctx.signal))
        else ctx.signal.addEventListener("abort", () => reject(abortReason(ctx.signal)), { once: true })
      })
    case "truncate": {
      const value = await op(ctx.signal)
      return ctx.mutate ? ctx.mutate(value, "truncate") : truncateValue(value)
    }
    case "malformed": {
      const value = await op(ctx.signal)
      return ctx.mutate ? ctx.mutate(value, "malformed") : (MALFORMED_MARKER as unknown as T)
    }
  }
}

/**
 * A fixed fault schedule: entry i is the fault for invocation i (`null`: none); after the
 * last entry, no faults. For deterministic tests; seeded random chaos is the N8 engine's.
 */
export class FaultSchedule implements FaultInjector {
  private index = 0
  constructor(private readonly schedule: ReadonlyArray<Fault | null>) {}

  decide(): Fault | null {
    const fault = this.index < this.schedule.length ? (this.schedule[this.index] ?? null) : null
    this.index++
    return fault
  }
}

// ─── Health ──────────────────────────────────────────────────────────────────

export type HealthStatus = "healthy" | "degraded" | "error" | "loading"

/** One protected section's or dependency's health. Codes only: no messages, URLs or payloads. */
export interface HealthReport {
  name: string
  status: HealthStatus
  /** Calls (or renders) whose primary path failed. */
  errorCount: number
  /** The last failure's error code. */
  lastErrorCode: string | null
  circuitState: CircuitState | null
  /** What served: `primary`, a fallback stage's name, or `none`. */
  source: string
  /** When this report was last updated, in ms. */
  updatedAt: number
}

/** @deprecated Use `HealthStatus`. */
export type SectionHealth = HealthStatus
/** @deprecated Use `HealthReport` (`sectionName` is now `name`, `lastError` is now `lastErrorCode`). */
export type SectionHealthReport = HealthReport

const SEVERITY: Record<HealthStatus, number> = { healthy: 0, loading: 1, degraded: 2, error: 3 }

/** The worst of a set of statuses: error > degraded > loading > healthy; none → loading. */
export function worstHealth(statuses: Iterable<HealthStatus>): HealthStatus {
  let worst: HealthStatus | null = null
  for (const s of statuses) if (worst === null || SEVERITY[s] > SEVERITY[worst]) worst = s
  return worst ?? "loading"
}

export type HealthUpdate = Partial<Omit<HealthReport, "name" | "updatedAt">>

/** Aggregates health reports by name and tells subscribers when one changes. */
export class HealthMonitor {
  private readonly reports = new Map<string, HealthReport>()
  private readonly listeners = new Set<(reports: ReadonlyMap<string, HealthReport>) => void>()
  private readonly clock: Clock
  private cached: ReadonlyMap<string, HealthReport> = new Map()

  constructor(options?: { clock?: Clock }) {
    this.clock = options?.clock ?? systemClock
  }

  /** Merge `update` into `name`'s report. */
  report(name: string, update: HealthUpdate = {}): HealthReport {
    const existing = this.reports.get(name) ?? {
      name,
      status: "loading" as HealthStatus,
      errorCount: 0,
      lastErrorCode: null,
      circuitState: null,
      source: "none",
      updatedAt: 0,
    }
    const next: HealthReport = { ...existing, ...update, name, updatedAt: this.clock.nowMs() }
    this.reports.set(name, next)
    this.cached = new Map(this.reports)
    for (const l of this.listeners) l(this.cached)
    return next
  }

  /** `name` failed: status `error`, one more error, the error's code. */
  recordError(name: string, error: unknown): HealthReport {
    const errorCount = (this.reports.get(name)?.errorCount ?? 0) + 1
    return this.report(name, { status: "error", errorCount, lastErrorCode: errorCode(error), source: "none" })
  }

  /** `name` recovered: status `healthy`. */
  recordRecovery(name: string): HealthReport {
    return this.report(name, { status: "healthy", source: "primary" })
  }

  /** Stop tracking `name`. */
  remove(name: string): void {
    if (!this.reports.delete(name)) return
    this.cached = new Map(this.reports)
    for (const l of this.listeners) l(this.cached)
  }

  get(name: string): HealthReport | undefined {
    return this.reports.get(name)
  }

  /** A copy of every report. */
  getAll(): Map<string, HealthReport> {
    return new Map(this.reports)
  }

  /** The current reports as an immutable snapshot that changes identity only on an update (for `useSyncExternalStore`). */
  snapshot(): ReadonlyMap<string, HealthReport> {
    return this.cached
  }

  /** The worst status across every report (none → `loading`). */
  systemHealth(): HealthStatus {
    return worstHealth([...this.reports.values()].map((r) => r.status))
  }

  /** @deprecated Use `systemHealth()`. */
  getSystemHealth(): HealthStatus {
    return this.systemHealth()
  }

  /** Called with the snapshot after every change. Returns an unsubscribe function. */
  subscribe(listener: (reports: ReadonlyMap<string, HealthReport>) => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }
}

/** The page- or process-wide monitor the pipelines, `mzizi-section` and `mzizi-health-panel` share by default. */
export const healthMonitor = new HealthMonitor()

// ─── The composed pipeline ───────────────────────────────────────────────────

export interface ResilienceConfig<T> {
  /** The pipeline's name: the health report's name and every guard's default name. */
  name: string
  /** Timeout layer, in ms (default 10000; `false` for none). */
  timeoutMs?: number | false
  /** Retry layer (default on, with the retry defaults; `false` for none). */
  retry?: Partial<Pick<RetryConfig, "maxAttempts" | "baseDelayMs" | "maxDelayMs" | "jitter" | "retryIf" | "onRetry">> | false
  /** Circuit breaker layer (default on; pass an instance to share one across pipelines; `false` for none). */
  circuitBreaker?: Partial<Omit<CircuitBreakerConfig, "clock">> | CircuitBreaker | false
  /** Rate limiter layer (off unless given). */
  rateLimiter?: Partial<Omit<RateLimiterConfig, "clock" | "sleep">> | RateLimiter
  /** Bulkhead layer (off unless given). */
  bulkhead?: Partial<Omit<BulkheadConfig, "sleep">> | Bulkhead
  /** Fallback stages after the primary, in order. Names `primary` and `none` are reserved. */
  fallbacks?: FallbackStage<T>[]
  /** Checks the operation's value; false (or a throw) is a `MalformedPayloadError`. */
  validate?: (value: T) => boolean
  /** The chaos hook: decides a fault per invocation of the operation. */
  faults?: FaultInjector
  /** Applies `truncate` and `malformed` faults to a value of type T. */
  mutate?: (value: T, kind: "truncate" | "malformed") => T
  /** Where health is reported (default the shared `healthMonitor`; `false` for nowhere). */
  health?: HealthMonitor | false
  clock?: Clock
  sleep?: Sleep
  /** Randomness for retry jitter (default `Math.random`). */
  random?: Random
  onEvent?: OnResilienceEvent
}

/** What one call returned, and how. */
export interface ResilienceOutcome<T> {
  value: T
  /** `primary` or the fallback stage that served. */
  source: string
  /** Attempts the primary made (0 when the operation never ran because no attempt started). */
  attempts: number
  /** The breaker's state after the call (null with no breaker). */
  circuitState: CircuitState | null
}

/** A composed pipeline. Its breaker, limiter and bulkhead keep their state across calls. */
export interface Resilience<T> {
  readonly name: string
  readonly breaker: CircuitBreaker | null
  readonly limiter: RateLimiter | null
  readonly bulkhead: Bulkhead | null
  /** Run `op` through the pipeline; resolve with the value and how it was served. */
  execute(op: (signal: AbortSignal) => Promise<T>, options?: { signal?: AbortSignal }): Promise<ResilienceOutcome<T>>
  /** Run `op` through the pipeline; resolve with the value. */
  run(op: (signal: AbortSignal) => Promise<T>, options?: { signal?: AbortSignal }): Promise<T>
}

const RESERVED_STAGES = new Set(["primary", "none"])

/**
 * Compose the pipeline.
 *
 * @example
 * ```ts
 * import { createResilience } from "./mzizi-resilience"
 *
 * const forecast = createResilience<Forecast>({
 *   name: "forecast",
 *   timeoutMs: 5000,
 *   retry: { maxAttempts: 3, baseDelayMs: 500 },
 *   circuitBreaker: { failureThreshold: 3, windowMs: 300_000, cooldownMs: 120_000 },
 *   fallbacks: [{ name: "cache", execute: () => cachedForecast(slug) }],
 * })
 * const { value, source } = await forecast.execute((signal) => fetchForecast(slug, signal))
 * ```
 */
export function createResilience<T>(config: ResilienceConfig<T>): Resilience<T> {
  const name = checkName("name", config.name)
  const clock = config.clock ?? systemClock
  const sleep = config.sleep ?? timerSleep
  const onEvent = config.onEvent
  const timeoutMs = config.timeoutMs === undefined ? 10_000 : config.timeoutMs
  if (timeoutMs !== false) withTimeoutCheck(timeoutMs)

  const breaker =
    config.circuitBreaker === false
      ? null
      : config.circuitBreaker instanceof CircuitBreaker
        ? config.circuitBreaker
        : new CircuitBreaker({ name, onEvent, ...config.circuitBreaker, clock })
  const limiter =
    config.rateLimiter === undefined
      ? null
      : config.rateLimiter instanceof RateLimiter
        ? config.rateLimiter
        : new RateLimiter({ name, onEvent, ...config.rateLimiter, clock, sleep })
  const bulkhead =
    config.bulkhead === undefined
      ? null
      : config.bulkhead instanceof Bulkhead
        ? config.bulkhead
        : new Bulkhead({ name, onEvent, ...config.bulkhead, sleep })
  const retry = config.retry === false ? null : { ...config.retry }
  if (retry) withRetryCheck(retry)
  const fallbacks = config.fallbacks ?? []
  for (const stage of fallbacks) {
    checkName("fallbacks[].name", stage?.name)
    if (RESERVED_STAGES.has(stage.name)) {
      throw new ResilienceConfigError("fallbacks[].name", `may not be "${stage.name}" (reserved)`)
    }
  }
  const monitor = config.health === false ? null : (config.health ?? healthMonitor)

  async function execute(
    op: (signal: AbortSignal) => Promise<T>,
    options?: { signal?: AbortSignal },
  ): Promise<ResilienceOutcome<T>> {
    const outer = options?.signal
    let attempts = 0
    let primaryError: unknown = undefined

    const faultLayer = async (signal: AbortSignal): Promise<T> => {
      const fault = config.faults ? config.faults.decide() : null
      const value = await applyFault(fault, op, { sleep: (ms, s) => sleep.sleep(ms, s), signal, mutate: config.mutate })
      if (config.validate) {
        let ok: boolean
        try {
          ok = config.validate(value)
        } catch {
          ok = false
        }
        if (!ok) throw new MalformedPayloadError(name)
      }
      return value
    }
    const bulkheadLayer = (signal: AbortSignal) =>
      bulkhead ? bulkhead.execute(() => faultLayer(signal), signal) : faultLayer(signal)
    const timeoutLayer = () =>
      timeoutMs === false
        ? bulkheadLayer(outer ?? new AbortController().signal)
        : withTimeout((signal) => bulkheadLayer(signal), timeoutMs, { label: name, sleep, signal: outer })
    const limiterLayer = () => (limiter ? limiter.execute(timeoutLayer, outer) : timeoutLayer())
    const breakerLayer = () => (breaker ? breaker.execute(limiterLayer) : limiterLayer())
    const primary = async (): Promise<T> => {
      try {
        if (!retry) {
          attempts = 1
          return await breakerLayer()
        }
        return await withRetry(
          (attempt) => {
            attempts = attempt
            return breakerLayer()
          },
          { ...retry, sleep, random: config.random, signal: outer, onEvent },
        )
      } catch (error) {
        primaryError = error
        throw error
      }
    }

    let value: T
    let source: string
    try {
      if (fallbacks.length === 0) {
        value = await primary()
        source = "primary"
      } else {
        const served = await withFallbackResult<T>([{ name: "primary", execute: primary }, ...fallbacks], {
          sleep,
          signal: outer,
          onEvent,
        })
        value = served.value
        source = served.stage
      }
    } catch (error) {
      if (!outer?.aborted && monitor) {
        const existing = monitor.get(name)
        monitor.report(name, {
          status: "error",
          errorCount: (existing?.errorCount ?? 0) + 1,
          lastErrorCode: errorCode(primaryError ?? error),
          circuitState: breaker ? breaker.state : null,
          source: "none",
        })
      }
      emit(onEvent, { module: "mzizi-resilience", type: "failed", name, data: { code: errorCode(error), attempts } })
      throw error
    }

    const circuitState = breaker ? breaker.state : null
    if (monitor) {
      const existing = monitor.get(name)
      const primaryServed = source === "primary"
      monitor.report(name, {
        status: primaryServed && (circuitState === null || circuitState === "closed") ? "healthy" : "degraded",
        errorCount: (existing?.errorCount ?? 0) + (primaryServed ? 0 : 1),
        lastErrorCode: primaryServed ? (existing?.lastErrorCode ?? null) : errorCode(primaryError),
        circuitState,
        source,
      })
    }
    emit(onEvent, { module: "mzizi-resilience", type: "served", name, data: { source, attempts } })
    return { value, source, attempts, circuitState }
  }

  return {
    name,
    breaker,
    limiter,
    bulkhead,
    execute,
    run: async (op, options) => (await execute(op, options)).value,
  }
}

function withTimeoutCheck(ms: number): void {
  if (typeof ms !== "number" || !Number.isInteger(ms) || ms < 1) {
    throw new ResilienceConfigError("timeoutMs", `must be an integer >= 1 or false, got ${String(ms)}`)
  }
}

function withRetryCheck(retry: Partial<RetryConfig>): void {
  // Validate now rather than at the first call: config errors are construction errors.
  retryPolicy(retry)
}

/**
 * Wrap a function in a pipeline created once: every call shares its breaker, limiter and
 * bulkhead. The function receives the pipeline's cancellation signal first.
 *
 * @example
 * ```ts
 * const getForecast = withResilience((signal, slug: string) => fetchForecast(slug, signal), {
 *   name: "forecast",
 *   fallbacks: [{ name: "cache", execute: () => cachedForecast() }],
 * })
 * await getForecast("harare")
 * ```
 */
export function withResilience<T, A extends unknown[] = []>(
  fn: (signal: AbortSignal, ...args: A) => Promise<T>,
  config: ResilienceConfig<T>,
): (...args: A) => Promise<T> {
  const pipeline = createResilience(config)
  return (...args: A) => pipeline.run((signal) => fn(signal, ...args))
}

// ─── resilientFetch (kept; now built on the primitives) ──────────────────────

export interface ResilientFetchOptions<T> {
  /** The section or dependency name: the health report's name and the breaker's. */
  section: string
  /** The primary fetch. Receives a signal that aborts at the timeout. */
  fetcher: (signal: AbortSignal) => Promise<T>
  /** A fallback (e.g. cached data), run when the primary path fails. */
  fallback?: () => Promise<T>
  /** Retries after the first attempt (default 2). */
  maxRetries?: number
  /** Timeout per attempt, in ms (default 5000). */
  timeoutMs?: number
  /** Failures that open the section's circuit (default 3). */
  failureThreshold?: number
  /** How long the section's circuit stays open, in ms (default 30000). */
  cooldownMs?: number
  /** Default the shared `healthMonitor`. */
  monitor?: HealthMonitor
  clock?: Clock
  sleep?: Sleep
  random?: Random
  signal?: AbortSignal
}

export interface ResilientFetchResult<T> {
  data: T | null
  /** The primary path's error when a fallback served or nothing did; returned to you, never logged. */
  error: Error | null
  source: "primary" | "fallback" | "none"
  attempts: number
  durationMs: number
}

/** One circuit per section, kept across calls (keyed by section, threshold and cooldown). */
const sectionBreakers = new Map<string, CircuitBreaker>()

/** Forget every section's circuit (tests, or a manual "reset all"). */
export function resetResilientFetch(): void {
  sectionBreakers.clear()
}

/**
 * Fetch with timeout, retries (1 s, 2 s … capped at 5 s, no jitter), a per-section circuit
 * breaker and an optional fallback, reporting the section's health. Never throws.
 */
export async function resilientFetch<T>(options: ResilientFetchOptions<T>): Promise<ResilientFetchResult<T>> {
  const clock = options.clock ?? systemClock
  const start = clock.nowMs()
  const failureThreshold = options.failureThreshold ?? 3
  const cooldownMs = options.cooldownMs ?? 30_000
  const key = `${options.section}\u0000${failureThreshold}\u0000${cooldownMs}`
  let breaker = sectionBreakers.get(key)
  if (!breaker) {
    breaker = new CircuitBreaker({ name: options.section, failureThreshold, cooldownMs, clock })
    sectionBreakers.set(key, breaker)
  }
  const pipeline = createResilience<T>({
    name: options.section,
    timeoutMs: options.timeoutMs ?? 5000,
    retry: { maxAttempts: (options.maxRetries ?? 2) + 1, baseDelayMs: 1000, maxDelayMs: 5000, jitter: "none" },
    circuitBreaker: breaker,
    fallbacks: options.fallback ? [{ name: "fallback", execute: () => (options.fallback as () => Promise<T>)() }] : [],
    health: options.monitor ?? healthMonitor,
    clock,
    sleep: options.sleep,
    random: options.random,
  })
  let attempts = 0
  let primaryError: unknown = null
  try {
    const out = await pipeline.execute(
      (signal) => {
        attempts++
        return options.fetcher(signal).catch((e: unknown) => {
          primaryError = e
          throw e
        })
      },
      { signal: options.signal },
    )
    return {
      data: out.value,
      error: out.source === "primary" ? null : toError(primaryError),
      source: out.source === "primary" ? "primary" : "fallback",
      attempts,
      durationMs: clock.nowMs() - start,
    }
  } catch (error) {
    return { data: null, error: toError(primaryError ?? error), source: "none", attempts, durationMs: clock.nowMs() - start }
  }
}

function toError(e: unknown): Error | null {
  if (e === null || e === undefined) return null
  if (e instanceof Error) return e
  const err = new Error(errorCode(e))
  return err
}
