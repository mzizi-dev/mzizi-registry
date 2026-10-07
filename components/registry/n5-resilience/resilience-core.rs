//! The shared ground of the Mzizi resilience node (N5): the `Runtime` the async wrappers
//! run on, the one error type every primitive returns, error codes and config validation.
//!
//! Ground rules (one behaviour spec for every build, mzizi-registry#472):
//!
//! - Time is integer milliseconds. Every sans-IO core takes `now` explicitly; the async
//!   wrappers are generic over a [`Runtime`] (a clock and a sleep), so the crate needs no
//!   async runtime of its own. Enable the `tokio` feature for [`TokioRuntime`]; on Cloudflare
//!   Workers implement [`Runtime`] with `worker::Delay` and `Date::now()`.
//! - Config is validated at construction: a bad value is a [`ConfigError`] (code `config`).
//! - Errors carry a stable code. Health and telemetry record the code, never a message, a
//!   URL with a query string or a payload: no personal data leaves through this node.
//!
//! The TypeScript build is `resilience-core.ts`; both are held to
//! `contracts/lib/resilience-core.contract.json`.

use std::borrow::Cow;
use std::fmt;
use std::future::Future;
use std::pin::pin;
use std::task::Poll;

use crate::circuit_breaker::CircuitState;
use crate::mzizi_resilience::FaultKind;

/// A clock and a sleep: everything the async wrappers need from a host.
///
/// The cores never read a clock; the wrappers read `now_ms` around each call and await
/// `sleep` for retry delays, queue waits, rate-limit waits and timeouts. Dropping the
/// future `sleep` returns must cancel the timer.
pub trait Runtime {
    /// The current time in integer milliseconds.
    fn now_ms(&self) -> u64;
    /// A future that completes after `ms` milliseconds.
    fn sleep(&self, ms: u64) -> impl Future<Output = ()>;
}

impl<R: Runtime + ?Sized> Runtime for &R {
    fn now_ms(&self) -> u64 {
        (**self).now_ms()
    }
    fn sleep(&self, ms: u64) -> impl Future<Output = ()> {
        (**self).sleep(ms)
    }
}

/// A [`Runtime`] on tokio's timer and the system clock (feature `tokio`).
#[cfg(feature = "tokio")]
#[derive(Debug, Clone, Copy, Default)]
pub struct TokioRuntime;

#[cfg(feature = "tokio")]
impl Runtime for TokioRuntime {
    fn now_ms(&self) -> u64 {
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| u64::try_from(d.as_millis()).unwrap_or(u64::MAX))
            .unwrap_or(0)
    }
    fn sleep(&self, ms: u64) -> impl Future<Output = ()> {
        tokio::time::sleep(std::time::Duration::from_millis(ms))
    }
}

/// A configuration value is out of range. Returned at construction, never mid-call.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ConfigError {
    /// The option that was rejected, e.g. `failure_threshold`.
    pub option: &'static str,
    /// What it must be.
    pub requirement: String,
}

impl ConfigError {
    /// The stable code, `config`.
    pub const CODE: &'static str = "config";

    /// A config error for `option`.
    pub fn new(option: &'static str, requirement: impl Into<String>) -> Self {
        ConfigError {
            option,
            requirement: requirement.into(),
        }
    }
}

impl fmt::Display for ConfigError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(
            f,
            "Invalid resilience config: {} {}",
            self.option, self.requirement
        )
    }
}

impl std::error::Error for ConfigError {}

/// An integer at least `min`.
pub fn check_min(option: &'static str, value: u64, min: u64) -> Result<u64, ConfigError> {
    if value < min {
        return Err(ConfigError::new(
            option,
            format!("must be an integer >= {min}, got {value}"),
        ));
    }
    Ok(value)
}

/// A non-empty name.
pub fn check_name(option: &'static str, value: &str) -> Result<(), ConfigError> {
    if value.is_empty() {
        return Err(ConfigError::new(option, "must be a non-empty string"));
    }
    Ok(())
}

/// The stable code of an operation's own error, safe to log and to show on a health panel.
///
/// Implement it for your error type: return a short code (`db-down`, `http-503`), never
/// the message. [`safe_code`] keeps whatever you return to the shared code alphabet.
pub trait ErrorCode {
    /// The code.
    fn error_code(&self) -> Cow<'_, str>;
}

impl ErrorCode for String {
    fn error_code(&self) -> Cow<'_, str> {
        safe_code(self)
    }
}

impl ErrorCode for &str {
    fn error_code(&self) -> Cow<'_, str> {
        safe_code(self)
    }
}

impl ErrorCode for () {
    fn error_code(&self) -> Cow<'_, str> {
        Cow::Borrowed("error")
    }
}

/// `code` when it looks like a code (`[A-Za-z0-9][A-Za-z0-9_.:-]{0,63}`), else `"error"`.
pub fn safe_code(code: &str) -> Cow<'_, str> {
    let mut chars = code.chars();
    let ok = code.len() <= 64
        && chars.next().is_some_and(|c| c.is_ascii_alphanumeric())
        && chars.all(|c| c.is_ascii_alphanumeric() || matches!(c, '_' | '.' | ':' | '-'));
    if ok {
        Cow::Borrowed(code)
    } else {
        Cow::Borrowed("error")
    }
}

/// One stage's failure in [`Error::AllStagesFailed`]: its name and its error code.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct StageError {
    /// The stage's name.
    pub stage: String,
    /// Its error code.
    pub code: String,
}

/// Every way a resilient call can fail. `E` is the operation's own error.
#[derive(Debug, Clone, PartialEq)]
#[non_exhaustive]
pub enum Error<E> {
    /// The operation's own error.
    Op(E),
    /// The deadline passed (code `timeout`).
    Timeout {
        /// The deadline, in ms.
        duration_ms: u64,
    },
    /// The circuit is open, or half-open with every probe slot taken (code `circuit-open`).
    CircuitOpen {
        /// The breaker's name.
        name: String,
        /// How long until it may admit a call, in ms.
        retry_after_ms: u64,
        /// Its state when it refused.
        state: CircuitState,
    },
    /// Every attempt failed with a retryable error (code `retries-exhausted`).
    RetriesExhausted {
        /// Attempts made.
        attempts: u32,
        /// The last attempt's error.
        last: Box<Error<E>>,
    },
    /// Every slot and queue place is taken (code `bulkhead-full`).
    BulkheadFull {
        /// The bulkhead's name.
        name: String,
        /// Calls running.
        concurrent: usize,
        /// Calls waiting.
        queued: usize,
    },
    /// Waited in the queue for `waited_ms` without being admitted (code `bulkhead-queue-timeout`).
    BulkheadQueueTimeout {
        /// The bulkhead's name.
        name: String,
        /// The queue wait, in ms.
        waited_ms: u64,
    },
    /// No token, and waiting was not allowed or would take too long (code `rate-limited`).
    RateLimited {
        /// The limiter's name.
        name: String,
        /// Calls per window.
        limit: u64,
        /// The window, in ms.
        window_ms: u64,
        /// When a token will be available, in ms.
        retry_after_ms: u64,
    },
    /// Every fallback stage failed (code `all-stages-failed`); codes only.
    AllStagesFailed {
        /// Each stage and its error code, in order.
        stage_errors: Vec<StageError>,
    },
    /// A chaos fault was injected (code `chaos`).
    Chaos {
        /// Which fault.
        kind: FaultKind,
    },
    /// A value failed validation, or a malformed fault replaced it (code `malformed`).
    Malformed,
    /// A configuration value is out of range (code `config`).
    Config(ConfigError),
}

/// The rejection codes: a guard refused the call without running it.
pub const REJECTION_CODES: [&str; 4] = [
    "circuit-open",
    "bulkhead-full",
    "bulkhead-queue-timeout",
    "rate-limited",
];

impl<E> Error<E> {
    /// The code of every variant but [`Error::Op`], whose code is the operation's.
    pub fn fixed_code(&self) -> Option<&'static str> {
        Some(match self {
            Error::Op(_) => return None,
            Error::Timeout { .. } => "timeout",
            Error::CircuitOpen { .. } => "circuit-open",
            Error::RetriesExhausted { .. } => "retries-exhausted",
            Error::BulkheadFull { .. } => "bulkhead-full",
            Error::BulkheadQueueTimeout { .. } => "bulkhead-queue-timeout",
            Error::RateLimited { .. } => "rate-limited",
            Error::AllStagesFailed { .. } => "all-stages-failed",
            Error::Chaos { .. } => "chaos",
            Error::Malformed => "malformed",
            Error::Config(_) => ConfigError::CODE,
        })
    }

    /// Whether a guard refused the call (circuit open, bulkhead full or queue timeout, rate limited).
    pub fn is_rejection(&self) -> bool {
        matches!(
            self,
            Error::CircuitOpen { .. }
                | Error::BulkheadFull { .. }
                | Error::BulkheadQueueTimeout { .. }
                | Error::RateLimited { .. }
        )
    }
}

impl<E: ErrorCode> Error<E> {
    /// The stable code: the variant's, or the operation error's own.
    pub fn code(&self) -> Cow<'_, str> {
        match self {
            Error::Op(e) => match e.error_code() {
                Cow::Borrowed(s) => safe_code(s),
                Cow::Owned(s) => Cow::Owned(safe_code(&s).into_owned()),
            },
            other => Cow::Borrowed(other.fixed_code().unwrap_or("error")),
        }
    }
}

impl<E> From<ConfigError> for Error<E> {
    fn from(e: ConfigError) -> Self {
        Error::Config(e)
    }
}

impl<E: ErrorCode> fmt::Display for Error<E> {
    /// Codes and numbers only: never the operation error's message.
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Error::Op(_) => write!(f, "operation failed ({})", self.code()),
            Error::Timeout { duration_ms } => {
                write!(f, "operation timed out after {duration_ms}ms")
            }
            Error::CircuitOpen { name, state, .. } => {
                write!(
                    f,
                    "circuit breaker \"{name}\" is {} — call rejected",
                    state.as_str()
                )
            }
            Error::RetriesExhausted { attempts, last } => {
                write!(f, "all {attempts} attempts failed (last: {})", last.code())
            }
            Error::BulkheadFull {
                name,
                concurrent,
                queued,
            } => write!(
                f,
                "bulkhead \"{name}\" is full — {concurrent} concurrent, {queued} queued"
            ),
            Error::BulkheadQueueTimeout { name, waited_ms } => {
                write!(f, "bulkhead \"{name}\" queue wait exceeded {waited_ms}ms")
            }
            Error::RateLimited {
                name,
                retry_after_ms,
                ..
            } => {
                write!(
                    f,
                    "rate limit exceeded for \"{name}\"; retry after {retry_after_ms}ms"
                )
            }
            Error::AllStagesFailed { stage_errors } => {
                write!(f, "all fallback stages failed:")?;
                for s in stage_errors {
                    write!(f, " {} ({})", s.stage, s.code)?;
                }
                Ok(())
            }
            Error::Chaos { kind } => write!(f, "chaos fault injected: {}", kind.as_str()),
            Error::Malformed => write!(f, "malformed payload"),
            Error::Config(e) => write!(f, "{e}"),
        }
    }
}

impl<E: ErrorCode + fmt::Debug> std::error::Error for Error<E> {}

/// Which of two raced futures finished first.
pub(crate) enum Either<A, B> {
    /// The first.
    Left(A),
    /// The second.
    Right(B),
}

/// Race two futures, polling `first` before `second` on every wake, so a tie goes to
/// `first`. The loser is dropped (cancelled).
pub(crate) async fn race<A: Future, B: Future>(
    first: A,
    second: B,
) -> Either<A::Output, B::Output> {
    let mut first = pin!(first);
    let mut second = pin!(second);
    std::future::poll_fn(|cx| {
        if let Poll::Ready(v) = first.as_mut().poll(cx) {
            return Poll::Ready(Either::Left(v));
        }
        if let Poll::Ready(v) = second.as_mut().poll(cx) {
            return Poll::Ready(Either::Right(v));
        }
        Poll::Pending
    })
    .await
}
