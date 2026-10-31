//! Mzizi N5 resilience: the shared core.
//!
//! "Failure in one part never breaks the whole." Every type here is a sans-IO state
//! machine: it owns no clock, no timer, no thread and no random number generator.
//! The host passes the time in (milliseconds on any monotonic clock, for example
//! `Date.now()` in a Worker or `Instant` in Axum) and, where it needs one, a random
//! draw in `[0, 1)`. That makes the core run unchanged on Cloudflare Workers
//! (`wasm32`), in containers and on bare metal, and makes every behaviour testable
//! with a fixed script instead of sleeps.
//!
//! The pieces:
//!
//! | Module | What it decides |
//! | --- | --- |
//! | [`breaker`] | Whether a call may go to a failing dependency (closed, open, half-open). |
//! | [`retry`] | How long to wait before attempt *n*, with jitter that never exceeds the cap. |
//! | [`bulkhead`] | How many calls may run at once, how many may wait, and who is turned away. |
//! | [`rate_limit`] | A token bucket whose sustained rate is exactly `limit` per `window`. |
//! | [`chain`] | The first fallback stage that works, and whether the answer is degraded. |
//! | [`deadline`] | How much time is left of a budget. |
//!
//! The behaviour is held by the shared vectors in `__tests__/fixtures/resilience/`,
//! which the TypeScript and Python builds run too (mzizi-registry#472).
//!
//! Nothing here records a payload or an error message: outcomes are counts and
//! indexes, so the core cannot carry personal data into a log.

pub mod breaker;
pub mod bulkhead;
pub mod chain;
pub mod deadline;
pub mod rate_limit;
pub mod retry;

use core::fmt;

/// A configuration that could not be valid (a zero threshold, a zero window).
///
/// Every constructor validates, so a bad number is refused at start-up and never
/// becomes a division by zero or a breaker that can never open.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct ConfigError(pub &'static str);

impl fmt::Display for ConfigError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "invalid resilience configuration: {}", self.0)
    }
}

impl std::error::Error for ConfigError {}
