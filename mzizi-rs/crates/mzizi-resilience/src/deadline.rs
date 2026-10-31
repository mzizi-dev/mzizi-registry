//! Deadline: how much of a time budget is left.
//!
//! The host owns the timer and the cancellation; this only does the arithmetic, so a
//! caller can pass the *remaining* budget down to the next call instead of starting a
//! fresh timeout at every layer.

use crate::ConfigError;

/// A budget that started at some time.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Deadline {
    started: u64,
    budget_ms: u64,
}

impl Deadline {
    /// A budget of `budget_ms` starting at `now`. The budget must be at least 1.
    pub fn new(now: u64, budget_ms: u64) -> Result<Self, ConfigError> {
        if budget_ms == 0 {
            return Err(ConfigError("budget_ms must be at least 1"));
        }
        Ok(Self {
            started: now,
            budget_ms,
        })
    }

    /// Time left at `now`, never negative.
    pub fn remaining_ms(&self, now: u64) -> u64 {
        self.budget_ms
            .saturating_sub(now.saturating_sub(self.started))
    }

    /// Whether the budget is spent.
    pub fn expired(&self, now: u64) -> bool {
        self.remaining_ms(now) == 0
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn counts_down_and_expires() {
        let d = Deadline::new(1_000, 500).unwrap();
        assert_eq!(d.remaining_ms(1_000), 500);
        assert_eq!(d.remaining_ms(1_200), 300);
        assert!(!d.expired(1_499));
        assert!(d.expired(1_500));
        assert_eq!(d.remaining_ms(9_000), 0);
    }

    #[test]
    fn a_clock_that_steps_back_keeps_the_full_budget() {
        let d = Deadline::new(1_000, 500).unwrap();
        assert_eq!(d.remaining_ms(10), 500);
    }

    #[test]
    fn a_zero_budget_is_refused() {
        assert!(Deadline::new(0, 0).is_err());
    }
}
