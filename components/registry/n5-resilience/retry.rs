//! Retry with exponential backoff for the Mzizi resilience node (N5).
//!
//! The delay before retry number k (k = 1 for the first retry) is
//! `capped = min(base_delay_ms * 2^(k-1), max_delay_ms)`; with [`Jitter::Half`] (the
//! default) one draw from the injected [`Random`] adds up to half of it, and the result
//! never exceeds `max_delay_ms`:
//!
//! ```text
//! delay = min(max_delay_ms, capped + random.next_u32() % (floor(capped / 2) + 1))
//! ```
//!
//! Rejections and config errors are not retried by default. A non-retryable error is
//! returned as it is; running out of attempts returns [`Error::RetriesExhausted`] (code
//! `retries-exhausted`).
//!
//! The TypeScript build is `retry.ts`; both are held to `contracts/lib/retry.contract.json`.

use std::future::Future;

use crate::resilience_core::{ConfigError, Error, Runtime, check_min};
use crate::rng::Random;

/// How much randomness each delay gets.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum Jitter {
    /// The capped delay as is.
    None,
    /// Up to 50 % more, never past `max_delay_ms` (the default).
    #[default]
    Half,
}

/// The numbers the delay rule reads.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct RetryPolicy {
    /// Attempts including the first (>= 1, default 3).
    pub max_attempts: u32,
    /// Delay before the first retry, in ms (default 1000).
    pub base_delay_ms: u64,
    /// Ceiling for every delay, jitter included, in ms (default 30000).
    pub max_delay_ms: u64,
    /// Default [`Jitter::Half`].
    pub jitter: Jitter,
}

impl Default for RetryPolicy {
    fn default() -> Self {
        RetryPolicy {
            max_attempts: 3,
            base_delay_ms: 1000,
            max_delay_ms: 30_000,
            jitter: Jitter::Half,
        }
    }
}

impl RetryPolicy {
    /// Check every value.
    pub fn validate(&self) -> Result<(), ConfigError> {
        check_min("max_attempts", u64::from(self.max_attempts), 1)?;
        Ok(())
    }
}

/// The delay before retry number `k` (1-based). Draws once from `random` when jitter is
/// [`Jitter::Half`], never otherwise. Sans-IO; saturates instead of overflowing.
pub fn retry_delay<G: Random + ?Sized>(k: u32, policy: &RetryPolicy, random: &mut G) -> u64 {
    let shift = k.saturating_sub(1);
    let exp = if shift >= 64 {
        u64::MAX
    } else {
        policy.base_delay_ms.saturating_mul(1u64 << shift)
    };
    let capped = exp.min(policy.max_delay_ms);
    match policy.jitter {
        Jitter::None => capped,
        Jitter::Half => {
            let extra = u64::from(random.next_u32()) % (capped / 2 + 1);
            policy.max_delay_ms.min(capped.saturating_add(extra))
        }
    }
}

/// The default retry predicate: everything but rejections and config errors.
pub fn default_retry_if<E>(error: &Error<E>, _attempt: u32) -> bool {
    !error.is_rejection() && !matches!(error, Error::Config(_))
}

/// Retry `op` (given the 1-based attempt number) with the default predicate.
pub async fn with_retry<R, G, T, E, F, Fut>(
    rt: &R,
    policy: &RetryPolicy,
    random: &mut G,
    op: F,
) -> Result<T, Error<E>>
where
    R: Runtime + ?Sized,
    G: Random + ?Sized,
    F: FnMut(u32) -> Fut,
    Fut: Future<Output = Result<T, Error<E>>>,
{
    with_retry_if(rt, policy, random, default_retry_if, op).await
}

/// Retry `op` while `retry_if(error, attempt)` says so.
pub async fn with_retry_if<R, G, T, E, F, Fut, P>(
    rt: &R,
    policy: &RetryPolicy,
    random: &mut G,
    mut retry_if: P,
    mut op: F,
) -> Result<T, Error<E>>
where
    R: Runtime + ?Sized,
    G: Random + ?Sized,
    F: FnMut(u32) -> Fut,
    Fut: Future<Output = Result<T, Error<E>>>,
    P: FnMut(&Error<E>, u32) -> bool,
{
    policy.validate()?;
    let mut attempt = 1u32;
    loop {
        match op(attempt).await {
            Ok(v) => return Ok(v),
            Err(e) => {
                if !retry_if(&e, attempt) {
                    return Err(e);
                }
                if attempt >= policy.max_attempts {
                    return Err(Error::RetriesExhausted {
                        attempts: attempt,
                        last: Box::new(e),
                    });
                }
                let delay = retry_delay(attempt, policy, random);
                rt.sleep(delay).await;
                attempt += 1;
            }
        }
    }
}
