/**
 * The shared ground of the Mzizi resilience node (N5): injected time, the config error,
 * error codes and the event hook every primitive takes.
 *
 * Ground rules (one behaviour spec for every build, mzizi-registry#472):
 *
 * - Time is integer milliseconds. Every sans-IO core takes `now` explicitly; the async
 *   wrappers take an injected `Clock` and `Sleep` (defaults: `Date.now` and `setTimeout`).
 * - Config is validated at construction and a bad value throws `ResilienceConfigError`
 *   (a `RangeError`, code `config`).
 * - Errors carry a stable `code`. Health and telemetry record the code, never a message,
 *   a URL with a query string or a payload: no personal data leaves through this node.
 *
 * Framework-free: usable from Astro, React, Workers and Node alike. The Rust build is
 * `mzizi_resilience::resilience_core` in the `mzizi-resilience` crate.
 *
 * Contract: contracts/lib/resilience-core.contract.json
 * Install via: npx shadcn@latest add https://api.mzizi.dev/v1/ui/resilience-core
 */

/** A source of the current time in integer milliseconds. */
export interface Clock {
  nowMs(): number
}

/** Waits `ms` milliseconds; rejects with the signal's reason if `signal` aborts first. */
export interface Sleep {
  sleep(ms: number, signal?: AbortSignal): Promise<void>
}

/** `Date.now()`. */
export const systemClock: Clock = { nowMs: () => Date.now() }

/** `setTimeout`, cleared when the signal aborts. */
export const timerSleep: Sleep = {
  sleep(ms: number, signal?: AbortSignal): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (signal?.aborted) {
        reject(abortReason(signal))
        return
      }
      const onAbort = () => {
        clearTimeout(timer)
        reject(abortReason(signal as AbortSignal))
      }
      const timer = setTimeout(() => {
        signal?.removeEventListener("abort", onAbort)
        resolve()
      }, ms)
      signal?.addEventListener("abort", onAbort, { once: true })
    })
  },
}

/** The reason an aborted signal carries, or a generic `AbortError` when it carries none. */
export function abortReason(signal: AbortSignal): unknown {
  if (signal.reason !== undefined) return signal.reason
  const err = new Error("The operation was aborted")
  err.name = "AbortError"
  return err
}

/** Every error code this node and the chaos engine throw, each the kebab-case of its class. */
export type ResilienceErrorCode =
  | "timeout"
  | "circuit-open"
  | "retries-exhausted"
  | "bulkhead-full"
  | "bulkhead-queue-timeout"
  | "rate-limited"
  | "all-stages-failed"
  | "malformed"
  | "chaos"
  | "chaos-forbidden"
  | "config"

/**
 * The rejection codes: a guard refused the call without running it. Retry does not retry
 * them, and the circuit breaker does not count them as a dependency failure.
 */
export const REJECTION_CODES: ReadonlySet<string> = new Set([
  "circuit-open",
  "bulkhead-full",
  "bulkhead-queue-timeout",
  "rate-limited",
])

/** A configuration value is out of range. Thrown at construction, never mid-call. */
export class ResilienceConfigError extends RangeError {
  readonly code = "config" as const
  /** The option that was rejected, e.g. `failureThreshold`. */
  readonly option: string

  constructor(option: string, requirement: string) {
    super(`Invalid resilience config: ${option} ${requirement}`)
    this.name = "ResilienceConfigError"
    this.option = option
  }
}

const SAFE_CODE = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,63}$/

/**
 * The stable code of any thrown value, safe to log and to show on a health panel: an
 * error's string `code` when it looks like a code, else its `name`, else `"error"`. Never
 * the message, which can carry personal data.
 */
export function errorCode(err: unknown): string {
  if (err !== null && typeof err === "object") {
    const code = (err as { code?: unknown }).code
    if (typeof code === "string" && SAFE_CODE.test(code)) return code
    const name = (err as { name?: unknown }).name
    if (typeof name === "string" && SAFE_CODE.test(name)) return name
  }
  return "error"
}

/** Whether `err` is a rejection (circuit open, bulkhead full or queue timeout, rate limited). */
export function isRejection(err: unknown): boolean {
  return REJECTION_CODES.has(errorCode(err))
}

/**
 * One thing a primitive did, for a logger or a metrics sink. `data` holds numbers, codes
 * and names only. The N5 modules never import a logger themselves: pass `onEvent` and
 * forward it to the N8 logger or anywhere else.
 */
export interface ResilienceEvent {
  /** The primitive: `circuit-breaker`, `retry`, `rate-limiter`, `bulkhead`, `fallback-chain`, `timeout`, `mzizi-resilience`. */
  module: string
  /** What happened, e.g. `transition`, `retry`, `rejected`, `stage-failed`, `served`. */
  type: string
  /** The breaker, limiter, bulkhead or pipeline name. */
  name?: string
  data?: Record<string, string | number | boolean | null>
}

/** The optional event hook every primitive accepts. */
export type OnResilienceEvent = (event: ResilienceEvent) => void

/** Calls the hook and never lets it break the call it observes. */
export function emit(hook: OnResilienceEvent | undefined, event: ResilienceEvent): void {
  if (!hook) return
  try {
    hook(event)
  } catch {
    // An observer must not change the outcome of the call it watches.
  }
}

// ─── Validation (shared so every primitive rejects the same values) ─────────

/** `defaults` overlaid with every key of `config` that is not `undefined`. */
export function withDefaults<D extends object, C extends object>(defaults: D, config: C | undefined): D & C {
  const out: Record<string, unknown> = { ...(defaults as Record<string, unknown>) }
  for (const [k, v] of Object.entries(config ?? {})) if (v !== undefined) out[k] = v
  return out as D & C
}

/** A non-negative integer number of milliseconds. */
export function checkMs(option: string, value: unknown): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new ResilienceConfigError(option, `must be a non-negative integer of milliseconds, got ${String(value)}`)
  }
  return value
}

/** An integer at least `min`. */
export function checkInt(option: string, value: unknown, min: number): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < min) {
    throw new ResilienceConfigError(option, `must be an integer >= ${min}, got ${String(value)}`)
  }
  return value
}

/** A rate in [0, 1]. */
export function checkRate(option: string, value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 1) {
    throw new ResilienceConfigError(option, `must be a number in [0, 1], got ${String(value)}`)
  }
  return value
}

/** A non-empty name. */
export function checkName(option: string, value: unknown): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new ResilienceConfigError(option, "must be a non-empty string")
  }
  return value
}
