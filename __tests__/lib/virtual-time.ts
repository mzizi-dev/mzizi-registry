/**
 * A virtual clock and timer for the resilience tests: `Clock` and `Sleep` (from
 * resilience-core) on a time that only moves when `run` fires the next timer.
 *
 * `run(promise)` lets every microtask settle, then fires the earliest pending timer
 * (ties in the order they were armed), and repeats until the promise settles. That is the
 * same order real timers give, so the fixtures' tie rule (a deadline armed first fires
 * first) holds here as it does under `setTimeout`.
 */
import type { Clock, Sleep } from "@/components/registry/n5-resilience/resilience-core"

interface Timer {
  at: number
  seq: number
  fire: () => void
}

const settle = () => new Promise<void>((resolve) => setImmediate(resolve))

export class VirtualTime implements Clock, Sleep {
  now = 0
  private seq = 0
  private readonly timers: Timer[] = []

  nowMs(): number {
    return this.now
  }

  sleep(ms: number, signal?: AbortSignal): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (signal?.aborted) {
        reject(signal.reason)
        return
      }
      const timer: Timer = {
        at: this.now + ms,
        seq: this.seq++,
        fire: () => {
          signal?.removeEventListener("abort", onAbort)
          resolve()
        },
      }
      const onAbort = () => {
        const i = this.timers.indexOf(timer)
        if (i !== -1) this.timers.splice(i, 1)
        reject(signal?.reason)
      }
      this.timers.push(timer)
      signal?.addEventListener("abort", onAbort, { once: true })
    })
  }

  /** Timers still armed (a cleared timer is removed). */
  get pending(): number {
    return this.timers.length
  }

  /** Move the clock forward to `t` without firing anything (between calls). */
  advanceTo(t: number): void {
    if (t < this.now) throw new Error(`time cannot go back from ${this.now} to ${t}`)
    if (this.timers.some((x) => x.at < t)) throw new Error("advancing past an armed timer")
    this.now = t
  }

  /** Drive virtual time until `promise` settles. */
  async run<T>(promise: Promise<T>): Promise<T> {
    let done = false
    promise.then(
      () => (done = true),
      () => (done = true),
    )
    for (let guard = 0; guard < 100_000; guard++) {
      await settle()
      if (done) return promise
      if (this.timers.length === 0) throw new Error("deadlock: the promise is pending and no timer is armed")
      let next = 0
      for (let i = 1; i < this.timers.length; i++) {
        const a = this.timers[i] as Timer
        const b = this.timers[next] as Timer
        if (a.at < b.at || (a.at === b.at && a.seq < b.seq)) next = i
      }
      const [timer] = this.timers.splice(next, 1) as [Timer]
      this.now = Math.max(this.now, timer.at)
      timer.fire()
    }
    throw new Error("virtual time did not settle")
  }
}
