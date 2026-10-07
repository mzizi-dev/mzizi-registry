// @vitest-environment node
/**
 * Unit tests for the N5 resilience modules beyond the shared fixtures: real timers,
 * cancellation, the fault hook, the health monitor, the async wrappers' edges, and the
 * repo's `lib/` mirrors (mzizi-registry#472).
 */
import { readFileSync } from "node:fs"
import path from "node:path"
import { afterEach, describe, expect, test, vi } from "vitest"

import { Bulkhead, BulkheadFullError } from "@/components/registry/n5-resilience/bulkhead"
import { CircuitBreaker, CircuitOpenError, PROVIDER_CONFIGS } from "@/components/registry/n5-resilience/circuit-breaker"
import { AllStagesFailedError, withFallback, withFallbackResult } from "@/components/registry/n5-resilience/fallback-chain"
import {
  applyFault,
  ChaosError,
  createResilience,
  FaultSchedule,
  HealthMonitor,
  MALFORMED_MARKER,
  MalformedPayloadError,
  resetResilientFetch,
  resilientFetch,
  withResilience,
  worstHealth,
} from "@/components/registry/n5-resilience/mzizi-resilience"
import { RateLimiter, RateLimitExceededError } from "@/components/registry/n5-resilience/rate-limiter"
import {
  errorCode,
  isRejection,
  ResilienceConfigError,
  timerSleep,
} from "@/components/registry/n5-resilience/resilience-core"
import { defaultRetryIf, retryPolicy, withRetry } from "@/components/registry/n5-resilience/retry"
import { hits, Mulberry32, probabilityThreshold } from "@/components/registry/n5-resilience/rng"
import { TimeoutError, timeoutOutcome, withTimeout } from "@/components/registry/n5-resilience/timeout"

import { VirtualTime } from "./virtual-time"

const ROOT = path.resolve(__dirname, "../..")
const coded = (code: string) => Object.assign(new Error(`secret message for ${code}`), { code })

afterEach(() => {
  vi.useRealTimers()
})

describe("timeout", () => {
  test("aborts the operation's signal at the deadline (real timers)", async () => {
    let seen: AbortSignal | undefined
    const err = await withTimeout(
      (signal) => {
        seen = signal
        return new Promise<never>(() => {})
      },
      20,
      "slow",
    ).catch((e: unknown) => e)
    expect(err).toBeInstanceOf(TimeoutError)
    expect((err as TimeoutError).label).toBe("slow")
    expect((err as TimeoutError).durationMs).toBe(20)
    expect(seen?.aborted).toBe(true)
    expect(seen?.reason).toBe(err)
  })

  test("clears the deadline timer on success and on a synchronous throw", async () => {
    vi.useFakeTimers()
    await expect(withTimeout(async () => 1, 1000)).resolves.toBe(1)
    expect(vi.getTimerCount()).toBe(0)
    await expect(
      withTimeout(() => {
        throw coded("sync")
      }, 1000),
    ).rejects.toMatchObject({ code: "sync" })
    expect(vi.getTimerCount()).toBe(0)
  })

  test("an outer signal cancels the operation and rejects with its reason", async () => {
    const outer = new AbortController()
    let inner: AbortSignal | undefined
    const p = withTimeout(
      (signal) => {
        inner = signal
        return new Promise<never>(() => {})
      },
      10_000,
      { signal: outer.signal },
    )
    const reason = new Error("caller gave up")
    outer.abort(reason)
    await expect(p).rejects.toBe(reason)
    expect(inner?.aborted).toBe(true)
  })

  test("validates the deadline", () => {
    expect(() => withTimeout(async () => 1, Number.NaN)).toThrow(ResilienceConfigError)
    expect(() => withTimeout(async () => 1, Infinity)).toThrow(ResilienceConfigError)
    expect(timeoutOutcome(5, 5)).toEqual({ timedOut: true, elapsedMs: 5 })
    expect(timeoutOutcome(4, 5)).toEqual({ timedOut: false, elapsedMs: 4 })
  })
})

describe("timerSleep", () => {
  test("rejects at once on an aborted signal and clears its timer on abort", async () => {
    vi.useFakeTimers()
    const done = new AbortController()
    done.abort(new Error("x"))
    await expect(timerSleep.sleep(10, done.signal)).rejects.toThrow("x")
    const c = new AbortController()
    const p = timerSleep.sleep(1000, c.signal)
    expect(vi.getTimerCount()).toBe(1)
    c.abort()
    await expect(p).rejects.toMatchObject({ name: "AbortError" })
    expect(vi.getTimerCount()).toBe(0)
  })
})

describe("circuit-breaker", () => {
  test("opens on the failure that reaches the threshold (no lag) and rejects without calling", async () => {
    const vt = new VirtualTime()
    const changes: string[] = []
    const breaker = new CircuitBreaker({
      name: "dep",
      failureThreshold: 2,
      cooldownMs: 100,
      clock: vt,
      onStateChange: (from, to) => changes.push(`${from}>${to}`),
    })
    await expect(breaker.execute(() => Promise.reject(coded("boom")))).rejects.toMatchObject({ code: "boom" })
    await expect(breaker.execute(() => Promise.reject(coded("boom")))).rejects.toMatchObject({ code: "boom" })
    expect(changes).toEqual(["closed>open"])
    const fn = vi.fn(async () => 1)
    const err = await breaker.execute(fn).catch((e: unknown) => e)
    expect(err).toBeInstanceOf(CircuitOpenError)
    expect((err as CircuitOpenError).retryAfterMs).toBe(100)
    expect(fn).not.toHaveBeenCalled()
    expect(breaker.isAllowed).toBe(false)
  })

  test("half-open admits one probe at a time", async () => {
    const vt = new VirtualTime()
    const breaker = new CircuitBreaker({ name: "dep", failureThreshold: 1, cooldownMs: 10, clock: vt })
    await breaker.execute(() => Promise.reject(coded("boom"))).catch(() => {})
    vt.now = 10
    let release!: () => void
    const probe = breaker.execute(() => new Promise<number>((r) => (release = () => r(1))))
    await expect(breaker.execute(async () => 2)).rejects.toBeInstanceOf(CircuitOpenError)
    release()
    await expect(probe).resolves.toBe(1)
    expect(breaker.state).toBe("closed")
  })

  test("rejections and declined errors are not failures", async () => {
    const breaker = new CircuitBreaker({ name: "dep", failureThreshold: 1 })
    await breaker.execute(() => Promise.reject(new RateLimitExceededError("x", 1, 1, 1))).catch(() => {})
    expect(breaker.state).toBe("closed")
    const custom = new CircuitBreaker({ name: "dep", failureThreshold: 1, isFailure: (e) => errorCode(e) !== "not-found" })
    await custom.execute(() => Promise.reject(coded("not-found"))).catch(() => {})
    expect(custom.state).toBe("closed")
    expect(custom.failureCount).toBe(0)
  })

  test("timeoutMs is refused (the breaker no longer hides a timeout)", () => {
    expect(() => new CircuitBreaker({ name: "x", timeoutMs: 5000 } as never)).toThrow(ResilienceConfigError)
  })

  test("the deprecated PROVIDER_CONFIGS hold only the documented pattern", () => {
    expect(Object.keys(PROVIDER_CONFIGS)).toEqual(["tomorrow-io", "open-meteo"])
    expect(() => new CircuitBreaker({ name: "tomorrow-io", ...PROVIDER_CONFIGS["tomorrow-io"] })).not.toThrow()
  })
})

describe("retry", () => {
  test("calls fn exactly maxAttempts times and never more", async () => {
    const vt = new VirtualTime()
    const fn = vi.fn(async () => {
      throw coded("boom")
    })
    await expect(vt.run(withRetry(fn, { maxAttempts: 2, baseDelayMs: 5, jitter: false, sleep: vt }))).rejects.toMatchObject({
      code: "retries-exhausted",
      attempts: 2,
    })
    expect(fn).toHaveBeenCalledTimes(2)
  })

  test("the exhausted error's message carries the code, not the last error's message", async () => {
    const err = await withRetry(
      async () => {
        throw coded("boom")
      },
      { maxAttempts: 1 },
    ).catch((e: unknown) => e as Error)
    expect(err.message).not.toContain("secret")
    expect(err.message).toContain("boom")
  })

  test("onRetry sees the failed attempt and the delay; retryIf sees 1-based attempts", async () => {
    const vt = new VirtualTime()
    const seen: unknown[] = []
    await vt.run(
      withRetry(async (a) => (a < 3 ? Promise.reject(coded("x")) : "ok"), {
        maxAttempts: 3,
        baseDelayMs: 10,
        jitter: "none",
        sleep: vt,
        retryIf: (_e, attempt) => (seen.push(["if", attempt]), true),
        onRetry: (_e, attempt, delay) => seen.push(["retry", attempt, delay]),
      }),
    )
    expect(seen).toEqual([["if", 1], ["retry", 1, 10], ["if", 2], ["retry", 2, 20]])
  })

  test("an abort during the delay stops the retries", async () => {
    const c = new AbortController()
    const p = withRetry(
      async () => {
        throw coded("x")
      },
      { maxAttempts: 5, baseDelayMs: 10_000, signal: c.signal },
    )
    setTimeout(() => c.abort(new Error("stop")), 5)
    await expect(p).rejects.toThrow("stop")
  })

  test("defaults: half jitter, rejections and config errors not retried", () => {
    expect(retryPolicy()).toEqual({ maxAttempts: 3, baseDelayMs: 1000, maxDelayMs: 30_000, jitter: "half" })
    expect(retryPolicy({ jitter: false }).jitter).toBe("none")
    expect(defaultRetryIf(new CircuitOpenError("x"))).toBe(false)
    expect(defaultRetryIf(new ResilienceConfigError("x", "bad"))).toBe(false)
    expect(defaultRetryIf(new TimeoutError(1))).toBe(true)
  })
})

describe("rate-limiter", () => {
  test("a queued call sleeps its reserved wait, then runs", async () => {
    const vt = new VirtualTime()
    const limiter = new RateLimiter({ name: "api", limit: 1, windowMs: 100, queueExcess: true, maxWaitMs: 500, clock: vt, sleep: vt })
    await vt.run(limiter.execute(async () => 1))
    const ran: number[] = []
    await vt.run(Promise.all([limiter.execute(async () => ran.push(vt.now)), limiter.execute(async () => ran.push(vt.now))]))
    expect(ran).toEqual([100, 200])
  })

  test("isAllowed agrees with execute (no fractional token admits)", async () => {
    const vt = new VirtualTime()
    const limiter = new RateLimiter({ name: "api", limit: 1, windowMs: 1000, clock: vt })
    await limiter.execute(async () => 1)
    vt.now = 500
    expect(limiter.isAllowed).toBe(false)
    await expect(limiter.execute(async () => 1)).rejects.toMatchObject({ code: "rate-limited", retryAfterMs: 500 })
    expect(limiter.metrics.remaining).toBe(0)
  })
})

describe("bulkhead", () => {
  test("rejects at capacity with no queue and reports metrics without dividing by zero", async () => {
    const b = new Bulkhead({ name: "db", maxConcurrent: 1 })
    let release!: () => void
    const first = b.execute(() => new Promise<void>((r) => (release = r)))
    await expect(b.execute(async () => 1)).rejects.toBeInstanceOf(BulkheadFullError)
    expect(b.metrics).toMatchObject({ concurrent: 1, utilization: 1 })
    release()
    await first
    expect(b.metrics).toMatchObject({ concurrent: 0, utilization: 0 })
    expect(() => new Bulkhead({ name: "db", maxConcurrent: 0 })).toThrow(ResilienceConfigError)
  })

  test("an abort while queued leaves the queue", async () => {
    const vt = new VirtualTime()
    const b = new Bulkhead({ name: "db", maxConcurrent: 1, maxQueue: 1, maxQueueWaitMs: 1000, sleep: vt })
    let release!: () => void
    const first = b.execute(() => new Promise<void>((r) => (release = r)))
    const c = new AbortController()
    const waiting = b.execute(async () => 1, c.signal)
    expect(b.queued).toBe(1)
    c.abort(new Error("gone"))
    await expect(waiting).rejects.toThrow("gone")
    expect(b.queued).toBe(0)
    release()
    await first
    expect(b.concurrent).toBe(0)
  })
})

describe("fallback-chain", () => {
  test("no stages is a config error; AllStagesFailedError carries codes only", async () => {
    await expect(withFallback([])).rejects.toBeInstanceOf(ResilienceConfigError)
    const err = await withFallback([{ name: "a", execute: () => Promise.reject(coded("boom")) }]).catch((e: unknown) => e)
    expect(err).toBeInstanceOf(AllStagesFailedError)
    expect((err as Error).message).not.toContain("secret")
    expect(JSON.stringify(err)).not.toContain("secret")
  })

  test("a caller abort stops the chain", async () => {
    const c = new AbortController()
    const second = vi.fn(async () => "b")
    const p = withFallbackResult(
      [
        { name: "a", execute: (signal) => new Promise<string>((_, reject) => signal?.addEventListener("abort", () => reject(signal.reason))) },
        { name: "b", execute: second },
      ],
      { signal: c.signal },
    )
    c.abort(new Error("stop"))
    await expect(p).rejects.toThrow("stop")
    expect(second).not.toHaveBeenCalled()
  })
})

describe("rng", () => {
  test("probability thresholds in integer math", () => {
    expect(probabilityThreshold(0)).toBe(0)
    expect(probabilityThreshold(0.5)).toBe(2147483648)
    expect(probabilityThreshold(1)).toBe(4294967295)
    expect(hits(4294967295, 1)).toBe(true)
    expect(hits(0, 0)).toBe(false)
    expect(() => probabilityThreshold(1.5)).toThrow(RangeError)
    expect(() => new Mulberry32(0.5)).toThrow(RangeError)
  })
})

describe("the fault hook", () => {
  const ctx = (signal = new AbortController().signal) => ({ sleep: (ms: number, s?: AbortSignal) => new VirtualTime().sleep(ms, s), signal })

  test("each fault kind", async () => {
    await expect(applyFault(null, async () => "v", ctx())).resolves.toBe("v")
    await expect(applyFault({ kind: "error" }, async () => "v", ctx())).rejects.toMatchObject({ code: "chaos", kind: "error" })
    await expect(applyFault({ kind: "drop" }, async () => "v", ctx())).rejects.toBeInstanceOf(ChaosError)
    await expect(applyFault({ kind: "truncate" }, async () => "abcdef", ctx())).resolves.toBe("abc")
    await expect(applyFault({ kind: "truncate" }, async () => [1, 2, 3], ctx())).resolves.toEqual([1])
    await expect(applyFault({ kind: "truncate" }, async () => new Uint8Array([1, 2, 3, 4]), ctx())).resolves.toEqual(new Uint8Array([1, 2]))
    await expect(applyFault({ kind: "truncate" }, async () => ({ a: 1 }), ctx())).rejects.toMatchObject({ kind: "truncate" })
    await expect(applyFault({ kind: "malformed" }, async () => "v", ctx())).resolves.toBe(MALFORMED_MARKER)
    await expect(
      applyFault({ kind: "malformed" }, async () => 1, { ...ctx(), mutate: (v, kind) => (kind === "malformed" ? -v : v) }),
    ).resolves.toBe(-1)
    const vt = new VirtualTime()
    await expect(vt.run(applyFault({ kind: "latency", ms: 40 }, async () => vt.now, { sleep: (ms, s) => vt.sleep(ms, s), signal: new AbortController().signal }))).resolves.toBe(40)
  })

  test("a timeout fault hangs until the signal aborts", async () => {
    const c = new AbortController()
    const p = applyFault({ kind: "timeout" }, async () => "v", ctx(c.signal))
    c.abort(new TimeoutError(5))
    await expect(p).rejects.toBeInstanceOf(TimeoutError)
  })

  test("FaultSchedule consumes its entries, then injects nothing", () => {
    const s = new FaultSchedule([{ kind: "error" }, null])
    expect([s.decide(), s.decide(), s.decide()]).toEqual([{ kind: "error" }, null, null])
  })
})

describe("health monitor", () => {
  test("system health is the worst status; empty is loading", () => {
    expect(worstHealth([])).toBe("loading")
    expect(worstHealth(["healthy", "loading"])).toBe("loading")
    expect(worstHealth(["healthy", "degraded", "loading"])).toBe("degraded")
    expect(worstHealth(["degraded", "error"])).toBe("error")
    const m = new HealthMonitor()
    expect(m.systemHealth()).toBe("loading")
    m.report("a", { status: "healthy" })
    expect(m.systemHealth()).toBe("healthy")
  })

  test("records codes, never messages", () => {
    const m = new HealthMonitor()
    const r = m.recordError("a", coded("db-down"))
    expect(r).toMatchObject({ status: "error", errorCount: 1, lastErrorCode: "db-down" })
    expect(JSON.stringify(m.getAll().get("a"))).not.toContain("secret")
    expect(m.recordRecovery("a").status).toBe("healthy")
  })

  test("the snapshot changes identity only on an update; subscribers hear every change", () => {
    const m = new HealthMonitor()
    const heard = vi.fn()
    const off = m.subscribe(heard)
    const before = m.snapshot()
    expect(m.snapshot()).toBe(before)
    m.report("a", { status: "healthy" })
    expect(m.snapshot()).not.toBe(before)
    m.remove("a")
    expect(heard).toHaveBeenCalledTimes(2)
    off()
    m.report("b")
    expect(heard).toHaveBeenCalledTimes(2)
  })
})

describe("the composed pipeline", () => {
  test("validate failures are malformed, retried and counted", async () => {
    const vt = new VirtualTime()
    const p = createResilience<string>({
      name: "x",
      retry: { maxAttempts: 2, baseDelayMs: 1, jitter: "none" },
      validate: (v) => v.startsWith("{"),
      health: false,
      clock: vt,
      sleep: vt,
    })
    const err = await vt.run(p.run(async () => "nope")).catch((e: unknown) => e)
    expect(err).toMatchObject({ code: "retries-exhausted", attempts: 2, lastErrorCode: "malformed" })
    expect((err as { lastError: unknown }).lastError).toBeInstanceOf(MalformedPayloadError)
    expect(p.breaker?.failureCount).toBe(2)
  })

  test("withResilience shares one breaker across calls and passes a signal", async () => {
    const signals: AbortSignal[] = []
    const get = withResilience(
      async (signal, n: number) => {
        signals.push(signal)
        if (n < 0) throw coded("neg")
        return n * 2
      },
      { name: "double", retry: false, circuitBreaker: { failureThreshold: 1 }, health: false },
    )
    await expect(get(2)).resolves.toBe(4)
    await expect(get(-1)).rejects.toMatchObject({ code: "neg" })
    await expect(get(3)).rejects.toBeInstanceOf(CircuitOpenError)
    expect(signals).toHaveLength(2)
    expect(signals[0]).toBeInstanceOf(AbortSignal)
  })

  test("reserved fallback names and bad timeouts are config errors", () => {
    expect(() => createResilience({ name: "x", fallbacks: [{ name: "none", execute: async () => 1 }] })).toThrow(ResilienceConfigError)
    expect(() => createResilience({ name: "x", timeoutMs: 1.5 })).toThrow(ResilienceConfigError)
    expect(() => createResilience({ name: "x", circuitBreaker: { failureThreshold: 0 } })).toThrow(ResilienceConfigError)
  })

  test("a bulkhead inside the pipeline: full is a rejection, not retried, served by the fallback", async () => {
    let release!: () => void
    const p = createResilience<string>({
      name: "bh",
      bulkhead: { maxConcurrent: 1 },
      fallbacks: [{ name: "cache", execute: async () => "cached" }],
      health: false,
    })
    const first = p.execute(() => new Promise<string>((r) => (release = () => r("fresh"))))
    await expect(p.execute(async () => "x")).resolves.toMatchObject({ source: "cache", attempts: 1 })
    release()
    await expect(first).resolves.toMatchObject({ source: "primary" })
    expect(isRejection(new BulkheadFullError("bh", 1, 0))).toBe(true)
  })
})

describe("resilientFetch", () => {
  afterEach(() => resetResilientFetch())

  test("primary, fallback and none, with the section's health", async () => {
    const vt = new VirtualTime()
    const monitor = new HealthMonitor({ clock: vt })
    const ok = await vt.run(resilientFetch({ section: "s", fetcher: async () => 1, monitor, clock: vt, sleep: vt }))
    expect(ok).toMatchObject({ data: 1, error: null, source: "primary", attempts: 1 })
    expect(monitor.get("s")?.status).toBe("healthy")

    const fb = await vt.run(
      resilientFetch({ section: "s", fetcher: () => Promise.reject(coded("down")), fallback: async () => 0, maxRetries: 1, monitor, clock: vt, sleep: vt }),
    )
    expect(fb).toMatchObject({ data: 0, source: "fallback", attempts: 2 })
    expect(fb.error).toMatchObject({ code: "down" })
    expect(monitor.get("s")).toMatchObject({ status: "degraded", source: "fallback" })

    const none = await vt.run(
      resilientFetch({ section: "t", fetcher: () => Promise.reject(coded("down")), maxRetries: 0, monitor, clock: vt, sleep: vt }),
    )
    expect(none).toMatchObject({ data: null, source: "none", attempts: 1 })
    expect(monitor.get("t")).toMatchObject({ status: "error", lastErrorCode: "retries-exhausted" })
  })

  test("its circuit now opens (failureThreshold and cooldownMs are honoured)", async () => {
    const vt = new VirtualTime()
    const monitor = new HealthMonitor({ clock: vt })
    const fetcher = vi.fn(() => Promise.reject(coded("down")))
    const opts = { section: "c", fetcher, maxRetries: 0, failureThreshold: 2, cooldownMs: 1000, monitor, clock: vt, sleep: vt }
    await vt.run(resilientFetch(opts))
    await vt.run(resilientFetch(opts))
    const third = await vt.run(resilientFetch(opts))
    expect(fetcher).toHaveBeenCalledTimes(2)
    expect(third.error).toBeInstanceOf(CircuitOpenError)
    expect(monitor.get("c")?.circuitState).toBe("open")
  })

  test("the timeout timer is cleared", async () => {
    vi.useFakeTimers()
    const r = await resilientFetch({ section: "u", fetcher: async () => 1, monitor: new HealthMonitor() })
    expect(r.source).toBe("primary")
    expect(vi.getTimerCount()).toBe(0)
  })
})

describe("lib/ mirrors", () => {
  test.each(["bulkhead", "circuit-breaker", "fallback-chain", "rate-limiter", "resilience-core", "retry", "rng", "timeout"])(
    "lib/%s.ts is a byte copy of the registry source",
    (name) => {
      const registry = readFileSync(path.join(ROOT, "components/registry/n5-resilience", `${name}.ts`), "utf8")
      const mirror = readFileSync(path.join(ROOT, "lib", `${name}.ts`), "utf8")
      expect(mirror).toBe(registry)
    },
  )

  test("no N5 module imports a framework, a logger or an @/ path (usable from Astro)", () => {
    for (const name of ["bulkhead", "circuit-breaker", "fallback-chain", "mzizi-resilience", "rate-limiter", "resilience-core", "retry", "rng", "timeout"]) {
      const src = readFileSync(path.join(ROOT, "components/registry/n5-resilience", `${name}.ts`), "utf8")
      const specs = [...src.matchAll(/(?:\bfrom\s*|\bimport\s*\(?\s*)["']([^"']+)["']/g)].map((m) => m[1])
      for (const s of specs) expect(s, `${name}.ts imports ${s}`).toMatch(/^\.\/[a-z0-9-]+$/)
      expect(src).not.toMatch(/^\s*["']use client["']/m)
      expect(src, name).not.toMatch(/observability|Hystrix|Stytch|Supabase|MongoDB|Anthropic|SvelteKit|wasm-bindgen|CLAUDE\.md/i)
    }
  })
})
