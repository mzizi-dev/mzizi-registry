/**
 * observability (N8): the shared fixture, sinks, and the kept signatures.
 *
 * `__tests__/fixtures/resilience/observability.cases.json` is the arbiter: the
 * Rust build (`mzizi-rs/crates/mzizi-assurance/tests/resilience_fixtures.rs`)
 * runs the same cases and must produce the same events and JSON lines.
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildEvent,
  configureObservability,
  createLogger,
  formatLine,
  isSensitiveKey,
  jsonSink,
  log,
  measure,
  memorySink,
  redact,
  resetObservability,
  toJson,
  trackError,
  addSink,
  type LogContext,
  type LogLevel,
} from "@/components/registry/n8-assurance/observability";

const ROOT = path.resolve(__dirname, "../..");

interface Fixture {
  sensitiveKeys: { key: string; sensitive: boolean }[];
  redaction: { name: string; input: unknown; expected: unknown }[];
  events: {
    name: string;
    level: LogLevel;
    msg: string;
    ctx?: unknown;
    at: number;
    expected: unknown;
    json: string;
    line: string;
  }[];
}

const fixture = JSON.parse(
  readFileSync(
    path.join(ROOT, "__tests__/fixtures/resilience/observability.cases.json"),
    "utf8",
  ),
) as Fixture;

/** `{"$error": {name, code?, message?}}` in the fixture is a real error here. */
function hydrate(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(hydrate);
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    if ("$error" in o) {
      const spec = o.$error as {
        name: string;
        code?: string;
        message?: string;
      };
      const e = new Error(spec.message ?? "") as Error & { code?: string };
      e.name = spec.name;
      if (spec.code !== undefined) e.code = spec.code;
      return e;
    }
    return Object.fromEntries(
      Object.entries(o).map(([k, x]) => [k, hydrate(x)]),
    );
  }
  return v;
}

afterEach(() => {
  resetObservability();
  vi.restoreAllMocks();
});

describe("observability fixture", () => {
  it.each(fixture.sensitiveKeys.map((c) => [c.key, c] as const))(
    "key %s",
    (_, c) => {
      expect(isSensitiveKey(c.key)).toBe(c.sensitive);
    },
  );

  it.each(fixture.redaction.map((c) => [c.name, c] as const))(
    "redaction: %s",
    (_, c) => {
      const input = hydrate(c.input);
      const before = JSON.stringify(c.input);
      expect(redact(input)).toEqual(c.expected);
      expect(JSON.stringify(c.input)).toBe(before);
    },
  );

  it.each(fixture.events.map((c) => [c.name, c] as const))(
    "event: %s",
    (_, c) => {
      const event = buildEvent(
        c.level,
        c.msg,
        hydrate(c.ctx) as LogContext | undefined,
        c.at,
      );
      expect(event).toEqual(c.expected);
      expect(toJson(event)).toBe(c.json);
      expect(formatLine(event)).toBe(c.line);
    },
  );

  it("no error message reaches any output", () => {
    const text =
      JSON.stringify(fixture.redaction.map((c) => c.expected)) +
      fixture.events.map((c) => c.json).join("");
    expect(text).not.toContain("timed out");
    expect(text).not.toContain("secret stuff");
    expect(text).not.toContain("lat=-17.83");
  });
});

describe("redaction beyond JSON", () => {
  it("cycles, dates, class instances, functions, bigints", () => {
    const cyclic: Record<string, unknown> = { a: 1 };
    cyclic.self = cyclic;
    expect(redact(cyclic)).toEqual({ a: 1, self: "[circular]" });
    expect(redact({ d: new Date(0) })).toEqual({
      d: "1970-01-01T00:00:00.000Z",
    });
    expect(
      redact({ m: new Map(), u: new URL("https://x.example/?email=a") }),
    ).toEqual({ m: "[Map]", u: "[URL]" });
    expect(
      redact({ f: () => 1, list: [() => 1], n: BigInt(10), inf: Infinity }),
    ).toEqual({ list: [null], n: "10", inf: null });
  });

  it("a shared (not cyclic) object is written each time it appears", () => {
    const shared = { x: 1 };
    expect(redact({ a: shared, b: shared })).toEqual({
      a: { x: 1 },
      b: { x: 1 },
    });
  });
});

describe("sinks", () => {
  it("the console sink keeps the [mzizi:<module>] prefix and looks console up per call", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    createLogger("registry").warn("Cache miss", {
      traceId: "t1",
      data: { token: "x" },
    });
    expect(spy).toHaveBeenCalledWith(
      "[mzizi:registry] WARN Cache miss [trace:t1]",
      { token: "[redacted]" },
    );
    log.warn("bare");
    expect(spy).toHaveBeenLastCalledWith("[mzizi] WARN bare");
  });

  it("jsonSink writes one JSON line", () => {
    const spy = vi.spyOn(console, "info").mockImplementation(() => {});
    configureObservability({ sinks: [jsonSink], now: () => 0 });
    log.info("hi", { module: "api" });
    expect(spy).toHaveBeenCalledWith(
      '{"ts":"1970-01-01T00:00:00.000Z","level":"info","module":"api","msg":"hi"}',
    );
  });

  it("a throwing sink does not break the caller or the other sinks", () => {
    const sink = memorySink();
    configureObservability({
      sinks: [
        () => {
          throw new Error("down");
        },
        sink,
      ],
    });
    expect(() => log.error("x")).not.toThrow();
    expect(sink.events).toHaveLength(1);
  });

  it("addSink returns a remover; minLevel filters", () => {
    configureObservability({ sinks: [], minLevel: "warn" });
    const sink = memorySink();
    const remove = addSink(sink);
    log.info("dropped");
    log.warn("kept");
    remove();
    log.error("after removal");
    expect(sink.events.map((e) => e.msg)).toEqual(["kept"]);
  });
});

describe("the kept signatures", () => {
  it("trackError logs the name and code, never the message", () => {
    const sink = memorySink();
    configureObservability({ sinks: [sink] });
    const err = Object.assign(new Error("user a@b.zw not found"), {
      name: "LookupError",
      code: "not-found",
    });
    trackError(err, { module: "checkout", data: { email: "a@b.zw" } });
    expect(sink.events[0]).toMatchObject({
      level: "error",
      module: "checkout",
      msg: "LookupError (not-found)",
      data: {
        email: "[redacted]",
        error: { name: "LookupError", code: "not-found" },
      },
    });
    expect(JSON.stringify(sink.events)).not.toContain("a@b.zw");
    trackError("a thrown string");
    expect(sink.events[1]?.msg).toBe("Error");
  });

  it("measure logs success and failure with the duration, and rethrows", async () => {
    const sink = memorySink();
    let t = 1000;
    configureObservability({ sinks: [sink], now: () => (t += 50) });
    await expect(measure("fetch", async () => "v")).resolves.toBe("v");
    await expect(
      measure("fetch", async () => {
        throw new TypeError("boom");
      }),
    ).rejects.toThrow("boom");
    expect(sink.events.map((e) => [e.level, e.module, e.msg])).toEqual([
      ["info", "perf", "fetch completed in 50ms"],
      ["error", "perf", "fetch failed after 50ms"],
    ]);
    expect(sink.events[1]?.data).toEqual({
      duration: 50,
      label: "fetch",
      error: { name: "TypeError" },
    });
  });
});

describe("the lib/ copy", () => {
  it("is byte-identical to the registry file", () => {
    expect(readFileSync(path.join(ROOT, "lib/observability.ts"), "utf8")).toBe(
      readFileSync(
        path.join(ROOT, "components/registry/n8-assurance/observability.ts"),
        "utf8",
      ),
    );
  });
});
