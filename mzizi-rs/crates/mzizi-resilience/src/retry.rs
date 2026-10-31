//! Retry backoff: how long to wait before the next attempt.
//!
//! The delay for retry *n* is `base_ms * factor^(n-1)`, capped at `max_ms`, and then
//! jittered. Jitter only ever *reduces* the delay, so the cap is a true maximum
//! (it can never be exceeded by the random part). The random draw is passed in.

use crate::ConfigError;

/// How the delay is randomised.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Jitter {
    /// The exact delay.
    None,
    /// A uniform draw in `[0, delay]`. Spreads retries the most.
    Full,
    /// Half the delay plus a draw in `[0, delay / 2]`. Never waits less than half.
    Equal,
}

/// Exponential backoff settings.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Backoff {
    /// The delay before the first retry. At least 1.
    pub base_ms: u64,
    /// The growth per retry. At least 1.
    pub factor: u32,
    /// The longest delay. At least `base_ms`.
    pub max_ms: u64,
    /// The randomisation.
    pub jitter: Jitter,
}

impl Backoff {
    /// The settings, or the reason they are invalid.
    pub fn new(
        base_ms: u64,
        factor: u32,
        max_ms: u64,
        jitter: Jitter,
    ) -> Result<Self, ConfigError> {
        if base_ms == 0 {
            return Err(ConfigError("base_ms must be at least 1"));
        }
        if factor == 0 {
            return Err(ConfigError("factor must be at least 1"));
        }
        if max_ms < base_ms {
            return Err(ConfigError("max_ms must be at least base_ms"));
        }
        Ok(Self {
            base_ms,
            factor,
            max_ms,
            jitter,
        })
    }

    /// The wait before retry number `retry` (1 is the first retry), given a random
    /// draw `unit` in `[0, 1)`. Out-of-range draws are clamped.
    pub fn delay_ms(&self, retry: u32, unit: f64) -> u64 {
        let mut delay = self.base_ms;
        for _ in 1..retry.max(1) {
            delay = delay
                .saturating_mul(u64::from(self.factor))
                .min(self.max_ms);
            if delay == self.max_ms {
                break;
            }
        }
        let delay = delay.min(self.max_ms);
        let unit = if unit.is_finite() {
            unit.clamp(0.0, 1.0)
        } else {
            0.0
        };
        match self.jitter {
            Jitter::None => delay,
            Jitter::Full => (delay as f64 * unit).floor() as u64,
            Jitter::Equal => delay / 2 + ((delay - delay / 2) as f64 * unit).floor() as u64,
        }
        .min(self.max_ms)
    }
}

/// Validate a maximum number of attempts. Zero attempts would never call the
/// function at all, so it is refused instead of reported as "retries exhausted".
pub fn max_attempts(n: u32) -> Result<u32, ConfigError> {
    if n == 0 {
        Err(ConfigError("max_attempts must be at least 1"))
    } else {
        Ok(n)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn grows_and_caps() {
        let b = Backoff::new(100, 2, 1_000, Jitter::None).unwrap();
        let got: Vec<u64> = (1..=6).map(|n| b.delay_ms(n, 0.5)).collect();
        assert_eq!(got, [100, 200, 400, 800, 1_000, 1_000]);
    }

    #[test]
    fn jitter_never_exceeds_the_cap() {
        for jitter in [Jitter::None, Jitter::Full, Jitter::Equal] {
            let b = Backoff::new(100, 2, 1_000, jitter).unwrap();
            for retry in 1..=40 {
                for unit in [0.0, 0.25, 0.999_999, 1.0, 7.0, f64::NAN, -3.0] {
                    assert!(b.delay_ms(retry, unit) <= 1_000);
                }
            }
        }
    }

    #[test]
    fn equal_jitter_never_waits_less_than_half() {
        let b = Backoff::new(100, 2, 1_000, Jitter::Equal).unwrap();
        assert_eq!(b.delay_ms(3, 0.0), 200);
        assert_eq!(b.delay_ms(3, 1.0), 400);
    }

    #[test]
    fn huge_retry_counts_do_not_overflow() {
        let b = Backoff::new(1, 10, u64::MAX, Jitter::None).unwrap();
        assert_eq!(b.delay_ms(u32::MAX, 0.0), u64::MAX);
    }

    #[test]
    fn invalid_settings_and_zero_attempts_are_refused() {
        assert!(Backoff::new(0, 2, 10, Jitter::None).is_err());
        assert!(Backoff::new(1, 0, 10, Jitter::None).is_err());
        assert!(Backoff::new(10, 2, 5, Jitter::None).is_err());
        assert!(max_attempts(0).is_err());
        assert_eq!(max_attempts(3), Ok(3));
    }
}
