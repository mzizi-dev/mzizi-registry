/**
 * Observability for Mzizi: structured log events, injectable sinks, redaction.
 *
 * N8 assurance. Every event is a plain object
 * `{ ts, level, module, msg, traceId?, data? }` handed to each sink in turn. The
 * default sink writes the readable `[mzizi:<module>] LEVEL msg` line to the
 * console, as this module always has; `jsonSink` writes one JSON line per event
 * for log drains. A host swaps or adds sinks with `configureObservability`.
 *
 * The N8 covenant (never store PII) is enforced here, not left to callers:
 *
 * - `data` is redacted before any sink sees it: a key matching
 *   `pass(word)?|secret|token|authori[sz]ation|cookie|api[-_]?key|email|phone|ssn|card`
 *   (any case, anywhere in the key) has its value replaced by `"[redacted]"`, at
 *   any depth.
 * - An error is reduced to `{ name, code }`. Its message and stack never reach a
 *   sink, because a message is where user input ends up.
 *
 * The same rules, the same event shape and the same JSON line are implemented in
 * Rust (`mzizi_assurance::observability`), held to one contract
 * (`contracts/lib/observability.contract.json`) and one fixture
 * (`__tests__/fixtures/resilience/observability.cases.json`).
 *
 * Framework-free: no imports, runs in Node, a Worker, Deno, Astro and the browser.
 *
 * Install via: npx shadcn@latest add https://api.mzizi.dev/v1/ui/observability
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext {
  /** Module or component name (e.g. "registry", "weather-chart"). */
  module?: string;
  /** Structured data. Redacted before any sink sees it. */
  data?: Record<string, unknown>;
  /** An error. Reduced to `{ name, code }` under `data.error`. */
  error?: unknown;
  /** Correlation id (a request or session id). */
  traceId?: string;
}

/** One structured event, as every sink receives it. */
export interface LogEvent {
  /** ISO-8601 UTC timestamp. */
  ts: string;
  level: LogLevel;
  module: string;
  msg: string;
  traceId?: string;
  data?: Record<string, unknown>;
}

/** A destination for events. A sink that throws is skipped; logging never throws. */
export type LogSink = (event: LogEvent) => void;

/** What an error becomes in an event. */
export interface ErrorSummary {
  name: string;
  code?: string;
}

/** The value a redacted key's value is replaced with. */
export const REDACTED = "[redacted]";

/** The module an event carries when the caller named none. */
export const DEFAULT_MODULE = "mzizi";

/** Keys whose values are replaced by `REDACTED`, at any depth. */
export const REDACT_KEY =
  /pass(word)?|secret|token|authori[sz]ation|cookie|api[-_]?key|email|phone|ssn|card/i;

/** How deep `redact` walks before it stops; deeper values become `"[depth]"`. */
export const MAX_DEPTH = 8;

/** True when a key's value must never be logged. */
export function isSensitiveKey(key: string): boolean {
  return REDACT_KEY.test(key);
}

/** Reduce an error (or anything thrown) to `{ name, code }`. Never the message. */
export function errorSummary(error: unknown): ErrorSummary {
  if (error !== null && typeof error === "object") {
    const e = error as { name?: unknown; code?: unknown };
    const name = typeof e.name === "string" && e.name !== "" ? e.name : "Error";
    const code =
      typeof e.code === "string" || typeof e.code === "number"
        ? String(e.code)
        : undefined;
    return code === undefined ? { name } : { name, code };
  }
  return { name: typeof error === "string" ? "Error" : typeof error };
}

function isPlainObject(value: object): boolean {
  const proto = Object.getPrototypeOf(value) as unknown;
  return proto === Object.prototype || proto === null;
}

function redactValue(
  value: unknown,
  depth: number,
  seen: WeakSet<object>,
): unknown {
  if (value === null || typeof value !== "object") {
    if (typeof value === "bigint") return value.toString();
    if (typeof value === "function" || typeof value === "symbol")
      return undefined;
    if (typeof value === "number" && !Number.isFinite(value)) return null;
    return value;
  }
  if (value instanceof Error) return errorSummary(value);
  if (value instanceof Date)
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  if (depth >= MAX_DEPTH) return "[depth]";
  if (seen.has(value)) return "[circular]";
  seen.add(value);
  try {
    if (Array.isArray(value)) {
      return value.map((item) => {
        const out = redactValue(item, depth + 1, seen);
        return out === undefined ? null : out;
      });
    }
    if (!isPlainObject(value)) {
      // A class instance (Map, URL, Request, …) is not data we can vouch for.
      const name = (value as { constructor?: { name?: unknown } }).constructor
        ?.name;
      return `[${typeof name === "string" && name !== "" ? name : "object"}]`;
    }
    const out: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
      if (isSensitiveKey(key)) {
        out[key] = REDACTED;
        continue;
      }
      const red = redactValue(item, depth + 1, seen);
      if (red !== undefined) out[key] = red;
    }
    return out;
  } finally {
    seen.delete(value);
  }
}

/**
 * Redact a value for logging: sensitive keys become `"[redacted]"`, errors become
 * `{ name, code }`, dates become ISO strings, cycles `"[circular]"`, anything past
 * `MAX_DEPTH` `"[depth]"`, class instances `"[ClassName]"`. Functions and symbols
 * are dropped (array slots become `null`), non-finite numbers become `null`, and
 * bigints become strings. The input is never mutated.
 */
export function redact(value: unknown): unknown {
  return redactValue(value, 0, new WeakSet());
}

// ─── Sinks ─────────────────────────────────────────────────────────────────

function consoleMethod(level: LogLevel): (...args: unknown[]) => void {
  // Looked up per call, never captured at import: a spy or a host that swaps
  // `console` after this module loads still sees every line.
  /* eslint-disable no-console -- the console sink is the logger's output */
  switch (level) {
    case "debug":
      return console.debug;
    case "info":
      return console.info;
    case "warn":
      return console.warn;
    default:
      return console.error;
  }
  /* eslint-enable no-console */
}

/** The readable console prefix: `[mzizi:<module>] LEVEL`, or `[mzizi] LEVEL`. */
export function formatPrefix(level: LogLevel, module?: string): string {
  const tag =
    module && module !== DEFAULT_MODULE ? `[mzizi:${module}]` : "[mzizi]";
  return `${tag} ${level.toUpperCase()}`;
}

/** The console line for an event, without its data: `[mzizi:api] INFO msg [trace:id]`. */
export function formatLine(event: LogEvent): string {
  const line = `${formatPrefix(event.level, event.module)} ${event.msg}`;
  return event.traceId ? `${line} [trace:${event.traceId}]` : line;
}

/** The JSON line for an event; keys in the order `ts, level, module, msg, traceId, data`. */
export function toJson(event: LogEvent): string {
  const ordered: LogEvent = {
    ts: event.ts,
    level: event.level,
    module: event.module,
    msg: event.msg,
  };
  if (event.traceId !== undefined) ordered.traceId = event.traceId;
  if (event.data !== undefined) ordered.data = event.data;
  return JSON.stringify(ordered);
}

/** Writes `[mzizi:<module>] LEVEL msg [trace:id]` and the (redacted) data to the console. */
export const consoleSink: LogSink = (event) => {
  const write = consoleMethod(event.level);
  if (event.data !== undefined) write(formatLine(event), event.data);
  else write(formatLine(event));
};

/** Writes one JSON line per event to the console, for log drains. */
export const jsonSink: LogSink = (event) => {
  consoleMethod(event.level)(toJson(event));
};

/** A sink that keeps events in memory: for tests and for hosts that batch. */
export function memorySink(): LogSink & { events: LogEvent[] } {
  const events: LogEvent[] = [];
  const sink = ((event: LogEvent) => {
    events.push(event);
  }) as LogSink & { events: LogEvent[] };
  sink.events = events;
  return sink;
}

// ─── Configuration ─────────────────────────────────────────────────────────

export interface ObservabilityOptions {
  /** Replaces the sinks (default: `[consoleSink]`). */
  sinks?: LogSink[];
  /** Milliseconds since the epoch (default: `Date.now`). */
  now?: () => number;
  /** Events below this level are dropped (default: `"debug"`, everything). */
  minLevel?: LogLevel;
}

const LEVEL_RANK: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

let sinks: LogSink[] = [consoleSink];
let now: () => number = () => Date.now();
let minLevel: LogLevel = "debug";

/** Configure the process-wide sinks, clock and level. Unset fields are kept. */
export function configureObservability(options: ObservabilityOptions): void {
  if (options.sinks !== undefined) sinks = [...options.sinks];
  if (options.now !== undefined) now = options.now;
  if (options.minLevel !== undefined) minLevel = options.minLevel;
}

/** Add a sink; returns a function that removes it again. */
export function addSink(sink: LogSink): () => void {
  sinks = [...sinks, sink];
  return () => {
    sinks = sinks.filter((s) => s !== sink);
  };
}

/** Back to the defaults: the console sink, `Date.now`, every level. */
export function resetObservability(): void {
  sinks = [consoleSink];
  now = () => Date.now();
  minLevel = "debug";
}

/**
 * Build the event `log` would emit, without emitting it. Pure apart from the
 * clock: the same context gives the same event on every build.
 */
export function buildEvent(
  level: LogLevel,
  message: string,
  ctx?: LogContext,
  at?: number,
): LogEvent {
  const event: LogEvent = {
    ts: new Date(at ?? now()).toISOString(),
    level,
    module: ctx?.module || DEFAULT_MODULE,
    msg: message,
  };
  if (ctx?.traceId) event.traceId = ctx.traceId;
  let data =
    ctx?.data !== undefined
      ? (redact(ctx.data) as Record<string, unknown>)
      : undefined;
  if (ctx?.error !== undefined)
    data = { ...data, error: errorSummary(ctx.error) };
  if (data !== undefined) event.data = data;
  return event;
}

function emit(level: LogLevel, message: string, ctx?: LogContext): void {
  if (LEVEL_RANK[level] < LEVEL_RANK[minLevel]) return;
  let event: LogEvent;
  try {
    event = buildEvent(level, message, ctx);
  } catch {
    return;
  }
  for (const sink of sinks) {
    try {
      sink(event);
    } catch {
      // A broken sink must not break the caller or starve the other sinks.
    }
  }
}

/**
 * Structured logger.
 *
 * @example
 * ```ts
 * import { log } from "@/lib/observability"
 *
 * log.info("Server started", { module: "api", data: { port: 11736 } })
 * log.error("Failed to fetch", { module: "weather", error: new Error("timeout") })
 * // [mzizi:weather] ERROR Failed to fetch { error: { name: "Error" } }
 * ```
 */
export const log = {
  debug(message: string, ctx?: LogContext) {
    emit("debug", message, ctx);
  },
  info(message: string, ctx?: LogContext) {
    emit("info", message, ctx);
  },
  warn(message: string, ctx?: LogContext) {
    emit("warn", message, ctx);
  },
  error(message: string, ctx?: LogContext) {
    emit("error", message, ctx);
  },
};

/**
 * Measure a sync or async function. Logs `<label> completed in <n>ms` (info) or
 * `<label> failed after <n>ms` (error, with the error as `{ name, code }`) and
 * returns or rethrows exactly what the function did.
 */
export async function measure<T>(
  label: string,
  fn: () => T | Promise<T>,
  ctx?: LogContext,
): Promise<T> {
  const started = now();
  try {
    const result = await fn();
    const duration = Math.round(now() - started);
    log.info(`${label} completed in ${duration}ms`, {
      ...ctx,
      module: ctx?.module ?? "perf",
      data: { ...ctx?.data, duration, label },
    });
    return result;
  } catch (error) {
    const duration = Math.round(now() - started);
    log.error(`${label} failed after ${duration}ms`, {
      ...ctx,
      module: ctx?.module ?? "perf",
      data: { ...ctx?.data, duration, label },
      error,
    });
    throw error;
  }
}

/**
 * Record an error without throwing. The event's message is the error's name (and
 * code), never its message.
 */
export function trackError(error: unknown, ctx?: LogContext): void {
  const summary = errorSummary(error);
  const msg =
    summary.code !== undefined
      ? `${summary.name} (${summary.code})`
      : summary.name;
  log.error(msg, { ...ctx, error });
}

/** A logger bound to one module: `createLogger("registry").info(...)` → `[mzizi:registry] INFO ...`. */
export function createLogger(module: string) {
  return {
    debug(message: string, ctx?: Omit<LogContext, "module">) {
      log.debug(message, { ...ctx, module });
    },
    info(message: string, ctx?: Omit<LogContext, "module">) {
      log.info(message, { ...ctx, module });
    },
    warn(message: string, ctx?: Omit<LogContext, "module">) {
      log.warn(message, { ...ctx, module });
    },
    error(message: string, ctx?: Omit<LogContext, "module">) {
      log.error(message, { ...ctx, module });
    },
  };
}
