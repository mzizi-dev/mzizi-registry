// GENERATED — DO NOT EDIT.
//
// Copied verbatim from components/registry/n8-assurance/observability.rs by scripts/generate-rust-components.mjs.
// That file is the one a human edits; this is the copy `cargo package` can ship,
// because a tarball only carries files under the crate root.
//
// Regenerate with `pnpm rust:generate`. CI runs `pnpm rust:generate:check`,
// which fails if this copy and its source have drifted.

//! Mzizi N8 assurance — structured log events, injectable sinks, redaction.
//!
//! The Rust build of `observability`, held to the same contract
//! (`contracts/lib/observability.contract.json`) and the same fixture
//! (`__tests__/fixtures/resilience/observability.cases.json`) as the `.ts`
//! sibling: the same input gives the same event and the same JSON line.
//!
//! An event is `{ ts, level, module, msg, traceId?, data? }`. A [`Logger`] builds
//! it and hands it to each [`Sink`]; the host decides where it goes (stderr, a
//! Worker's `console`, a queue), because this crate does no I/O. The clock is the
//! host's too.
//!
//! The N8 covenant (never store PII) is enforced here, not left to callers:
//! [`redact`] replaces the value of any key matching
//! `pass(word)?|secret|token|authori[sz]ation|cookie|api[-_]?key|email|phone|ssn|card`
//! (ASCII case-insensitive, anywhere in the key) with `"[redacted]"` at any depth,
//! and an error is only ever its [`ErrorSummary`] — `{ name, code }`, never the
//! message.
//!
//! Severity classification and error deduplication already live in
//! [`crate::mzizi_error_tracker`]; span export lives in [`crate::mzizi_otel`].
//! This module is the logger they and the hosts share, not a second copy of
//! either.

use std::cell::RefCell;
use std::fmt::Write as _;

/// The value a redacted key's value is replaced with.
pub const REDACTED: &str = "[redacted]";

/// The module an event carries when the caller named none.
pub const DEFAULT_MODULE: &str = "mzizi";

/// How deep [`redact`] walks before it stops; deeper values become `"[depth]"`.
pub const MAX_DEPTH: usize = 8;

/// The substrings that make a key sensitive, lowercased. Equivalent to the `.ts`
/// pattern `/pass(word)?|secret|token|authori[sz]ation|cookie|api[-_]?key|email|phone|ssn|card/i`.
const SENSITIVE: [&str; 13] = [
    "pass",
    "secret",
    "token",
    "authorization",
    "authorisation",
    "cookie",
    "apikey",
    "api-key",
    "api_key",
    "email",
    "phone",
    "ssn",
    "card",
];

/// True when a key's value must never be logged.
#[must_use]
pub fn is_sensitive_key(key: &str) -> bool {
    let lower = key.to_ascii_lowercase();
    SENSITIVE.iter().any(|s| lower.contains(s))
}

/// A log level.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub enum Level {
    /// Detail for developers.
    Debug,
    /// Normal operation.
    Info,
    /// Degraded, not failed.
    Warn,
    /// Failed.
    Error,
}

impl Level {
    /// The wire spelling: `debug`, `info`, `warn`, `error`.
    #[must_use]
    pub const fn as_str(self) -> &'static str {
        match self {
            Self::Debug => "debug",
            Self::Info => "info",
            Self::Warn => "warn",
            Self::Error => "error",
        }
    }

    /// Parse the wire spelling.
    #[must_use]
    pub fn parse(s: &str) -> Option<Self> {
        Some(match s {
            "debug" => Self::Debug,
            "info" => Self::Info,
            "warn" => Self::Warn,
            "error" => Self::Error,
            _ => return None,
        })
    }
}

/// What an error becomes in an event: its name and code, never its message.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ErrorSummary {
    /// The error's type name (`TimeoutError`, `ChaosError`).
    pub name: String,
    /// The stable code, when it has one (`timeout`, `chaos`).
    pub code: Option<String>,
}

impl ErrorSummary {
    /// A summary from a name and an optional code. An empty name reads `Error`.
    #[must_use]
    pub fn new(name: impl Into<String>, code: Option<&str>) -> Self {
        let name = name.into();
        Self {
            name: if name.is_empty() {
                "Error".to_owned()
            } else {
                name
            },
            code: code.map(str::to_owned),
        }
    }

    fn to_value(&self) -> Value {
        let mut fields = vec![("name".to_owned(), Value::Str(self.name.clone()))];
        if let Some(code) = &self.code {
            fields.push(("code".to_owned(), Value::Str(code.clone())));
        }
        Value::Map(fields)
    }
}

/// Structured data, in insertion order (so the JSON line matches the `.ts`).
#[derive(Debug, Clone, PartialEq)]
pub enum Value {
    /// `null`.
    Null,
    /// A boolean.
    Bool(bool),
    /// An integer.
    Int(i64),
    /// A float. Non-finite values serialise as `null`.
    Float(f64),
    /// A string.
    Str(String),
    /// A list.
    List(Vec<Value>),
    /// An object, keys in insertion order.
    Map(Vec<(String, Value)>),
    /// An error. [`redact`] turns it into `{ name, code }`.
    Error(ErrorSummary),
}

fn redact_at(value: &Value, depth: usize) -> Value {
    match value {
        Value::Error(e) => e.to_value(),
        Value::Float(f) if !f.is_finite() => Value::Null,
        Value::List(_) | Value::Map(_) if depth >= MAX_DEPTH => Value::Str("[depth]".to_owned()),
        Value::List(items) => Value::List(items.iter().map(|v| redact_at(v, depth + 1)).collect()),
        Value::Map(fields) => Value::Map(
            fields
                .iter()
                .map(|(k, v)| {
                    let out = if is_sensitive_key(k) {
                        Value::Str(REDACTED.to_owned())
                    } else {
                        redact_at(v, depth + 1)
                    };
                    (k.clone(), out)
                })
                .collect(),
        ),
        other => other.clone(),
    }
}

/// Redact a value for logging: sensitive keys become `"[redacted]"`, errors
/// become `{ name, code }`, non-finite floats `null`, and anything nested past
/// [`MAX_DEPTH`] `"[depth]"`. The input is not changed.
#[must_use]
pub fn redact(value: &Value) -> Value {
    redact_at(value, 0)
}

/// What a caller adds to a message.
#[derive(Debug, Clone, PartialEq, Default)]
pub struct LogContext {
    /// Module or component name. Defaults to the logger's.
    pub module: Option<String>,
    /// Structured data. Redacted before any sink sees it.
    pub data: Option<Vec<(String, Value)>>,
    /// An error, recorded as `data.error = { name, code }`.
    pub error: Option<ErrorSummary>,
    /// Correlation id.
    pub trace_id: Option<String>,
}

/// One structured event, as every sink receives it.
#[derive(Debug, Clone, PartialEq)]
pub struct LogEvent {
    /// Milliseconds since the Unix epoch. Serialised as ISO-8601 UTC.
    pub ts_ms: i64,
    /// The level.
    pub level: Level,
    /// The module.
    pub module: String,
    /// The message.
    pub msg: String,
    /// The correlation id.
    pub trace_id: Option<String>,
    /// The redacted data.
    pub data: Option<Vec<(String, Value)>>,
}

impl LogEvent {
    /// Build the event a logger would emit, redacting the data.
    #[must_use]
    pub fn build(level: Level, msg: &str, ctx: &LogContext, ts_ms: i64) -> Self {
        let mut data = ctx
            .data
            .as_ref()
            .map(|fields| match redact(&Value::Map(fields.clone())) {
                Value::Map(f) => f,
                _ => Vec::new(),
            });
        if let Some(error) = &ctx.error {
            // As `{ ...data, error }` does: an existing `error` key keeps its place.
            let fields = data.get_or_insert_with(Vec::new);
            match fields.iter_mut().find(|(k, _)| k == "error") {
                Some((_, v)) => *v = error.to_value(),
                None => fields.push(("error".to_owned(), error.to_value())),
            }
        }
        Self {
            ts_ms,
            level,
            module: ctx
                .module
                .clone()
                .filter(|m| !m.is_empty())
                .unwrap_or_else(|| DEFAULT_MODULE.to_owned()),
            msg: msg.to_owned(),
            trace_id: ctx.trace_id.clone().filter(|t| !t.is_empty()),
            data,
        }
    }

    /// The console line, without data: `[mzizi:api] INFO msg [trace:id]`.
    #[must_use]
    pub fn line(&self) -> String {
        let mut out = format_prefix(self.level, Some(&self.module));
        out.push(' ');
        out.push_str(&self.msg);
        if let Some(trace) = &self.trace_id {
            let _ = write!(out, " [trace:{trace}]");
        }
        out
    }

    /// The JSON line, keys in the order `ts, level, module, msg, traceId, data`,
    /// identical to the `.ts` `toJson`.
    #[must_use]
    pub fn to_json(&self) -> String {
        let mut out = String::with_capacity(128);
        out.push_str("{\"ts\":");
        write_json_str(&iso8601(self.ts_ms), &mut out);
        out.push_str(",\"level\":");
        write_json_str(self.level.as_str(), &mut out);
        out.push_str(",\"module\":");
        write_json_str(&self.module, &mut out);
        out.push_str(",\"msg\":");
        write_json_str(&self.msg, &mut out);
        if let Some(trace) = &self.trace_id {
            out.push_str(",\"traceId\":");
            write_json_str(trace, &mut out);
        }
        if let Some(data) = &self.data {
            out.push_str(",\"data\":");
            write_json_map(data, &mut out);
        }
        out.push('}');
        out
    }
}

/// The readable prefix: `[mzizi:<module>] LEVEL`, or `[mzizi] LEVEL`.
#[must_use]
pub fn format_prefix(level: Level, module: Option<&str>) -> String {
    let upper = level.as_str().to_ascii_uppercase();
    match module {
        Some(m) if !m.is_empty() && m != DEFAULT_MODULE => format!("[mzizi:{m}] {upper}"),
        _ => format!("[mzizi] {upper}"),
    }
}

/// Escape a string as `JSON.stringify` does: quote, backslash, the short forms,
/// and the other C0 controls as `\u00xx`. Nothing else (unlike the OTLP encoder
/// in `mzizi_otel`, which also escapes C1 controls).
fn write_json_str(s: &str, out: &mut String) {
    out.push('"');
    for c in s.chars() {
        match c {
            '"' => out.push_str("\\\""),
            '\\' => out.push_str("\\\\"),
            '\n' => out.push_str("\\n"),
            '\r' => out.push_str("\\r"),
            '\t' => out.push_str("\\t"),
            '\u{8}' => out.push_str("\\b"),
            '\u{c}' => out.push_str("\\f"),
            c if (c as u32) < 0x20 => {
                let _ = write!(out, "\\u{:04x}", c as u32);
            }
            c => out.push(c),
        }
    }
    out.push('"');
}

fn write_json_map(fields: &[(String, Value)], out: &mut String) {
    out.push('{');
    for (i, (k, v)) in fields.iter().enumerate() {
        if i > 0 {
            out.push(',');
        }
        write_json_str(k, out);
        out.push(':');
        write_json_value(v, out);
    }
    out.push('}');
}

fn write_json_value(value: &Value, out: &mut String) {
    match value {
        Value::Null => out.push_str("null"),
        Value::Bool(b) => out.push_str(if *b { "true" } else { "false" }),
        Value::Int(i) => {
            let _ = write!(out, "{i}");
        }
        Value::Float(f) if f.is_finite() => {
            let _ = write!(out, "{f}");
        }
        Value::Float(_) => out.push_str("null"),
        Value::Str(s) => write_json_str(s, out),
        Value::List(items) => {
            out.push('[');
            for (i, v) in items.iter().enumerate() {
                if i > 0 {
                    out.push(',');
                }
                write_json_value(v, out);
            }
            out.push(']');
        }
        Value::Map(fields) => write_json_map(fields, out),
        Value::Error(e) => write_json_value(&e.to_value(), out),
    }
}

/// Milliseconds since the epoch as ISO-8601 UTC with milliseconds, the way
/// `Date.prototype.toISOString` writes it (`±YYYYYY` outside years 0–9999).
#[must_use]
pub fn iso8601(ms: i64) -> String {
    let days = ms.div_euclid(86_400_000);
    let rem = ms.rem_euclid(86_400_000);
    // Howard Hinnant's days-to-civil.
    let z = days + 719_468;
    let era = z.div_euclid(146_097);
    let doe = z.rem_euclid(146_097);
    let yoe = (doe - doe / 1460 + doe / 36_524 - doe / 146_096) / 365;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let day = doy - (153 * mp + 2) / 5 + 1;
    let month = if mp < 10 { mp + 3 } else { mp - 9 };
    let year = yoe + era * 400 + i64::from(month <= 2);
    let (h, m, s, milli) = (
        rem / 3_600_000,
        rem / 60_000 % 60,
        rem / 1000 % 60,
        rem % 1000,
    );
    let year_str = if (0..=9999).contains(&year) {
        format!("{year:04}")
    } else if year < 0 {
        format!("-{:06}", -year)
    } else {
        format!("+{year:06}")
    };
    format!("{year_str}-{month:02}-{day:02}T{h:02}:{m:02}:{s:02}.{milli:03}Z")
}

/// A destination for events. A sink must not panic; logging never fails its caller.
pub trait Sink {
    /// Receive one event.
    fn emit(&self, event: &LogEvent);
}

impl<F: Fn(&LogEvent)> Sink for F {
    fn emit(&self, event: &LogEvent) {
        self(event);
    }
}

/// Keeps events in memory: for tests, and hosts that batch.
#[derive(Debug, Default)]
pub struct MemorySink {
    events: RefCell<Vec<LogEvent>>,
}

impl MemorySink {
    /// An empty sink.
    #[must_use]
    pub fn new() -> Self {
        Self::default()
    }

    /// Everything received so far.
    #[must_use]
    pub fn events(&self) -> Vec<LogEvent> {
        self.events.borrow().clone()
    }

    /// Take everything received so far, leaving the sink empty.
    pub fn drain(&self) -> Vec<LogEvent> {
        std::mem::take(&mut *self.events.borrow_mut())
    }
}

impl Sink for MemorySink {
    fn emit(&self, event: &LogEvent) {
        self.events.borrow_mut().push(event.clone());
    }
}

impl<S: Sink + ?Sized> Sink for std::rc::Rc<S> {
    fn emit(&self, event: &LogEvent) {
        (**self).emit(event);
    }
}

/// A logger bound to one module, with the host's sinks and clock.
pub struct Logger {
    module: String,
    sinks: Vec<Box<dyn Sink>>,
    clock: Box<dyn Fn() -> i64>,
    min_level: Level,
}

impl std::fmt::Debug for Logger {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("Logger")
            .field("module", &self.module)
            .field("sinks", &self.sinks.len())
            .field("min_level", &self.min_level)
            .finish_non_exhaustive()
    }
}

impl Logger {
    /// A logger for `module` reading time from `clock` (ms since the epoch). It
    /// has no sinks until [`Logger::with_sink`] adds one.
    pub fn new(module: impl Into<String>, clock: impl Fn() -> i64 + 'static) -> Self {
        Self {
            module: module.into(),
            sinks: Vec::new(),
            clock: Box::new(clock),
            min_level: Level::Debug,
        }
    }

    /// Add a sink.
    #[must_use]
    pub fn with_sink(mut self, sink: impl Sink + 'static) -> Self {
        self.sinks.push(Box::new(sink));
        self
    }

    /// Drop events below `level`.
    #[must_use]
    pub const fn with_min_level(mut self, level: Level) -> Self {
        self.min_level = level;
        self
    }

    /// The module this logger is bound to.
    #[must_use]
    pub fn module(&self) -> &str {
        &self.module
    }

    /// Build and emit an event. Returns it (redacted), or `None` when filtered.
    pub fn log(&self, level: Level, msg: &str, mut ctx: LogContext) -> Option<LogEvent> {
        if level < self.min_level {
            return None;
        }
        if ctx.module.is_none() {
            ctx.module = Some(self.module.clone());
        }
        let event = LogEvent::build(level, msg, &ctx, (self.clock)());
        for sink in &self.sinks {
            sink.emit(&event);
        }
        Some(event)
    }

    /// Log at debug.
    pub fn debug(&self, msg: &str, ctx: LogContext) -> Option<LogEvent> {
        self.log(Level::Debug, msg, ctx)
    }

    /// Log at info.
    pub fn info(&self, msg: &str, ctx: LogContext) -> Option<LogEvent> {
        self.log(Level::Info, msg, ctx)
    }

    /// Log at warn.
    pub fn warn(&self, msg: &str, ctx: LogContext) -> Option<LogEvent> {
        self.log(Level::Warn, msg, ctx)
    }

    /// Log at error.
    pub fn error(&self, msg: &str, ctx: LogContext) -> Option<LogEvent> {
        self.log(Level::Error, msg, ctx)
    }

    /// Record an error without failing. The message is the error's name (and
    /// code), never its message: `TimeoutError (timeout)`.
    pub fn track_error(&self, error: ErrorSummary, mut ctx: LogContext) -> Option<LogEvent> {
        let msg = match &error.code {
            Some(code) => format!("{} ({code})", error.name),
            None => error.name.clone(),
        };
        ctx.error = Some(error);
        self.log(Level::Error, &msg, ctx)
    }

    /// Time `f`. Logs `<label> completed in <n>ms` (info) or
    /// `<label> failed after <n>ms` (error, with `summarise(&err)`), with
    /// `duration` and `label` in the data, and returns what `f` returned.
    pub fn measure<T, E>(
        &self,
        label: &str,
        f: impl FnOnce() -> Result<T, E>,
        summarise: impl FnOnce(&E) -> ErrorSummary,
    ) -> Result<T, E> {
        let started = (self.clock)();
        let result = f();
        let duration = (self.clock)() - started;
        let data = vec![
            ("duration".to_owned(), Value::Int(duration)),
            ("label".to_owned(), Value::Str(label.to_owned())),
        ];
        match &result {
            Ok(_) => {
                self.info(
                    &format!("{label} completed in {duration}ms"),
                    LogContext {
                        data: Some(data),
                        ..LogContext::default()
                    },
                );
            }
            Err(e) => {
                self.error(
                    &format!("{label} failed after {duration}ms"),
                    LogContext {
                        data: Some(data),
                        error: Some(summarise(e)),
                        ..LogContext::default()
                    },
                );
            }
        }
        result
    }
}
