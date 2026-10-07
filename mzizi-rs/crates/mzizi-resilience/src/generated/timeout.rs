// GENERATED — DO NOT EDIT.
//
// Copied verbatim from components/registry/n5-resilience/timeout.rs by scripts/generate-rust-components.mjs.
// That file is the one a human edits; this is the copy `cargo package` can ship,
// because a tarball only carries files under the crate root.
//
// Regenerate with `pnpm rust:generate`. CI runs `pnpm rust:generate:check`,
// which fails if this copy and its source have drifted.

//! Timeout for the Mzizi resilience node (N5): a deadline on any future.
//!
//! [`with_timeout`] races the operation against `rt.sleep(ms)`. When the deadline wins,
//! the operation's future is dropped, which is Rust's cancellation, and the call returns
//! [`Error::Timeout`] (code `timeout`). The deadline is polled first, so on a tie it wins:
//! an operation of duration `d` under a timeout `t` times out iff `d >= t`, the rule every
//! build shares and the fixtures pin.
//!
//! The TypeScript build is `timeout.ts`; both are held to `contracts/lib/timeout.contract.json`.

use std::future::Future;

use crate::resilience_core::{ConfigError, Either, Error, Runtime, check_min, race};

/// Run `fut` with a deadline of `ms` milliseconds (at least 1).
///
/// ```
/// # use mzizi_resilience::{timeout::with_timeout, resilience_core::Error};
/// # async fn demo<R: mzizi_resilience::resilience_core::Runtime>(rt: &R) {
/// let res: Result<u32, Error<()>> = with_timeout(rt, 5_000, async { Ok(1) }).await;
/// # }
/// ```
pub async fn with_timeout<R, T, E, F>(rt: &R, ms: u64, fut: F) -> Result<T, Error<E>>
where
    R: Runtime + ?Sized,
    F: Future<Output = Result<T, Error<E>>>,
{
    check_min("ms", ms, 1)?;
    match race(rt.sleep(ms), fut).await {
        Either::Left(()) => Err(Error::Timeout { duration_ms: ms }),
        Either::Right(result) => result,
    }
}

/// The sans-IO rule, for simulations: whether `duration_ms` times out under `timeout_ms`,
/// and how much time passes before the caller sees the outcome.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TimeoutOutcome {
    /// Whether it timed out.
    pub timed_out: bool,
    /// Time until the outcome, in ms.
    pub elapsed_ms: u64,
}

/// The `d >= t` rule.
pub fn timeout_outcome(duration_ms: u64, timeout_ms: u64) -> Result<TimeoutOutcome, ConfigError> {
    check_min("timeout_ms", timeout_ms, 1)?;
    Ok(if duration_ms >= timeout_ms {
        TimeoutOutcome {
            timed_out: true,
            elapsed_ms: timeout_ms,
        }
    } else {
        TimeoutOutcome {
            timed_out: false,
            elapsed_ms: duration_ms,
        }
    })
}
