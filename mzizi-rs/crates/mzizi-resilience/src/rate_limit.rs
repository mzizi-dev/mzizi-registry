//! Token-bucket rate limiter.
//!
//! The bucket holds up to `limit + burst` tokens and refills at exactly `limit`
//! tokens per `window_ms`, so the sustained rate is `limit` per window whatever the
//! burst (the burst is a one-time allowance, not a higher rate). A denial says how
//! long to wait, counting the fraction of a token already refilled.

use crate::ConfigError;

/// Rate limiter settings.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Config {
    /// Requests allowed per window, sustained. At least 1.
    pub limit: u32,
    /// The window. At least 1.
    pub window_ms: u64,
    /// Extra tokens the bucket may hold for a spike.
    pub burst: u32,
}

/// The answer to [`RateLimiter::try_acquire`].
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Decision {
    /// Go ahead; the tokens are taken.
    Allowed,
    /// Not now: wait this long.
    Denied {
        /// Milliseconds until enough tokens exist.
        retry_after_ms: u64,
    },
    /// More tokens were asked for than the bucket can ever hold.
    Impossible,
}

/// A token bucket.
#[derive(Debug, Clone)]
pub struct RateLimiter {
    capacity: f64,
    per_ms: f64,
    tokens: f64,
    last: u64,
}

impl RateLimiter {
    /// A full bucket at time `now`, or the reason the settings are invalid.
    pub fn new(cfg: Config, now: u64) -> Result<Self, ConfigError> {
        if cfg.limit == 0 {
            return Err(ConfigError("limit must be at least 1"));
        }
        if cfg.window_ms == 0 {
            return Err(ConfigError("window_ms must be at least 1"));
        }
        let capacity = f64::from(cfg.limit) + f64::from(cfg.burst);
        Ok(Self {
            capacity,
            per_ms: f64::from(cfg.limit) / cfg.window_ms as f64,
            tokens: capacity,
            last: now,
        })
    }

    fn refill(&mut self, now: u64) {
        let elapsed = now.saturating_sub(self.last);
        self.tokens = (self.tokens + elapsed as f64 * self.per_ms).min(self.capacity);
        self.last = self.last.max(now);
    }

    /// Take `n` tokens if they are there.
    pub fn try_acquire(&mut self, now: u64, n: u32) -> Decision {
        let n = f64::from(n);
        if n > self.capacity {
            return Decision::Impossible;
        }
        self.refill(now);
        if self.tokens >= n {
            self.tokens -= n;
            Decision::Allowed
        } else {
            let wait = ((n - self.tokens) / self.per_ms).ceil();
            Decision::Denied {
                retry_after_ms: wait as u64,
            }
        }
    }

    /// Whole tokens available at `now` (what `try_acquire(now, 1)` would grant).
    pub fn available(&mut self, now: u64) -> u32 {
        self.refill(now);
        self.tokens.floor() as u32
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn cfg() -> Config {
        Config {
            limit: 10,
            window_ms: 1_000,
            burst: 0,
        }
    }

    #[test]
    fn invalid_settings_are_refused() {
        assert!(RateLimiter::new(Config { limit: 0, ..cfg() }, 0).is_err());
        assert!(
            RateLimiter::new(
                Config {
                    window_ms: 0,
                    ..cfg()
                },
                0
            )
            .is_err()
        );
    }

    #[test]
    fn the_sustained_rate_is_limit_per_window_even_with_a_burst() {
        let mut l = RateLimiter::new(Config { burst: 5, ..cfg() }, 0).unwrap();
        // Drain the 15-token bucket, then count what one window refills.
        for _ in 0..15 {
            assert_eq!(l.try_acquire(0, 1), Decision::Allowed);
        }
        let mut allowed = 0;
        for t in 1..=1_000 {
            if l.try_acquire(t, 1) == Decision::Allowed {
                allowed += 1;
            }
        }
        assert_eq!(allowed, 10);
    }

    #[test]
    fn a_denial_counts_the_part_of_a_token_already_refilled() {
        let mut l = RateLimiter::new(cfg(), 0).unwrap();
        for _ in 0..10 {
            l.try_acquire(0, 1);
        }
        // 10 per second is one token per 100 ms.
        assert_eq!(
            l.try_acquire(0, 1),
            Decision::Denied {
                retry_after_ms: 100
            }
        );
        assert_eq!(
            l.try_acquire(60, 1),
            Decision::Denied { retry_after_ms: 40 }
        );
        assert_eq!(l.try_acquire(100, 1), Decision::Allowed);
    }

    #[test]
    fn asking_for_more_than_the_bucket_holds_is_impossible() {
        let mut l = RateLimiter::new(cfg(), 0).unwrap();
        assert_eq!(l.try_acquire(0, 11), Decision::Impossible);
    }

    #[test]
    fn available_agrees_with_try_acquire() {
        let mut l = RateLimiter::new(cfg(), 0).unwrap();
        for _ in 0..10 {
            l.try_acquire(0, 1);
        }
        assert_eq!(l.available(50), 0); // 0.5 of a token is not a token
        assert_eq!(
            l.try_acquire(50, 1),
            Decision::Denied { retry_after_ms: 50 }
        );
        assert_eq!(l.available(100), 1);
    }
}
