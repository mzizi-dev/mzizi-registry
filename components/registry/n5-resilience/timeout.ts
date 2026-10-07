/**
 * Timeout for the Mzizi resilience node (N5): a deadline on any async operation, with a
 * cancellation signal the operation can honour.
 *
 * `withTimeout(fn, ms)` calls `fn(signal)`. When the deadline passes first, the signal
 * aborts (so a `fetch` given that signal is actually cancelled) and the call rejects with
 * `TimeoutError` (code `timeout`). The deadline timer is always cleared: on success, on
 * failure, and when `fn` throws synchronously.
 *
 * The rule every build shares (and the fixtures pin): an operation of duration `d` under a
 * timeout `t` times out iff `d >= t`. The deadline is armed before `fn` starts, so on a tie
 * the deadline wins.
 *
 * Framework-free: usable from Astro, React, Workers and Node alike. The Rust build is
 * `mzizi_resilience::timeout` (the future is dropped at the deadline).
 *
 * Contract: contracts/lib/timeout.contract.json
 * Install via: npx shadcn@latest add https://api.mzizi.dev/v1/ui/timeout
 */

import { abortReason, checkInt, checkMs, emit, timerSleep, type OnResilienceEvent, type Sleep } from "./resilience-core"

/** The operation did not settle before its deadline. */
export class TimeoutError extends Error {
  readonly code = "timeout" as const
  /** The deadline, in milliseconds. */
  readonly durationMs: number
  /** The label passed to `withTimeout`, or `"unknown"`. */
  readonly label: string

  constructor(ms: number, label?: string) {
    const tag = label ? ` [${label}]` : ""
    super(`Operation timed out after ${ms}ms${tag}`)
    this.name = "TimeoutError"
    this.durationMs = ms
    this.label = label ?? "unknown"
  }
}

export interface TimeoutOptions {
  /** A label for the error and events (a name, never a URL with a query string). */
  label?: string
  /** An outer cancellation: aborting it aborts the operation and rejects with its reason. */
  signal?: AbortSignal
  /** The timer (default `setTimeout`). Inject a virtual one in tests. */
  sleep?: Sleep
  /** Optional event hook (`timeout` events). */
  onEvent?: OnResilienceEvent
}

/**
 * Run `fn` with a deadline of `ms` milliseconds.
 *
 * @example
 * ```ts
 * import { withTimeout, TimeoutError } from "./timeout"
 *
 * const res = await withTimeout((signal) => fetch(url, { signal }), 5000, "weather")
 * ```
 */
export function withTimeout<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  ms: number,
  options?: string | TimeoutOptions,
): Promise<T> {
  // A zero deadline is meaningless (and would race an already-settled promise), so the
  // smallest timeout is 1 ms.
  checkInt("ms", ms, 1)
  const opts: TimeoutOptions = typeof options === "string" ? { label: options } : (options ?? {})
  const sleep = opts.sleep ?? timerSleep
  const outer = opts.signal

  return new Promise<T>((resolve, reject) => {
    if (outer?.aborted) {
      reject(abortReason(outer))
      return
    }
    const controller = new AbortController()
    // A second controller only for the deadline timer, so settling clears it.
    const deadline = new AbortController()
    let settled = false

    const finish = (ok: boolean, value: unknown) => {
      if (settled) return
      settled = true
      deadline.abort()
      outer?.removeEventListener("abort", onOuterAbort)
      if (ok) resolve(value as T)
      else reject(value)
    }
    const onOuterAbort = () => {
      const reason = abortReason(outer as AbortSignal)
      controller.abort(reason)
      finish(false, reason)
    }
    outer?.addEventListener("abort", onOuterAbort, { once: true })

    // Armed BEFORE fn starts: on a tie, the deadline fires first (d >= t times out).
    sleep.sleep(ms, deadline.signal).then(
      () => {
        if (settled) return
        const err = new TimeoutError(ms, opts.label)
        emit(opts.onEvent, { module: "timeout", type: "timeout", name: opts.label, data: { ms } })
        controller.abort(err)
        finish(false, err)
      },
      () => {
        // The deadline was cleared because the call settled first.
      },
    )

    let pending: Promise<T>
    try {
      pending = fn(controller.signal)
    } catch (err) {
      finish(false, err)
      return
    }
    Promise.resolve(pending).then(
      (value) => finish(true, value),
      (err) => finish(false, err),
    )
  })
}

/**
 * The sans-IO rule, for simulations: whether an operation of `durationMs` times out under
 * `timeoutMs`, and how much time passes before the caller sees the outcome.
 */
export function timeoutOutcome(durationMs: number, timeoutMs: number): { timedOut: boolean; elapsedMs: number } {
  checkMs("durationMs", durationMs)
  checkInt("timeoutMs", timeoutMs, 1)
  return durationMs >= timeoutMs
    ? { timedOut: true, elapsedMs: timeoutMs }
    : { timedOut: false, elapsedMs: durationMs }
}
