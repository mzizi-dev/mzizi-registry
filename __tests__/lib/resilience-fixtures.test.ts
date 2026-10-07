// @vitest-environment node
/**
 * The shared resilience fixtures (__tests__/fixtures/resilience/*.cases.json), run against
 * the TypeScript build. mzizi-rs/crates/mzizi-resilience/tests/fixtures.rs runs the same
 * files against the Rust build; both must produce identical results (mzizi-registry#472).
 */
import { readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, test } from "vitest"

import { BulkheadCore, Bulkhead } from "@/components/registry/n5-resilience/bulkhead"
import { CircuitBreakerCore } from "@/components/registry/n5-resilience/circuit-breaker"
import { AllStagesFailedError, withFallbackResult } from "@/components/registry/n5-resilience/fallback-chain"
import {
  createResilience,
  FaultSchedule,
  HealthMonitor,
  type Fault,
  type FallbackStage,
} from "@/components/registry/n5-resilience/mzizi-resilience"
import { RateLimiterCore } from "@/components/registry/n5-resilience/rate-limiter"
import { errorCode, ResilienceConfigError, type ResilienceEvent } from "@/components/registry/n5-resilience/resilience-core"
import { RetriesExhaustedError, retryDelay, retryPolicy, withRetry } from "@/components/registry/n5-resilience/retry"
import { Mulberry32 } from "@/components/registry/n5-resilience/rng"
import { withTimeout } from "@/components/registry/n5-resilience/timeout"

import { VirtualTime } from "./virtual-time"

const DIR = path.resolve(__dirname, "../fixtures/resilience")
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- fixtures are language-neutral JSON
const load = (name: string): any => JSON.parse(readFileSync(path.join(DIR, `${name}.cases.json`), "utf8"))

/** `[label, case]` rows for test.each: a case's name (or seed), else its JSON. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- fixtures are language-neutral JSON
function named(list: any[]): [string, any][] {
  return list.map((c) => [String(c.name ?? c.seed ?? JSON.stringify(c)), c])
}

/** An error carrying a code, as the fixtures' "fail:<code>" outcomes mean. */
function coded(code: string): Error & { code: string } {
  return Object.assign(new Error(code), { code })
}

/** "ok" or "error:<code>" for a settled promise. */
async function outcome<T>(p: Promise<T>): Promise<{ outcome: string; value?: T; error?: unknown }> {
  try {
    const value = await p
    return { outcome: "ok", value }
  } catch (error) {
    return { outcome: `error:${errorCode(error)}`, error }
  }
}

function expectConfigError(fn: () => unknown) {
  let thrown: unknown
  try {
    fn()
  } catch (e) {
    thrown = e
  }
  expect(thrown).toBeInstanceOf(ResilienceConfigError)
  expect(thrown).toBeInstanceOf(RangeError)
  expect(errorCode(thrown)).toBe("config")
}

describe("prng.cases.json", () => {
  const f = load("prng")
  test.each(named(f.cases))("mulberry32(%s)", (_seed, c) => {
    const rng = new Mulberry32(c.seed)
    expect(Array.from({ length: c.outputs.length }, () => rng.nextU32())).toEqual(c.outputs)
  })
})

describe("timeout.cases.json", () => {
  const f = load("timeout")
  test.each(named(f.cases))("%s", async (_n, c) => {
    const vt = new VirtualTime()
    if (c.durationMs === undefined) {
      expectConfigError(() => withTimeout(async () => "ok", c.timeoutMs, { sleep: vt }))
      return
    }
    const [kind, code] = String(c.result).split(":")
    const op = (signal: AbortSignal): Promise<string> => {
      if (kind === "throw-sync") throw coded(code as string)
      return vt.sleep(c.durationMs, signal).then(() => {
        if (kind === "fail") throw coded(code as string)
        return "ok"
      })
    }
    const got = await outcome(vt.run(withTimeout(op, c.timeoutMs, { sleep: vt })))
    expect(got.outcome).toBe(c.expect.outcome)
    expect(vt.now).toBe(c.expect.now)
    expect(vt.pending, "every timer is cleared").toBe(0)
  })
})

describe("circuit-breaker.cases.json", () => {
  const f = load("circuit-breaker")
  test.each(named(f.cases))("%s", (_n, c) => {
    const core = new CircuitBreakerCore(c.config)
    for (const step of c.steps) {
      const at = step.at
      switch (step.op) {
        case "acquire":
          expect(core.tryAcquire(at), `acquire@${at}`).toEqual(step.expect)
          break
        case "success":
          core.onSuccess(at)
          break
        case "failure":
          core.onFailure(at)
          break
        case "ignored":
          core.onIgnored(at)
          break
        case "state":
          expect(core.state(at), `state@${at}`).toBe(step.expect)
          break
        case "failureCount":
          expect(core.failureCount(at), `failureCount@${at}`).toBe(step.expect)
          break
        case "reset":
          core.reset(at)
          break
        default:
          throw new Error(`unknown op ${step.op}`)
      }
    }
    expect(core.transitions).toEqual(c.transitions)
  })
  test.each(named(f.configErrors))("config error %s", (_n, c) => {
    expectConfigError(() => new CircuitBreakerCore(c))
  })
})

describe("retry.cases.json", () => {
  const f = load("retry")
  test.each(named(f.delays))("delays: %s", (_n, c) => {
    const policy = retryPolicy({ maxAttempts: 1, ...c.policy })
    const rng = new Mulberry32(c.seed ?? 0)
    const draws = { n: 0 }
    const counting = { nextU32: () => (draws.n++, rng.nextU32()) }
    expect(c.ks.map((k: number) => retryDelay(k, policy, counting))).toEqual(c.delays)
    expect(draws.n, "one draw per retry, only with jitter").toBe(c.policy.jitter === "half" ? c.ks.length : 0)
  })
  test.each(named(f.runs))("run: %s", async (_n, c) => {
    const vt = new VirtualTime()
    let attempts = 0
    const p = withRetry(
      async (attempt) => {
        attempts = attempt
        const o: string = c.outcomes[attempt - 1] ?? "ok"
        if (o === "ok") return "ok"
        const [, code] = o.split(":")
        throw coded(code as string)
      },
      { ...c.config, random: new Mulberry32(c.seed), sleep: vt },
    )
    const got = await outcome(vt.run(p))
    expect(got.outcome).toBe(`${c.expect.result === "ok" ? "ok" : c.expect.result}`)
    expect(attempts).toBe(c.expect.attempts)
    expect(vt.now).toBe(c.expect.now)
    if (c.expect.lastErrorCode) {
      expect(got.error).toBeInstanceOf(RetriesExhaustedError)
      expect((got.error as RetriesExhaustedError).lastErrorCode).toBe(c.expect.lastErrorCode)
      expect((got.error as RetriesExhaustedError).attempts).toBe(c.expect.attempts)
    }
  })
  test.each(named(f.configErrors))("config error %s", (_n, c) => {
    expectConfigError(() => retryPolicy(c))
  })
})

describe("rate-limiter.cases.json", () => {
  const f = load("rate-limiter")
  test.each(named(f.cases))("%s", (_n, c) => {
    const core = new RateLimiterCore(c.config, c.start)
    for (const step of c.steps) {
      for (let i = 0; i < (step.repeat ?? 1); i++) {
        switch (step.op) {
          case "acquire":
            expect(core.tryAcquire(step.at), `acquire@${step.at}`).toEqual(step.expect)
            break
          case "remaining":
            expect(core.remaining(step.at), `remaining@${step.at}`).toBe(step.expect)
            break
          case "retryAfter":
            expect(core.retryAfterMs(step.at), `retryAfter@${step.at}`).toBe(step.expect)
            break
          case "reset":
            core.reset(step.at)
            break
          default:
            throw new Error(`unknown op ${step.op}`)
        }
      }
    }
  })
  test.each(named(f.configErrors))("config error %s", (_n, c) => {
    expectConfigError(() => new RateLimiterCore(c as { name: string }, 0))
  })
})

describe("bulkhead.cases.json", () => {
  const f = load("bulkhead")
  test.each(named(f.cases))("core: %s", (_n, c) => {
    const core = new BulkheadCore(c.config)
    for (const step of c.steps) {
      switch (step.op) {
        case "enter": {
          const e = core.tryEnter()
          expect(e.kind === "queued" ? { queued: e.ticket } : e.kind).toEqual(step.expect)
          break
        }
        case "release":
          expect(core.release()).toBe(step.expect)
          break
        case "expire":
          expect(core.expire(step.ticket)).toBe(step.expect)
          break
        case "metrics":
          expect(core.metrics()).toEqual(step.expect)
          break
        default:
          throw new Error(`unknown op ${step.op}`)
      }
    }
  })
  test.each(named(f.runs))("run: %s", async (_n, c) => {
    const vt = new VirtualTime()
    const bulkhead = new Bulkhead({ ...c.config, sleep: vt })
    const ends: Array<{ outcome: string; end: number }> = []
    const calls = c.calls.map((call: { durationMs: number }, i: number) =>
      outcome(bulkhead.execute(() => vt.sleep(call.durationMs).then(() => "ok"))).then((o) => {
        ends[i] = { outcome: o.outcome, end: vt.now }
      }),
    )
    await vt.run(Promise.all(calls))
    expect(ends).toEqual(c.expect)
    expect(vt.pending).toBe(0)
  })
  test.each(named(f.configErrors))("config error %s", (_n, c) => {
    expectConfigError(() => new BulkheadCore(c as { name: string }))
  })
})

describe("fallback-chain.cases.json", () => {
  const f = load("fallback-chain")
  test.each(named(f.cases))("%s", async (_n, c) => {
    const vt = new VirtualTime()
    const stages: FallbackStage<string>[] = c.stages.map(
      (s: { name: string; durationMs: number; outcome: string; timeoutMs?: number }) => ({
        name: s.name,
        timeoutMs: s.timeoutMs,
        execute: (signal?: AbortSignal) =>
          vt.sleep(s.durationMs, signal).then(() => {
            const [kind, rest] = s.outcome.split(":")
            if (kind === "fail") throw coded(rest as string)
            return rest as string
          }),
      }),
    )
    if (c.expect.error === "config") {
      await expect(withFallbackResult(stages, { sleep: vt })).rejects.toBeInstanceOf(ResilienceConfigError)
      return
    }
    const got = await outcome(vt.run(withFallbackResult(stages, { sleep: vt })))
    if (c.expect.error) {
      expect(got.outcome).toBe(`error:${c.expect.error}`)
      expect(got.error).toBeInstanceOf(AllStagesFailedError)
      expect((got.error as AllStagesFailedError).stageErrors).toEqual(c.expect.stageErrors)
    } else {
      expect(got.value).toEqual({ value: c.expect.value, stage: c.expect.stage, index: c.expect.index })
    }
    expect(vt.now).toBe(c.expect.now)
    expect(vt.pending).toBe(0)
  })
})

describe("mzizi-resilience.cases.json (the composed pipeline)", () => {
  const f = load("mzizi-resilience")
  test.each(named(f.scenarios))("%s", async (_n, s) => {
    const vt = new VirtualTime()
    const monitor = new HealthMonitor({ clock: vt })
    const events: ResilienceEvent[] = []
    const fallbacks: FallbackStage<string>[] = s.config.fallbacks.map((fb: { name: string; durationMs: number; value: string }) => ({
      name: fb.name,
      execute: (signal?: AbortSignal) => vt.sleep(fb.durationMs, signal).then(() => fb.value),
    }))
    const pipeline = createResilience<string>({
      name: s.config.name,
      timeoutMs: s.config.timeoutMs,
      retry: s.config.retry,
      circuitBreaker: s.config.circuitBreaker,
      rateLimiter: s.config.rateLimiter,
      fallbacks,
      validate: s.config.validate ? (v) => v === s.config.validate.equals : undefined,
      faults: new FaultSchedule(s.schedule as Array<Fault | null>),
      health: monitor,
      clock: vt,
      sleep: vt,
      random: new Mulberry32(0),
      onEvent: (e) => {
        if (e.module === "mzizi-resilience") events.push(e)
      },
    })
    const op = (signal: AbortSignal) => vt.sleep(s.operation.durationMs, signal).then(() => s.operation.value as string)

    for (const [i, call] of s.calls.entries()) {
      vt.advanceTo(call.at)
      const got = await outcome(vt.run(pipeline.execute(op)))
      const report = monitor.get(s.config.name)
      const last = events.at(-1)
      const actual = {
        served: got.outcome === "ok" ? (got.value as { source: string }).source : got.outcome,
        ...(got.outcome === "ok" && { value: (got.value as { value: string }).value }),
        attempts: last?.data?.attempts,
        circuitState: pipeline.breaker?.state ?? null,
        health: monitor.systemHealth(),
        errorCount: report?.errorCount,
        lastErrorCode: report?.lastErrorCode,
        now: vt.now,
      }
      expect(actual, `call ${i}`).toEqual(call.expect)
      expect(report?.status).toBe(call.expect.health)
      expect(report?.circuitState).toBe(call.expect.circuitState)
      expect(vt.pending, `call ${i}: no timer left armed`).toBe(0)
    }
  })
  test.each(named(f.configErrors))("config error %s", (_n, c) => {
    const cfg = c as { name: string; fallbacks?: Array<{ name: string }> }
    expectConfigError(() =>
      createResilience({
        ...cfg,
        fallbacks: cfg.fallbacks?.map((fb) => ({ name: fb.name, execute: async () => "v" })),
        health: false,
      } as Parameters<typeof createResilience>[0]),
    )
  })
})
