/**
 * Bulkhead for the Mzizi resilience node (N5), Resilience4j-style: a cap on concurrent
 * calls to one dependency, so a slow service cannot take every connection.
 *
 * Named after a ship's bulkheads, which keep one breach from flooding the hull.
 *
 * - Under `maxConcurrent`, a call is admitted.
 * - At capacity, it waits in a FIFO queue of up to `maxQueue` calls (default 0: no queue);
 *   when a running call ends, the oldest waiter is admitted in its place.
 * - With the queue full it is rejected with `BulkheadFullError` (code `bulkhead-full`).
 * - A waiter that is not admitted within `maxQueueWaitMs` is removed and rejected with
 *   `BulkheadQueueTimeoutError` (code `bulkhead-queue-timeout`), so a caller can tell a
 *   full bulkhead from a slow one.
 *
 * `BulkheadCore` is the sans-IO state; `Bulkhead` runs async calls through it. The Rust
 * build is `mzizi_resilience::bulkhead`.
 *
 * Framework-free: usable from Astro, React, Workers and Node alike.
 *
 * Contract: contracts/lib/bulkhead.contract.json
 * Install via: npx shadcn@latest add https://api.mzizi.dev/v1/ui/bulkhead
 */

import {
  withDefaults,
  abortReason,
  checkInt,
  checkMs,
  checkName,
  emit,
  timerSleep,
  type OnResilienceEvent,
  type Sleep,
} from "./resilience-core"

export interface BulkheadConfig {
  /** Identifier for this bulkhead, e.g. the dependency it isolates. */
  name: string
  /** Concurrent calls allowed (>= 1, default 10). */
  maxConcurrent: number
  /** Calls allowed to wait when at capacity (>= 0, default 0: reject at once). */
  maxQueue: number
  /** The longest a call may wait in the queue, in ms (default 5000). */
  maxQueueWaitMs: number
  /** Called when a call is rejected because the bulkhead and its queue are full. */
  onReject?: (name: string, concurrent: number, queued: number) => void
  /** Optional event hook (`queued`, `rejected`, `queue-timeout`). */
  onEvent?: OnResilienceEvent
  /** The timer for the queue wait (default `setTimeout`). */
  sleep?: Sleep
}

export const BULKHEAD_DEFAULTS = {
  maxConcurrent: 10,
  maxQueue: 0,
  maxQueueWaitMs: 5_000,
} as const

/** Rejected: every slot and every queue place is taken. */
export class BulkheadFullError extends Error {
  readonly code = "bulkhead-full" as const
  readonly bulkheadName: string
  readonly concurrent: number
  readonly queued: number

  constructor(name: string, concurrent: number, queued: number) {
    super(`Bulkhead "${name}" is full — ${concurrent} concurrent, ${queued} queued`)
    this.name = "BulkheadFullError"
    this.bulkheadName = name
    this.concurrent = concurrent
    this.queued = queued
  }
}

/** Rejected: the call waited in the queue for `maxQueueWaitMs` without being admitted. */
export class BulkheadQueueTimeoutError extends Error {
  readonly code = "bulkhead-queue-timeout" as const
  readonly bulkheadName: string
  readonly waitedMs: number

  constructor(name: string, waitedMs: number) {
    super(`Bulkhead "${name}" queue wait exceeded ${waitedMs}ms`)
    this.name = "BulkheadQueueTimeoutError"
    this.bulkheadName = name
    this.waitedMs = waitedMs
  }
}

export type BulkheadEntry = { kind: "admitted" } | { kind: "queued"; ticket: number } | { kind: "rejected" }

export interface BulkheadMetrics {
  concurrent: number
  queued: number
  maxConcurrent: number
  maxQueue: number
}

type CoreConfig = Pick<BulkheadConfig, "name" | "maxConcurrent" | "maxQueue" | "maxQueueWaitMs">

function validate(config: Partial<CoreConfig> & { name: string }): CoreConfig {
  const c = withDefaults(BULKHEAD_DEFAULTS, config)
  return {
    name: checkName("name", c.name),
    maxConcurrent: checkInt("maxConcurrent", c.maxConcurrent, 1),
    maxQueue: checkInt("maxQueue", c.maxQueue, 0),
    maxQueueWaitMs: checkMs("maxQueueWaitMs", c.maxQueueWaitMs),
  }
}

/** The sans-IO bulkhead: counts and a FIFO of tickets. */
export class BulkheadCore {
  readonly config: CoreConfig
  private active = 0
  private readonly queue: number[] = []
  private nextTicket = 1

  constructor(config: Partial<CoreConfig> & { name: string }) {
    this.config = validate(config)
  }

  /** Enter: admitted (counted active), queued with a ticket, or rejected. */
  tryEnter(): BulkheadEntry {
    if (this.active < this.config.maxConcurrent) {
      this.active++
      return { kind: "admitted" }
    }
    if (this.queue.length < this.config.maxQueue) {
      const ticket = this.nextTicket++
      this.queue.push(ticket)
      return { kind: "queued", ticket }
    }
    return { kind: "rejected" }
  }

  /**
   * An active call ended. Returns the ticket admitted in its place (it is now counted
   * active), or null when the queue is empty.
   */
  release(): number | null {
    const next = this.queue.shift()
    if (next !== undefined) return next
    if (this.active > 0) this.active--
    return null
  }

  /** A queued ticket's wait ran out: remove it. False if it was already admitted (or unknown). */
  expire(ticket: number): boolean {
    const i = this.queue.indexOf(ticket)
    if (i === -1) return false
    this.queue.splice(i, 1)
    return true
  }

  metrics(): BulkheadMetrics {
    return {
      concurrent: this.active,
      queued: this.queue.length,
      maxConcurrent: this.config.maxConcurrent,
      maxQueue: this.config.maxQueue,
    }
  }
}

/**
 * A bulkhead for async calls.
 *
 * @example
 * ```ts
 * import { Bulkhead, BulkheadFullError } from "./bulkhead"
 *
 * const db = new Bulkhead({ name: "database", maxConcurrent: 5, maxQueue: 10 })
 * const rows = await db.execute(() => query("select 1"))
 * ```
 */
export class Bulkhead {
  readonly core: BulkheadCore
  private readonly sleep: Sleep
  private readonly onReject?: (name: string, concurrent: number, queued: number) => void
  private readonly onEvent?: OnResilienceEvent
  private readonly waiters = new Map<number, () => void>()

  constructor(config: Partial<BulkheadConfig> & { name: string }) {
    const { onReject, onEvent, sleep, ...core } = config
    this.core = new BulkheadCore(core)
    this.sleep = sleep ?? timerSleep
    this.onReject = onReject
    this.onEvent = onEvent
  }

  get name(): string {
    return this.core.config.name
  }

  /** Calls running now. */
  get concurrent(): number {
    return this.core.metrics().concurrent
  }

  /** Calls waiting now. */
  get queued(): number {
    return this.core.metrics().queued
  }

  /** Whether a call now would be admitted or queued. */
  get isAvailable(): boolean {
    const m = this.core.metrics()
    return m.concurrent < m.maxConcurrent || m.queued < m.maxQueue
  }

  /** A snapshot for dashboards; `utilization` is concurrent / maxConcurrent (maxConcurrent >= 1). */
  get metrics() {
    const m = this.core.metrics()
    return { name: this.name, ...m, utilization: m.concurrent / m.maxConcurrent }
  }

  /** Run `fn` inside the bulkhead, waiting in the queue if allowed. */
  async execute<T>(fn: () => Promise<T>, signal?: AbortSignal): Promise<T> {
    if (signal?.aborted) throw abortReason(signal)
    const entry = this.core.tryEnter()
    if (entry.kind === "rejected") {
      const m = this.core.metrics()
      emit(this.onEvent, { module: "bulkhead", type: "rejected", name: this.name, data: { concurrent: m.concurrent, queued: m.queued } })
      this.onReject?.(this.name, m.concurrent, m.queued)
      throw new BulkheadFullError(this.name, m.concurrent, m.queued)
    }
    if (entry.kind === "queued") {
      emit(this.onEvent, { module: "bulkhead", type: "queued", name: this.name, data: { ticket: entry.ticket } })
      await this.waitForTurn(entry.ticket, signal)
    }
    try {
      return await fn()
    } finally {
      const next = this.core.release()
      if (next !== null) this.waiters.get(next)?.()
    }
  }

  private waitForTurn(ticket: number, signal?: AbortSignal): Promise<void> {
    const wait = this.core.config.maxQueueWaitMs
    return new Promise<void>((resolve, reject) => {
      const timer = new AbortController()
      const done = () => {
        this.waiters.delete(ticket)
        timer.abort()
        signal?.removeEventListener("abort", onAbort)
      }
      const onAbort = () => {
        if (this.core.expire(ticket)) {
          done()
          reject(abortReason(signal as AbortSignal))
        }
      }
      this.waiters.set(ticket, () => {
        done()
        resolve()
      })
      signal?.addEventListener("abort", onAbort, { once: true })
      this.sleep.sleep(wait, timer.signal).then(
        () => {
          if (this.core.expire(ticket)) {
            done()
            emit(this.onEvent, { module: "bulkhead", type: "queue-timeout", name: this.name, data: { waitedMs: wait } })
            reject(new BulkheadQueueTimeoutError(this.name, wait))
          }
        },
        () => {
          // Cleared: the ticket was admitted or the caller aborted.
        },
      )
    })
  }
}
