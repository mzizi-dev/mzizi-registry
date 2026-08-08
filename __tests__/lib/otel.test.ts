/**
 * The OTLP payload is an EXTERNAL contract, which is why it is tested rather
 * than eyeballed.
 *
 * Everything else in this repo that goes wrong goes wrong loudly — a type
 * error, a failed build, a red route. A malformed OTLP body does not: the POST
 * returns 200 or the collector drops the span silently, and the first anyone
 * knows is that a dashboard is empty. So the shape details that a collector
 * rejects — id lengths, nanosecond strings, typed attribute values — are
 * asserted here.
 */

import { describe, expect, it, vi, afterEach } from "vitest"
import {
  buildTracePayload,
  exportSpans,
  newSpanId,
  newTraceId,
  probeResultToSpans,
  otelSpanKind,
  otelStatus,
  type OtelConfig,
} from "@/components/registry/n8-assurance/mzizi-otel"
import type { ProbeResult } from "@/components/registry/n8-assurance/mzizi-synthetic-probe"

const CONFIG: OtelConfig = { serviceName: "test-service", endpoint: "https://collector.test" }

const PASSING: ProbeResult = {
  journeyId: "mzizi-browser-render",
  timestamp: "2026-08-08T03:00:00.000Z",
  region: "cloudflare-edge",
  status: "pass",
  durationMs: 1200,
  steps: [
    { description: "/tokens", status: "pass", durationMs: 500 },
    { description: "/architecture", status: "pass", durationMs: 700 },
  ],
}

const FAILING: ProbeResult = {
  ...PASSING,
  status: "fail",
  steps: [
    { description: "/tokens", status: "pass", durationMs: 500 },
    { description: "/changelog/button", status: "fail", durationMs: 700, error: "missing body" },
  ],
}

afterEach(() => vi.unstubAllGlobals())

describe("ids", () => {
  it("mints a 32-hex-char trace id and a 16-hex-char span id", () => {
    // A collector rejects any other length outright, and the failure is a
    // dropped span rather than an error the caller sees.
    expect(newTraceId()).toMatch(/^[0-9a-f]{32}$/)
    expect(newSpanId()).toMatch(/^[0-9a-f]{16}$/)
  })

  it("does not repeat", () => {
    const ids = new Set(Array.from({ length: 200 }, newTraceId))
    expect(ids.size).toBe(200)
  })
})

describe("payload shape", () => {
  const payload = buildTracePayload(probeResultToSpans(PASSING), CONFIG, newTraceId())
  const scope = payload.resourceSpans[0].scopeSpans[0]
  const attrsOf = (list: { key: string; value: Record<string, unknown> }[]) =>
    Object.fromEntries(list.map((a) => [a.key, Object.values(a.value)[0]]))

  it("carries service.name on the resource", () => {
    expect(attrsOf(payload.resourceSpans[0].resource.attributes)["service.name"]).toBe(
      "test-service"
    )
  })

  it("writes timestamps as integer nanosecond STRINGS", () => {
    // JSON has no int64. A number here loses precision above 2^53, which is
    // exactly where a nanosecond timestamp sits, so the mapping is a string.
    for (const span of scope.spans) {
      expect(span.startTimeUnixNano).toMatch(/^\d+$/)
      expect(span.endTimeUnixNano).toMatch(/^\d+$/)
      expect(Number(span.endTimeUnixNano)).toBeGreaterThanOrEqual(Number(span.startTimeUnixNano))
      // Milliseconds where nanoseconds belong is the classic slip and puts the
      // span in 1970, where nobody looks for it.
      expect(Number(span.startTimeUnixNano)).toBeGreaterThan(1.7e18)
    }
  })

  it("tags every attribute with exactly one OTLP type", () => {
    for (const span of scope.spans) {
      for (const attr of span.attributes) {
        const keys = Object.keys(attr.value)
        expect(keys).toHaveLength(1)
        expect(["stringValue", "intValue", "doubleValue", "boolValue"]).toContain(keys[0])
      }
    }
  })

  it("sends integers as strings and non-integers as doubles", () => {
    const run = scope.spans[0]
    const node = run.attributes.find((a) => a.key === "mzizi.node")
    expect(node?.value).toEqual({ intValue: "8" })

    const built = buildTracePayload(
      [{ name: "x", startTimeMs: 0, endTimeMs: 1, attributes: { ratio: 0.5, on: true } }],
      CONFIG,
      newTraceId()
    )
    const attrs = built.resourceSpans[0].scopeSpans[0].spans[0].attributes
    expect(attrs.find((a) => a.key === "ratio")?.value).toEqual({ doubleValue: 0.5 })
    expect(attrs.find((a) => a.key === "on")?.value).toEqual({ boolValue: true })
  })

  it("omits undefined attributes rather than sending null", () => {
    const built = buildTracePayload(
      [
        {
          name: "x",
          startTimeMs: 0,
          endTimeMs: 1,
          attributes: { present: "y", absent: undefined },
        },
      ],
      CONFIG,
      newTraceId()
    )
    const keys = built.resourceSpans[0].scopeSpans[0].spans[0].attributes.map((a) => a.key)
    expect(keys).toContain("present")
    expect(keys).not.toContain("absent")
  })

  it("puts every span of one run under one trace id", () => {
    const ids = new Set(scope.spans.map((s) => s.traceId))
    expect(ids.size).toBe(1)
  })
})

describe("ProbeResult -> spans", () => {
  it("emits one run span plus one child per step", () => {
    const spans = probeResultToSpans(PASSING)
    expect(spans).toHaveLength(3)
    const [run, ...steps] = spans
    expect(run.parentSpanId).toBeUndefined()
    for (const step of steps) expect(step.parentSpanId).toBe(run.spanId)
  })

  it("marks the run INTERNAL and each step CLIENT", () => {
    // A step calls something external, the run calls nothing. Reversing these
    // makes a collector draw service-dependency edges that do not exist.
    const [run, ...steps] = probeResultToSpans(PASSING)
    expect(run.kind).toBe(otelSpanKind.INTERNAL)
    for (const step of steps) expect(step.kind).toBe(otelSpanKind.CLIENT)
  })

  it("reports OK on a passing run", () => {
    for (const span of probeResultToSpans(PASSING)) {
      expect(span.status?.code).toBe(otelStatus.OK)
    }
  })

  it("reports ERROR on the run AND on the failing step only", () => {
    // This is the case fundi acts on, so it is the one that must not silently
    // come through as UNSET.
    const [run, passed, failedStep] = probeResultToSpans(FAILING)
    expect(run.status?.code).toBe(otelStatus.ERROR)
    expect(passed.status?.code).toBe(otelStatus.OK)
    expect(failedStep.status?.code).toBe(otelStatus.ERROR)
    expect(failedStep.status?.message).toBe("missing body")
  })

  it("carries the failure reason as error.message so a consumer need not parse prose", () => {
    const [, , failedStep] = probeResultToSpans(FAILING)
    expect(failedStep.attributes?.["error.message"]).toBe("missing body")
  })

  it("counts failed steps on the run span", () => {
    const [run] = probeResultToSpans(FAILING)
    expect(run.attributes?.["mzizi.probe.steps"]).toBe(2)
    expect(run.attributes?.["mzizi.probe.steps_failed"]).toBe(1)
    expect(run.attributes?.["mzizi.node"]).toBe(8)
  })

  it("merges caller-supplied attributes onto the run span", () => {
    const [run] = probeResultToSpans(PASSING, { "mzizi.check": "browser-render" })
    expect(run.attributes?.["mzizi.check"]).toBe("browser-render")
  })
})

describe("endpoint resolution", () => {
  it("appends /v1/traces to a BASE endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }))
    vi.stubGlobal("fetch", fetchMock)
    await exportSpans(probeResultToSpans(PASSING), CONFIG)
    expect(fetchMock.mock.calls[0][0]).toBe("https://collector.test/v1/traces")
  })

  it("uses a TRACES endpoint verbatim", async () => {
    // The asymmetry is the OTLP spec's, and getting it wrong yields
    // /v1/traces/v1/traces — a 404 that reads like a broken collector.
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }))
    vi.stubGlobal("fetch", fetchMock)
    await exportSpans(probeResultToSpans(PASSING), {
      serviceName: "s",
      tracesEndpoint: "https://collector.test/custom/path",
    })
    expect(fetchMock.mock.calls[0][0]).toBe("https://collector.test/custom/path")
  })

  it("does not double up a trailing slash", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }))
    vi.stubGlobal("fetch", fetchMock)
    await exportSpans(probeResultToSpans(PASSING), {
      serviceName: "s",
      endpoint: "https://collector.test/",
    })
    expect(fetchMock.mock.calls[0][0]).toBe("https://collector.test/v1/traces")
  })
})

describe("failure handling — never throws, never changes the verdict", () => {
  it("is inert with no endpoint, and sends nothing", async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)
    const outcome = await exportSpans(probeResultToSpans(PASSING), { serviceName: "s" })
    expect(outcome.exported).toBe(false)
    expect(outcome.reason).toContain("OTEL_EXPORTER_OTLP_ENDPOINT")
    // Most consumers run no collector. Inert must mean inert — not a failed
    // request to a guessed address.
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("reports a collector error without throwing", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("nope", { status: 503 })))
    const outcome = await exportSpans(probeResultToSpans(PASSING), CONFIG)
    expect(outcome.exported).toBe(false)
    expect(outcome.status).toBe(503)
    expect(outcome.reason).toContain("503")
  })

  it("reports a network failure without throwing", async () => {
    // A probe that failed because its telemetry sink was down would manufacture
    // an incident out of an exporter outage.
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNREFUSED")))
    const outcome = await exportSpans(probeResultToSpans(PASSING), CONFIG)
    expect(outcome.exported).toBe(false)
    expect(outcome.reason).toContain("ECONNREFUSED")
  })

  it("says so when there is nothing to send", async () => {
    const outcome = await exportSpans([], CONFIG)
    expect(outcome).toMatchObject({ exported: false, spanCount: 0 })
  })

  it("posts JSON with the declared content type", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }))
    vi.stubGlobal("fetch", fetchMock)
    await exportSpans(probeResultToSpans(PASSING), { ...CONFIG, headers: { "X-Key": "abc" } })
    const init = fetchMock.mock.calls[0][1]
    expect(init.method).toBe("POST")
    expect(init.headers["Content-Type"]).toBe("application/json")
    expect(init.headers["X-Key"]).toBe("abc")
    expect(() => JSON.parse(init.body)).not.toThrow()
  })
})
