/**
 * chaos (N8): the shared fixture, the production guard, and the n2 wrappers.
 *
 * `__tests__/fixtures/resilience/chaos.cases.json` is the arbiter: the Rust
 * build (`mzizi-rs/crates/mzizi-assurance/tests/resilience_fixtures.rs`) runs
 * the same cases and must make the same decisions.
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ChaosEngine,
  ChaosError,
  ChaosForbiddenError,
  MALFORMED_MARKER,
  ResilienceConfigError,
  applyFault,
  chaosMiddleware,
  chaosWrap,
  createChaos,
  isProductionEnvironment,
  resolveFaults,
  truncateString,
  withChaos,
  type ChaosOptions,
  type Fault,
} from "@/components/registry/n8-assurance/chaos";
import {
  configureObservability,
  memorySink,
  resetObservability,
} from "@/components/registry/n8-assurance/observability";

const ROOT = path.resolve(__dirname, "../..");

interface Fixture {
  malformedMarker: string;
  decisions: {
    name: string;
    config: ChaosOptions;
    invocations: number;
    expected: (Fault | null)[];
  }[];
  legacyMapping: { name: string; config: ChaosOptions; faults: unknown[] }[];
  validation: { name: string; config: ChaosOptions; error: string }[];
  productionGuard: {
    name: string;
    config: ChaosOptions;
    error: string;
    first?: Fault | null;
  }[];
  truncate: { input: string | unknown[]; expected: string | unknown[] }[];
}

const fixture = JSON.parse(
  readFileSync(
    path.join(ROOT, "__tests__/fixtures/resilience/chaos.cases.json"),
    "utf8",
  ),
) as Fixture;

afterEach(() => {
  vi.unstubAllEnvs();
  resetObservability();
});

describe("chaos fixture", () => {
  it.each(fixture.decisions.map((c) => [c.name, c] as const))(
    "decisions: %s",
    (_, c) => {
      const engine = new ChaosEngine(c.config);
      const got = Array.from({ length: c.invocations }, () => engine.decide());
      expect(got).toEqual(c.expected);
      expect(engine.invocations).toBe(c.config.enabled ? c.invocations : 0);
    },
  );

  it.each(fixture.legacyMapping.map((c) => [c.name, c] as const))(
    "n2 config mapping: %s",
    (_, c) => {
      expect(resolveFaults(c.config)).toEqual(c.faults);
    },
  );

  it.each(fixture.validation.map((c) => [c.name, c] as const))(
    "validation: %s",
    (_, c) => {
      expect(() => new ChaosEngine(c.config)).toThrow(ResilienceConfigError);
      try {
        new ChaosEngine(c.config);
      } catch (e) {
        expect((e as ResilienceConfigError).code).toBe(c.error);
        expect(e).toBeInstanceOf(RangeError);
      }
    },
  );

  it.each(fixture.productionGuard.map((c) => [c.name, c] as const))(
    "production guard: %s",
    (_, c) => {
      if (c.error === "none") {
        expect(new ChaosEngine(c.config).decide()).toEqual(c.first);
      } else {
        expect(() => new ChaosEngine(c.config)).toThrow(ChaosForbiddenError);
        expect(c.error).toBe("chaos-forbidden");
      }
    },
  );

  it.each(fixture.truncate.map((c) => [JSON.stringify(c.input), c] as const))(
    "truncate %s",
    async (_, c) => {
      expect(
        await applyFault({ kind: "truncate" }, async () => c.input),
      ).toEqual(c.expected);
    },
  );

  it("the malformed marker", () => {
    expect(MALFORMED_MARKER).toBe(fixture.malformedMarker);
  });
});

describe("the production guard reads the environment", () => {
  it("NODE_ENV=production forbids an enabled engine, whatever environment is passed", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(isProductionEnvironment()).toBe(true);
    expect(isProductionEnvironment("development")).toBe(true);
    expect(() =>
      createChaos({ enabled: true, environment: "development" }),
    ).toThrow(ChaosForbiddenError);
    // Disabled is fine, and inert.
    expect(createChaos({ enabled: false }).decide()).toBeNull();
  });

  it("import.meta.env.PROD forbids it too", () => {
    vi.stubEnv("PROD", true);
    expect(isProductionEnvironment()).toBe(true);
  });

  it("every wrapper throws when enabled in production, and passes through when disabled", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const fn = vi.fn(async () => 1);
    await expect(withChaos(fn, { enabled: true })).rejects.toBeInstanceOf(
      ChaosForbiddenError,
    );
    expect(() => chaosMiddleware({ enabled: true })).toThrow(
      ChaosForbiddenError,
    );
    expect(() => chaosWrap(fn, { enabled: true })).toThrow(ChaosForbiddenError);
    expect(fn).not.toHaveBeenCalled();
    await expect(withChaos(fn, { enabled: false, errorRate: 1 })).resolves.toBe(
      1,
    );
    await expect(chaosMiddleware({ enabled: false })(fn)).resolves.toBe(1);
  });

  it("decide() injects nothing once the environment turns production", () => {
    const engine = createChaos({
      enabled: true,
      faults: [{ kind: "error", rate: 1 }],
    });
    expect(engine.decide()).toEqual({ kind: "error" });
    vi.stubEnv("NODE_ENV", "production");
    expect(engine.decide()).toBeNull();
  });
});

describe("applying faults", () => {
  it("error and drop reject with ChaosError without running the operation", async () => {
    const op = vi.fn(async () => "ok");
    const err = await applyFault({ kind: "error" }, op).catch(
      (e: unknown) => e,
    );
    expect(err).toBeInstanceOf(ChaosError);
    expect(err).toMatchObject({
      code: "chaos",
      kind: "error",
      chaosType: "error",
      injected: true,
    });
    await expect(applyFault({ kind: "drop" }, op)).rejects.toMatchObject({
      code: "chaos",
      kind: "drop",
    });
    expect(op).not.toHaveBeenCalled();
  });

  it("latency waits with the injected sleep, then runs", async () => {
    const sleep = vi.fn(async () => {});
    await expect(
      applyFault({ kind: "latency", ms: 250 }, async () => "ok", { sleep }),
    ).resolves.toBe("ok");
    expect(sleep).toHaveBeenCalledWith(250, undefined);
  });

  it("timeout hangs until the signal aborts", async () => {
    const controller = new AbortController();
    const pending = applyFault({ kind: "timeout" }, async () => "never", {
      signal: controller.signal,
    });
    const reason = new Error("deadline");
    controller.abort(reason);
    await expect(pending).rejects.toBe(reason);
  });

  it("truncate of a value it cannot cut goes to mutate, else rejects", async () => {
    await expect(
      applyFault({ kind: "truncate" }, async () => 42),
    ).rejects.toMatchObject({ kind: "truncate" });
    await expect(
      applyFault({ kind: "truncate" }, async () => ({ a: 1 }), {
        mutate: () => ({ cut: true }),
      }),
    ).resolves.toEqual({ cut: true });
    expect(truncateString("ab")).toBe("a");
  });

  it("malformed replaces the result with the marker or mutate's output", async () => {
    await expect(
      applyFault({ kind: "malformed" }, async () => ({ ok: 1 })),
    ).resolves.toBe(MALFORMED_MARKER);
    await expect(
      applyFault({ kind: "malformed" }, async () => "x", {
        mutate: (v, k) => `${String(v)}:${k}`,
      }),
    ).resolves.toBe("x:malformed");
  });
});

describe("the n2 wrappers", () => {
  it("a disabled config runs the function untouched, without validating", async () => {
    await expect(withChaos(async () => 7)).resolves.toBe(7);
    await expect(
      withChaos(async () => 7, { enabled: false, errorRate: 9 }),
    ).resolves.toBe(7);
  });

  it("withChaos continues one sequence per options object", async () => {
    const options = {
      enabled: true,
      seed: 0,
      schedule: [{ kind: "error" as const }, null],
    };
    await expect(withChaos(async () => 1, options)).rejects.toBeInstanceOf(
      ChaosError,
    );
    await expect(withChaos(async () => 1, options)).resolves.toBe(1);
  });

  it("withChaos accepts an engine", async () => {
    const engine = createChaos({
      enabled: true,
      faults: [],
      schedule: [{ kind: "drop" }],
    });
    await expect(withChaos(async () => 1, engine)).rejects.toMatchObject({
      kind: "drop",
    });
    await expect(withChaos(async () => 1, engine)).resolves.toBe(1);
  });

  it("a seeded middleware replays the engine's sequence", async () => {
    const config: ChaosOptions = {
      enabled: true,
      seed: 42,
      faults: [{ kind: "drop", rate: 0.5 }],
    };
    const expected = (() => {
      const e = new ChaosEngine(config);
      return Array.from({ length: 10 }, () => e.decide()?.kind ?? "ok");
    })();
    const middleware = chaosMiddleware(config);
    const got: string[] = [];
    for (let i = 0; i < 10; i++) {
      got.push(
        await middleware(async () => "ok").catch((e: ChaosError) => e.kind),
      );
    }
    expect(got).toEqual(expected);
  });

  it("chaosWrap passes the arguments through", async () => {
    const wrapped = chaosWrap(async (a: number, b: number) => a + b, {
      enabled: true,
      errorRate: 0,
      latencyMs: [0, 0],
    });
    await expect(wrapped(2, 3)).resolves.toBe(5);
  });

  it("logs the injection under [mzizi:chaos] with the kind only", async () => {
    const sink = memorySink();
    configureObservability({ sinks: [sink] });
    await withChaos(async () => 1, {
      enabled: true,
      schedule: [{ kind: "drop" }],
    }).catch(() => {});
    expect(sink.events).toHaveLength(1);
    expect(sink.events[0]).toMatchObject({
      level: "warn",
      module: "chaos",
      data: { kind: "drop" },
    });
  });
});

describe("the lib/ copy", () => {
  it("is byte-identical to the registry file", () => {
    expect(readFileSync(path.join(ROOT, "lib/chaos.ts"), "utf8")).toBe(
      readFileSync(
        path.join(ROOT, "components/registry/n8-assurance/chaos.ts"),
        "utf8",
      ),
    );
  });
});
