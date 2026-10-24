//! The time source staleness is measured against.

use std::cell::Cell;

/// A source of the current time, in milliseconds since the Unix epoch.
///
/// The crate never reads the wall clock itself. A browser host passes `Date.now`, a native
/// host passes `SystemTime`, and tests pass a [`ManualClock`], so every result is
/// deterministic.
pub trait Clock {
    /// The current time in milliseconds.
    fn now_ms(&self) -> u64;
}

/// A reference to a clock is a clock, so several cascades can share one.
impl<T: Clock + ?Sized> Clock for &T {
    fn now_ms(&self) -> u64 {
        (**self).now_ms()
    }
}

/// A clock the caller sets by hand.
#[derive(Debug)]
pub struct ManualClock {
    now: Cell<u64>,
}

impl ManualClock {
    /// A clock reading `now_ms`.
    #[must_use]
    pub fn new(now_ms: u64) -> Self {
        Self {
            now: Cell::new(now_ms),
        }
    }

    /// Sets the clock to `now_ms`.
    pub fn set(&self, now_ms: u64) {
        self.now.set(now_ms);
    }

    /// Moves the clock forward by `ms`, saturating at the largest value.
    pub fn advance(&self, ms: u64) {
        self.now.set(self.now.get().saturating_add(ms));
    }
}

impl Clock for ManualClock {
    fn now_ms(&self) -> u64 {
        self.now.get()
    }
}
