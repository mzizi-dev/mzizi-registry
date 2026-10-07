// GENERATED — DO NOT EDIT.
//
// Copied verbatim from components/registry/n5-resilience/rate-limiter.rs by scripts/generate-rust-components.mjs.
// That file is the one a human edits; this is the copy `cargo package` can ship,
// because a tarball only carries files under the crate root.
//
// Regenerate with `pnpm rust:generate`. CI runs `pnpm rust:generate:check`,
// which fails if this copy and its source have drifted.

//! Rate limiter for the Mzizi resilience node (N5): an integer token bucket,
//! Resilience4j-style.
//!
//! The bucket counts in units of 1/window_ms of a token, so all arithmetic is integer and
//! every build agrees exactly: one token = `window_ms` units; capacity
//! `C = (limit + burst_allowance) * window_ms`; the bucket starts full; refill adds
//! `elapsed * limit` units, capped at C (the sustained rate is `limit` per window; burst
//! only raises the ceiling). Without a whole token the wait is
//! `ceil((window_ms - level) / limit)`; with `queue_excess` and a wait <= `max_wait_ms` the
//! token is reserved now (the level may go negative, so concurrent waiters queue rather
//! than race) and the caller sleeps the wait; else [`Error::RateLimited`] (code
//! `rate-limited`).
//!
//! The TypeScript build is `rate-limiter.ts`; both are held to
//! `contracts/lib/rate-limiter.contract.json`.

use std::cell::RefCell;
use std::future::Future;

use crate::resilience_core::{ConfigError, Error, Runtime, check_min, check_name};

/// A limiter's numbers.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RateLimiterConfig {
    /// Identifier, e.g. the API it protects.
    pub name: String,
    /// Calls allowed per window, sustained (>= 1, default 100).
    pub limit: u64,
    /// The window, in ms (>= 1, default 60000).
    pub window_ms: u64,
    /// Extra calls the bucket may hold for bursts (default 0).
    pub burst_allowance: u64,
    /// Wait for a token instead of rejecting, when the wait is at most `max_wait_ms`.
    pub queue_excess: bool,
    /// The longest wait `queue_excess` accepts, in ms (default 5000).
    pub max_wait_ms: u64,
}

impl RateLimiterConfig {
    /// The defaults, named `name`.
    pub fn new(name: impl Into<String>) -> Self {
        RateLimiterConfig {
            name: name.into(),
            limit: 100,
            window_ms: 60_000,
            burst_allowance: 0,
            queue_excess: false,
            max_wait_ms: 5_000,
        }
    }

    /// Check every value.
    pub fn validate(&self) -> Result<(), ConfigError> {
        check_name("name", &self.name)?;
        check_min("limit", self.limit, 1)?;
        check_min("window_ms", self.window_ms, 1)?;
        Ok(())
    }
}

/// The answer to [`RateLimiterCore::try_acquire`].
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RateAcquire {
    /// Go, after sleeping `wait_ms` (0 when a token was there).
    Ok {
        /// In ms.
        wait_ms: u64,
    },
    /// Rejected; a token will be available in `retry_after_ms`.
    Rejected {
        /// In ms.
        retry_after_ms: u64,
    },
}

/// The sans-IO token bucket. Every method takes `now` (integer ms).
#[derive(Debug, Clone)]
pub struct RateLimiterCore {
    config: RateLimiterConfig,
    /// Units of 1/window_ms token; negative while calls are queued.
    level: i128,
    last_refill: u64,
    capacity: i128,
}

impl RateLimiterCore {
    /// A full bucket at `now`, or the config error.
    pub fn new(config: RateLimiterConfig, now: u64) -> Result<Self, ConfigError> {
        config.validate()?;
        let capacity = (i128::from(config.limit) + i128::from(config.burst_allowance))
            * i128::from(config.window_ms);
        Ok(RateLimiterCore {
            config,
            level: capacity,
            last_refill: now,
            capacity,
        })
    }

    /// The config.
    pub fn config(&self) -> &RateLimiterConfig {
        &self.config
    }

    /// Ask for a token at `now`.
    pub fn try_acquire(&mut self, now: u64) -> RateAcquire {
        self.refill(now);
        let window = i128::from(self.config.window_ms);
        if self.level >= window {
            self.level -= window;
            return RateAcquire::Ok { wait_ms: 0 };
        }
        let wait_ms = self.wait();
        if self.config.queue_excess && wait_ms <= self.config.max_wait_ms {
            self.level -= window;
            return RateAcquire::Ok { wait_ms };
        }
        RateAcquire::Rejected {
            retry_after_ms: wait_ms,
        }
    }

    /// Whole tokens available at `now`.
    pub fn remaining(&mut self, now: u64) -> u64 {
        self.refill(now);
        u64::try_from(self.level.max(0) / i128::from(self.config.window_ms)).unwrap_or(u64::MAX)
    }

    /// How long until a whole token is available at `now`, in ms (0 if one is).
    pub fn retry_after_ms(&mut self, now: u64) -> u64 {
        self.refill(now);
        if self.level >= i128::from(self.config.window_ms) {
            0
        } else {
            self.wait()
        }
    }

    /// Refill to capacity.
    pub fn reset(&mut self, now: u64) {
        self.level = self.capacity;
        self.last_refill = now;
    }

    fn wait(&self) -> u64 {
        let missing = i128::from(self.config.window_ms) - self.level;
        let limit = i128::from(self.config.limit);
        u64::try_from((missing + limit - 1) / limit).unwrap_or(u64::MAX)
    }

    fn refill(&mut self, now: u64) {
        if now <= self.last_refill {
            return;
        }
        let add = i128::from(now - self.last_refill) * i128::from(self.config.limit);
        self.level = if add >= self.capacity - self.level {
            self.capacity
        } else {
            self.level + add
        };
        self.last_refill = now;
    }
}

/// A rate limiter for async calls. The bucket starts full at its first use (the same as
/// starting full at construction: a full bucket cannot fill further). Single-threaded.
#[derive(Debug)]
pub struct RateLimiter {
    config: RateLimiterConfig,
    core: RefCell<Option<RateLimiterCore>>,
}

impl RateLimiter {
    /// A limiter, or the config error.
    pub fn new(config: RateLimiterConfig) -> Result<Self, ConfigError> {
        config.validate()?;
        Ok(RateLimiter {
            config,
            core: RefCell::new(None),
        })
    }

    /// Run `f` on the core at `now`.
    pub fn with_core<O>(&self, now: u64, f: impl FnOnce(&mut RateLimiterCore) -> O) -> O {
        let mut slot = self.core.borrow_mut();
        let core = slot.get_or_insert_with(|| {
            RateLimiterCore::new(self.config.clone(), now).expect("validated in RateLimiter::new")
        });
        f(core)
    }

    /// Take a token (sleeping if `queue_excess` allows) and run `op`, or reject.
    pub async fn execute<R, T, E, F, Fut>(&self, rt: &R, op: F) -> Result<T, Error<E>>
    where
        R: Runtime + ?Sized,
        F: FnOnce() -> Fut,
        Fut: Future<Output = Result<T, Error<E>>>,
    {
        let now = rt.now_ms();
        match self.with_core(now, |c| c.try_acquire(now)) {
            RateAcquire::Rejected { retry_after_ms } => Err(Error::RateLimited {
                name: self.config.name.clone(),
                limit: self.config.limit,
                window_ms: self.config.window_ms,
                retry_after_ms,
            }),
            RateAcquire::Ok { wait_ms } => {
                if wait_ms > 0 {
                    rt.sleep(wait_ms).await;
                }
                op().await
            }
        }
    }
}
