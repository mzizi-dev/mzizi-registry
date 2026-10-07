/**
 * Chaos for Mzizi: seeded, scheduled fault injection that cannot run in production.
 *
 * N8 assurance. `ChaosEngine` decides, per invocation, whether an operation gets a
 * fault and which: `error`, `latency`, `timeout` (hangs until cancelled), `drop`,
 * `truncate` or `malformed`. Decisions come from mulberry32 seeded by `seed`, or
 * from an explicit `schedule`, so a chaos run is a sequence you can replay, assert
 * on and share between builds. The engine is the `FaultInjector` the N5 resilience
 * pipeline (`mzizi-resilience`) takes.
 *
 * THE PRODUCTION GUARD IS HARD. Enabling chaos where the environment is production
 * throws `ChaosForbiddenError` when the engine (or a wrapper's engine) is built, and
 * `decide()` re-checks on every call and injects nothing. Production means any of:
 * `process.env.NODE_ENV === "production"`, `import.meta.env.PROD === true`, or
 * `environment: "production"` (or `"prod"`) passed in. There is no override.
 *
 * Kept from the n2 version: `withChaos`, `chaosMiddleware`, `chaosWrap`,
 * `ChaosError`, and the `{ enabled, errorRate, latencyMs }` config, which maps to
 * `faults: [{ kind: "error", rate: errorRate }, { kind: "latency", rate: 1 - errorRate,
 * minMs, maxMs }]` (latency on every call that did not error, as before).
 *
 * The same decisions are made by the Rust build (`mzizi_assurance::chaos`), held to
 * one contract (`contracts/lib/chaos.contract.json`) and one fixture
 * (`__tests__/fixtures/resilience/chaos.cases.json`).
 *
 * Install via: npx shadcn@latest add https://api.mzizi.dev/v1/ui/chaos
 */

import { createLogger } from "./observability";

const logger = createLogger("chaos");

// ─── The N5 fault interface ────────────────────────────────────────────────

/** One injected fault, as the N5 resilience pipeline applies it. */
export type Fault =
  | { kind: "error" }
  | { kind: "latency"; ms: number }
  | { kind: "timeout" }
  | { kind: "drop" }
  | { kind: "truncate" }
  | { kind: "malformed" };

export type FaultKind = Fault["kind"];

/** Anything that decides, per invocation, whether to inject a fault. */
export interface FaultInjector {
  decide(): Fault | null;
}

/** The mulberry32 generator, exactly as the resilience spec pins it. */
export function mulberry32(seed: number): { nextU32(): number } {
  let state = seed >>> 0;
  return {
    nextU32(): number {
      state = (state + 0x6d2b79f5) >>> 0;
      let t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t = (t + Math.imul(t ^ (t >>> 7), t | 61)) ^ t;
      return (t ^ (t >>> 14)) >>> 0;
    },
  };
}

/** Raised (or rejected) by an injected fault. `code` is always `"chaos"`. */
export class ChaosError extends Error {
  readonly code = "chaos" as const;
  /** Always true: an injected failure, never a real one. */
  readonly injected = true as const;
  readonly kind: FaultKind;

  constructor(kind: FaultKind, message?: string) {
    super(message ?? `Chaos ${kind} injected`);
    this.name = "ChaosError";
    this.kind = kind;
  }

  /** The n2 name for `kind`. */
  get chaosType(): FaultKind {
    return this.kind;
  }
}

/** The configuration is invalid. `code` is always `"config"`. */
export class ResilienceConfigError extends RangeError {
  readonly code = "config" as const;

  constructor(message: string) {
    super(message);
    this.name = "ResilienceConfigError";
  }
}

// ─── The production guard ──────────────────────────────────────────────────

/** Chaos was enabled in production. `code` is always `"chaos-forbidden"`. */
export class ChaosForbiddenError extends Error {
  readonly code = "chaos-forbidden" as const;

  constructor() {
    super("Chaos is forbidden in production; there is no override");
    this.name = "ChaosForbiddenError";
  }
}

const PRODUCTION_NAMES = new Set(["production", "prod"]);

// Module-scoped and type-only, so a project without Node's types compiles; the
// emitted code reads the real global (or throws where there is none, caught below).
declare const process: { env: { NODE_ENV?: string } };

/**
 * Whether this is production. True when `environment` names production
 * (`"production"` or `"prod"`, any case), when `process.env.NODE_ENV` is
 * `"production"`, or when `import.meta.env.PROD` is `true`. An explicit
 * non-production `environment` does NOT override the other two: there is no way
 * to switch the guard off.
 */
export function isProductionEnvironment(environment?: string): boolean {
  if (
    environment !== undefined &&
    PRODUCTION_NAMES.has(environment.trim().toLowerCase())
  )
    return true;
  try {
    // Written out in full so bundlers that replace `process.env.NODE_ENV` see it.
    if (process.env.NODE_ENV === "production") return true;
  } catch {
    // No `process` here (a browser, a Worker without node compat).
  }
  try {
    // Written out literally so Vite, Astro and Vitest replace or stub it (a cast
    // or an alias hides it from them). `import.meta.env` is typed only where
    // Vite's types are loaded, hence the ignore rather than an expect-error.
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (import.meta.env.PROD === true) return true;
  } catch {
    // No `import.meta.env` here.
  }
  return false;
}

// ─── Configuration ─────────────────────────────────────────────────────────

/** A fault and how often it fires. `minMs`/`maxMs` are for `latency` only. */
export type FaultSpec =
  | { kind: "latency"; rate: number; minMs: number; maxMs: number }
  | { kind: Exclude<FaultKind, "latency">; rate: number };

/** What a `truncate` or `malformed` fault does to a value it cannot handle itself. */
export type ChaosMutate = (
  value: unknown,
  kind: "truncate" | "malformed",
) => unknown;

export interface ChaosOptions {
  /** Master switch (default: false). Nothing is validated or injected while off. */
  enabled?: boolean;
  /** mulberry32 seed, an unsigned 32-bit integer (default: 0). */
  seed?: number;
  /** Faults in order; each `rate` in [0, 1], the rates summing to at most 1. */
  faults?: FaultSpec[];
  /** Explicit decisions: entry i is invocation i's fault (`null` = none). Used up first. */
  schedule?: (Fault | null)[];
  /** The host's environment name. `"production"`/`"prod"` forbids chaos. */
  environment?: string;
  /** Rewrites a result a `truncate`/`malformed` fault cannot handle itself. */
  mutate?: ChaosMutate;
  /** n2 config: chance of an error (default 0.3). Ignored when `faults` is given. */
  errorRate?: number;
  /** n2 config: latency range `[min, max]` ms for every call that did not error (default [100, 500]). */
  latencyMs?: [number, number];
}

/** The n2 name for the options, kept so existing imports compile. */
export type ChaosConfig = ChaosOptions;

const LEGACY_ERROR_RATE = 0.3;
const LEGACY_LATENCY_MS: [number, number] = [100, 500];
const TWO_POW_32 = 4294967296;
const KINDS: readonly FaultKind[] = [
  "error",
  "latency",
  "timeout",
  "drop",
  "truncate",
  "malformed",
];

function isMs(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function isRate(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= 1
  );
}

/**
 * The faults a configuration means: `faults` as given, or the n2 mapping of
 * `errorRate`/`latencyMs` when `faults` is absent.
 */
export function resolveFaults(options: ChaosOptions): FaultSpec[] {
  if (options.faults !== undefined) return options.faults;
  const errorRate = options.errorRate ?? LEGACY_ERROR_RATE;
  const [minMs, maxMs] = options.latencyMs ?? LEGACY_LATENCY_MS;
  return [
    { kind: "error", rate: errorRate },
    { kind: "latency", rate: 1 - errorRate, minMs, maxMs },
  ];
}

function validateFault(fault: Fault | null, where: string): void {
  if (fault === null) return;
  if (typeof fault !== "object" || !KINDS.includes(fault.kind)) {
    throw new ResilienceConfigError(`${where}: unknown fault kind`);
  }
  if (fault.kind === "latency" && !isMs(fault.ms)) {
    throw new ResilienceConfigError(
      `${where}: latency ms must be a non-negative integer`,
    );
  }
}

/** Validate a configuration. Throws `ResilienceConfigError` naming the first problem. */
export function validateChaosOptions(options: ChaosOptions): void {
  if (
    options.seed !== undefined &&
    !(
      Number.isInteger(options.seed) &&
      options.seed >= 0 &&
      options.seed < TWO_POW_32
    )
  ) {
    throw new ResilienceConfigError("seed must be an unsigned 32-bit integer");
  }
  if (
    options.faults !== undefined &&
    (options.errorRate !== undefined || options.latencyMs !== undefined)
  ) {
    throw new ResilienceConfigError(
      "give faults, or errorRate/latencyMs, not both",
    );
  }
  if (
    options.faults === undefined &&
    options.errorRate !== undefined &&
    !isRate(options.errorRate)
  ) {
    throw new ResilienceConfigError("errorRate must be in [0, 1]");
  }
  const faults = resolveFaults(options);
  if (!Array.isArray(faults))
    throw new ResilienceConfigError("faults must be a list");
  let sum = 0;
  faults.forEach((fault, i) => {
    if (
      fault === null ||
      typeof fault !== "object" ||
      !KINDS.includes(fault.kind)
    ) {
      throw new ResilienceConfigError(`faults[${i}]: unknown fault kind`);
    }
    if (!isRate(fault.rate))
      throw new ResilienceConfigError(`faults[${i}]: rate must be in [0, 1]`);
    if (fault.kind === "latency") {
      if (!isMs(fault.minMs) || !isMs(fault.maxMs)) {
        throw new ResilienceConfigError(
          `faults[${i}]: minMs and maxMs must be non-negative integers`,
        );
      }
      if (fault.minMs > fault.maxMs)
        throw new ResilienceConfigError(`faults[${i}]: minMs is above maxMs`);
    }
    sum += fault.rate;
  });
  if (sum > 1 + 1e-9)
    throw new ResilienceConfigError("fault rates sum to more than 1");
  if (options.schedule !== undefined) {
    if (!Array.isArray(options.schedule))
      throw new ResilienceConfigError("schedule must be a list");
    options.schedule.forEach((fault, i) =>
      validateFault(fault, `schedule[${i}]`),
    );
  }
}

/** `floor(p * 2^32)`, capped at 2^32 so p = 1 means always. */
function threshold(p: number): number {
  return Math.min(Math.floor(p * TWO_POW_32), TWO_POW_32);
}

// ─── The engine ────────────────────────────────────────────────────────────

/**
 * Decides faults, one invocation at a time. Deterministic: the same options give
 * the same sequence of decisions in every build.
 *
 * Per invocation: a remaining `schedule` entry wins. Otherwise draw
 * `u = nextU32()` and walk `faults` in order with cumulative thresholds
 * `floor(cumRate * 2^32)`; the first with `u < threshold` fires. A `latency`
 * fault draws once more: `ms = minMs + nextU32() % (maxMs - minMs + 1)`. No
 * fault, no second draw. A disabled engine decides `null` without drawing.
 */
export class ChaosEngine implements FaultInjector {
  readonly enabled: boolean;
  readonly seed: number;
  private readonly faults: FaultSpec[];
  private readonly thresholds: number[];
  private readonly schedule: (Fault | null)[];
  private readonly environment: string | undefined;
  private readonly rng: { nextU32(): number };
  private position = 0;

  constructor(options: ChaosOptions = {}) {
    this.enabled = options.enabled === true;
    this.environment = options.environment;
    if (this.enabled && isProductionEnvironment(options.environment))
      throw new ChaosForbiddenError();
    validateChaosOptions(options);
    this.seed = options.seed ?? 0;
    this.faults = resolveFaults(options).map((f) => ({ ...f }));
    this.schedule = (options.schedule ?? []).map((f) =>
      f === null ? null : { ...f },
    );
    let cum = 0;
    this.thresholds = this.faults.map((f) => {
      cum += f.rate;
      return threshold(cum);
    });
    this.rng = mulberry32(this.seed);
  }

  /** How many decisions this engine has made. */
  get invocations(): number {
    return this.position;
  }

  decide(): Fault | null {
    if (!this.enabled) return null;
    // The guard again, per call: an environment that turned production after the
    // engine was built still gets nothing injected.
    if (isProductionEnvironment(this.environment)) return null;
    const i = this.position++;
    if (i < this.schedule.length) {
      const entry = this.schedule[i];
      return entry === undefined || entry === null ? null : { ...entry };
    }
    if (this.faults.length === 0) return null;
    const u = this.rng.nextU32();
    for (let k = 0; k < this.faults.length; k++) {
      const fault = this.faults[k];
      const limit = this.thresholds[k];
      if (fault === undefined || limit === undefined || u >= limit) continue;
      if (fault.kind === "latency") {
        const span = fault.maxMs - fault.minMs + 1;
        return {
          kind: "latency",
          ms: fault.minMs + (this.rng.nextU32() % span),
        };
      }
      return { kind: fault.kind };
    }
    return null;
  }
}

/** Build an engine. Same as `new ChaosEngine(options)`. */
export function createChaos(options: ChaosOptions = {}): ChaosEngine {
  return new ChaosEngine(options);
}

// ─── Applying a fault ──────────────────────────────────────────────────────

/** The marker a `malformed` fault returns in place of the result. */
export const MALFORMED_MARKER = '{"mzizi-chaos":';

/** Half a string, by code point. */
export function truncateString(value: string): string {
  const points = Array.from(value);
  return points.slice(0, Math.floor(points.length / 2)).join("");
}

function truncateValue(value: unknown, mutate?: ChaosMutate): unknown {
  if (typeof value === "string") return truncateString(value);
  if (Array.isArray(value)) return value.slice(0, Math.floor(value.length / 2));
  if (value instanceof Uint8Array)
    return value.slice(0, Math.floor(value.length / 2));
  if (value instanceof ArrayBuffer)
    return value.slice(0, Math.floor(value.byteLength / 2));
  if (mutate) return mutate(value, "truncate");
  throw new ChaosError("truncate");
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason);
      return;
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    function onAbort() {
      clearTimeout(timer);
      reject(signal?.reason);
    }
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

function hang(signal?: AbortSignal): Promise<never> {
  return new Promise<never>((_, reject) => {
    if (!signal) return; // never settles: a `timeout` fault is a hang
    const onAbort = () => reject(signal.reason ?? new ChaosError("timeout"));
    if (signal.aborted) onAbort();
    else signal.addEventListener("abort", onAbort, { once: true });
  });
}

export interface ApplyFaultContext {
  /** Cancels a `latency` wait or a `timeout` hang. */
  signal?: AbortSignal;
  /** For results `truncate`/`malformed` cannot handle themselves. */
  mutate?: ChaosMutate;
  /** Replaces the timer for `latency` (tests, virtual clocks). */
  sleep?: (ms: number, signal?: AbortSignal) => Promise<void>;
}

/**
 * Run `op` under a fault. `null` runs it untouched. `error`/`drop` reject with a
 * `ChaosError` without running `op`; `latency` waits then runs it; `timeout`
 * never settles until `signal` aborts; `truncate` cuts a string (by code point),
 * array, `Uint8Array` or `ArrayBuffer` to half its length (other values go to
 * `mutate`, else reject `ChaosError{kind:"truncate"}`); `malformed` replaces the
 * result with `mutate`'s output, or `MALFORMED_MARKER`.
 */
export async function applyFault<T>(
  fault: Fault | null,
  op: () => Promise<T>,
  ctx: ApplyFaultContext = {},
): Promise<T> {
  if (fault === null) return op();
  switch (fault.kind) {
    case "error":
      throw new ChaosError("error");
    case "drop":
      throw new ChaosError("drop", "Chaos: connection dropped");
    case "latency":
      if (fault.ms > 0) await (ctx.sleep ?? sleep)(fault.ms, ctx.signal);
      return op();
    case "timeout":
      return hang(ctx.signal);
    case "truncate":
      return truncateValue(await op(), ctx.mutate) as T;
    case "malformed": {
      const value = await op();
      return (
        ctx.mutate ? ctx.mutate(value, "malformed") : MALFORMED_MARKER
      ) as T;
    }
  }
}

// ─── The n2 entry points ───────────────────────────────────────────────────

/** Options the wrappers take: the engine options, plus how to apply. */
export type WithChaosOptions = ChaosOptions & Omit<ApplyFaultContext, "mutate">;

const engines = new WeakMap<object, ChaosEngine>();

function randomSeed(): number {
  return Math.floor(Math.random() * TWO_POW_32) >>> 0;
}

/**
 * The engine for a wrapper's options. An unseeded wrapper gets a random seed, as
 * the n2 wrappers drew from `Math.random`; give `seed` for a replayable run. The
 * engine is kept per options object, so reusing one object continues one sequence.
 */
function engineFor(options: WithChaosOptions): ChaosEngine {
  let engine = engines.get(options);
  if (!engine) {
    engine = new ChaosEngine(
      options.seed === undefined ? { ...options, seed: randomSeed() } : options,
    );
    engines.set(options, engine);
  }
  return engine;
}

async function runWith<T>(
  engine: FaultInjector,
  fn: () => Promise<T>,
  options: WithChaosOptions,
): Promise<T> {
  const fault = engine.decide();
  if (fault !== null) {
    logger.warn(`Injecting ${fault.kind}`, {
      data:
        fault.kind === "latency"
          ? { kind: fault.kind, ms: fault.ms }
          : { kind: fault.kind },
    });
  }
  return applyFault(fault, fn, {
    signal: options.signal,
    sleep: options.sleep,
    mutate: options.mutate,
  });
}

/**
 * Run `fn` with chaos. Disabled (the default), `fn` runs untouched and nothing is
 * validated. Enabled, one decision is taken from the engine for this options
 * object (or from `engine` when one is passed) and applied.
 *
 * Throws `ChaosForbiddenError` when `enabled` is true in production.
 *
 * @example
 * ```ts
 * const devChaos = { enabled: true, seed: 42, faults: [{ kind: "drop", rate: 0.2 }] }
 * const data = await withChaos(() => fetch("/api/weather"), devChaos)
 * ```
 */
export async function withChaos<T>(
  fn: () => Promise<T>,
  config?: WithChaosOptions | ChaosEngine,
): Promise<T> {
  if (config instanceof ChaosEngine) return runWith(config, fn, {});
  if (!config || config.enabled !== true) return fn();
  return runWith(engineFor(config), fn, config);
}

/**
 * A middleware with one engine for every call it wraps, so a seeded middleware
 * replays one sequence across calls.
 *
 * Throws `ChaosForbiddenError` here, at creation, when `enabled` is true in
 * production.
 */
export function chaosMiddleware(
  config?: WithChaosOptions,
): <T>(fn: () => Promise<T>) => Promise<T> {
  if (!config || config.enabled !== true)
    return <T>(fn: () => Promise<T>) => fn();
  const engine = engineFor({ ...config });
  return <T>(fn: () => Promise<T>) => runWith(engine, fn, config);
}

/**
 * A chaos-wrapped version of a function, with one engine for all its calls.
 *
 * Throws `ChaosForbiddenError` here, at creation, when `enabled` is true in
 * production.
 */
export function chaosWrap<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  config?: WithChaosOptions,
): (...args: TArgs) => Promise<TResult> {
  const middleware = chaosMiddleware(config);
  return (...args: TArgs) => middleware(() => fn(...args));
}
