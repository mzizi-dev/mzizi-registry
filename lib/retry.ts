/**
 * Retry with exponential backoff for the Mzizi resilience node (N5).
 *
 * The delay before retry number k (k = 1 for the first retry) is
 * `capped = min(baseDelayMs * 2^(k-1), maxDelayMs)`; with `jitter: "half"` (the default)
 * a draw from the injected `Random` adds up to half of it, and the result never exceeds
 * `maxDelayMs`:
 *
 * ```
 * delay = min(maxDelayMs, capped + random.nextU32() % (floor(capped / 2) + 1))
 * ```
 *
 * One draw per retry, and only when jitter is on, so a seeded `Mulberry32` gives the same
 * delays in every build. Rejections (circuit open, rate limited, bulkhead full) and config
 * errors are not retried by default: a guard that refused the call will refuse it again.
 * A non-retryable error is rethrown as it is; running out of attempts throws
 * `RetriesExhaustedError` (code `retries-exhausted`).
 *
 * Framework-free: usable from Astro, React, Workers and Node alike. The Rust build is
 * `mzizi_resilience::retry`.
 *
 * Contract: contracts/lib/retry.contract.json
 * Install via: npx shadcn@latest add https://api.mzizi.dev/v1/ui/retry
 */

import {
  withDefaults,
  abortReason,
  checkInt,
  checkMs,
  emit,
  errorCode,
  isRejection,
  ResilienceConfigError,
  timerSleep,
  type OnResilienceEvent,
  type Sleep,
} from "./resilience-core"
import { mathRandom, type Random } from "./rng"

/** `"half"` adds up to 50 % of the capped delay; `"none"` uses it as is. */
export type RetryJitter = "none" | "half"

export interface RetryConfig {
  /** Attempts including the first (>= 1, default 3). */
  maxAttempts: number
  /** Delay before the first retry, in ms (default 1000). */
  baseDelayMs: number
  /** Ceiling for every delay, jitter included, in ms (default 30000). */
  maxDelayMs: number
  /** Default `"half"`. `true`/`false` are still accepted as `"half"`/`"none"`. */
  jitter: RetryJitter | boolean
  /**
   * Return false to stop retrying `error`. `attempt` is the 1-based number of the attempt
   * that failed. Default: retry unless the error is a rejection or a `ResilienceConfigError`.
   */
  retryIf?: (error: unknown, attempt: number) => boolean
  /** Called before each retry with the failed attempt's number and the delay about to be slept. */
  onRetry?: (error: unknown, attempt: number, delayMs: number) => void
  /** Randomness for jitter (default `Math.random`; pass a seeded `Mulberry32` in tests). */
  random?: Random
  /** The timer between attempts (default `setTimeout`). */
  sleep?: Sleep
  /** Aborting it stops the retries: a pending delay rejects with the signal's reason. */
  signal?: AbortSignal
  /** Optional event hook (`retry`, `exhausted`). */
  onEvent?: OnResilienceEvent
}

export const RETRY_DEFAULTS = {
  maxAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30_000,
  jitter: "half",
} as const

/** Every attempt failed with a retryable error. */
export class RetriesExhaustedError extends Error {
  readonly code = "retries-exhausted" as const
  readonly attempts: number
  /** The last attempt's error, for the caller. Never logged by this module. */
  readonly lastError: unknown
  /** The last attempt's error code. */
  readonly lastErrorCode: string

  constructor(attempts: number, lastError: unknown) {
    const lastErrorCode = errorCode(lastError)
    super(`All ${attempts} attempts failed (last: ${lastErrorCode})`)
    this.name = "RetriesExhaustedError"
    this.attempts = attempts
    this.lastError = lastError
    this.lastErrorCode = lastErrorCode
  }
}

/** The numbers the delay rule reads, validated. */
export interface RetryPolicy {
  maxAttempts: number
  baseDelayMs: number
  maxDelayMs: number
  jitter: RetryJitter
}

/** Validate and normalise the numeric part of a retry config. */
export function retryPolicy(config?: Partial<Pick<RetryConfig, "maxAttempts" | "baseDelayMs" | "maxDelayMs" | "jitter">>): RetryPolicy {
  const c = withDefaults(RETRY_DEFAULTS, config)
  const j: unknown = c.jitter
  let jitter: RetryJitter
  if (j === true || j === "half") jitter = "half"
  else if (j === false || j === "none") jitter = "none"
  else throw new ResilienceConfigError("jitter", `must be "none" or "half", got ${String(j)}`)
  return {
    maxAttempts: checkInt("maxAttempts", c.maxAttempts, 1),
    baseDelayMs: checkMs("baseDelayMs", c.baseDelayMs),
    maxDelayMs: checkMs("maxDelayMs", c.maxDelayMs),
    jitter,
  }
}

/**
 * The delay before retry number `k` (1-based). Draws once from `random` when jitter is
 * `"half"`, never otherwise. Sans-IO.
 */
export function retryDelay(k: number, policy: RetryPolicy, random: Random): number {
  const exp = policy.baseDelayMs * 2 ** (k - 1)
  const capped = Math.min(exp, policy.maxDelayMs)
  if (policy.jitter === "none") return capped
  const extra = random.nextU32() % (Math.floor(capped / 2) + 1)
  return Math.min(policy.maxDelayMs, capped + extra)
}

/** The default `retryIf`: everything but rejections and config errors. */
export function defaultRetryIf(error: unknown): boolean {
  return !isRejection(error) && errorCode(error) !== "config"
}

/**
 * Retry an async operation with exponential backoff. `fn` receives the 1-based attempt
 * number.
 *
 * @example
 * ```ts
 * import { withRetry } from "./retry"
 *
 * const data = await withRetry(() => fetch("/api/weather").then((r) => r.json()))
 * const strict = await withRetry(() => fetchFromProvider(), {
 *   maxAttempts: 5,
 *   baseDelayMs: 500,
 *   retryIf: (error) => !(error instanceof HttpError && error.status < 500),
 * })
 * ```
 */
export async function withRetry<T>(fn: (attempt: number) => Promise<T>, config?: Partial<RetryConfig>): Promise<T> {
  const policy = retryPolicy(config)
  const retryIf = config?.retryIf ?? defaultRetryIf
  const random = config?.random ?? mathRandom
  const sleep = config?.sleep ?? timerSleep
  const signal = config?.signal

  for (let attempt = 1; ; attempt++) {
    if (signal?.aborted) throw abortReason(signal)
    try {
      return await fn(attempt)
    } catch (error) {
      if (!retryIf(error, attempt)) throw error
      if (attempt >= policy.maxAttempts) {
        emit(config?.onEvent, { module: "retry", type: "exhausted", data: { attempts: attempt, code: errorCode(error) } })
        throw new RetriesExhaustedError(attempt, error)
      }
      const delayMs = retryDelay(attempt, policy, random)
      emit(config?.onEvent, { module: "retry", type: "retry", data: { attempt, delayMs, code: errorCode(error) } })
      config?.onRetry?.(error, attempt, delayMs)
      await sleep.sleep(delayMs, signal)
    }
  }
}
