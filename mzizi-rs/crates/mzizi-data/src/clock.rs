//! The time source staleness is measured against, and the one place the crate sleeps.

use std::cell::Cell;
use std::future::{Future, ready};
use std::rc::Rc;

/// A source of the current time, in milliseconds since the Unix epoch, and of sleeps.
///
/// The crate never reads the wall clock itself. A browser host passes `Date.now` and a timer,
/// a native host passes `SystemTime` and a sleep, and tests pass a [`ManualClock`], so every
/// result is deterministic. A sleep is the only way the write path waits (status polling).
pub trait Clock {
    /// The current time in milliseconds.
    fn now_ms(&self) -> u64;

    /// Completes after `ms` milliseconds.
    fn sleep(&self, ms: u64) -> impl Future<Output = ()>;
}

/// A reference to a clock is a clock, so several cascades can share one.
impl<T: Clock + ?Sized> Clock for &T {
    fn now_ms(&self) -> u64 {
        (**self).now_ms()
    }

    fn sleep(&self, ms: u64) -> impl Future<Output = ()> {
        (**self).sleep(ms)
    }
}

/// A shared clock is a clock, so a client and its cascade can hold one.
impl<T: Clock + ?Sized> Clock for Rc<T> {
    fn now_ms(&self) -> u64 {
        (**self).now_ms()
    }

    fn sleep(&self, ms: u64) -> impl Future<Output = ()> {
        (**self).sleep(ms)
    }
}

/// A clock the caller sets by hand. A sleep advances it instead of waiting.
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

    fn sleep(&self, ms: u64) -> impl Future<Output = ()> {
        self.advance(ms);
        ready(())
    }
}
