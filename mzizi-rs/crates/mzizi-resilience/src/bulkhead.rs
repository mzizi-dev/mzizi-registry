//! Bulkhead: a cap on concurrent calls to one dependency, so a slow one cannot use
//! up every worker.
//!
//! `max_concurrent` calls run at once; up to `max_queue` more may wait. A call that
//! finds both full is [`Entry::Rejected`]. A waiter that gives up (its own timer ran
//! out) calls [`Bulkhead::abandon`], which is *not* a rejection: the bulkhead was not
//! full, the wait was just too long. The host owns the timer.

use crate::ConfigError;

/// What happened to a call that asked to enter.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Entry {
    /// A slot was free; the call may run. Call [`Bulkhead::release`] when it ends.
    Admitted,
    /// All slots are busy; the call waits. Poll [`Bulkhead::promote`] as slots free.
    Queued,
    /// Slots and queue are full.
    Rejected,
}

/// A bulkhead for one dependency.
#[derive(Debug, Clone)]
pub struct Bulkhead {
    max_concurrent: u32,
    max_queue: u32,
    active: u32,
    queued: u32,
}

impl Bulkhead {
    /// A bulkhead, or the reason the settings are invalid. `max_queue` may be 0.
    pub fn new(max_concurrent: u32, max_queue: u32) -> Result<Self, ConfigError> {
        if max_concurrent == 0 {
            return Err(ConfigError("max_concurrent must be at least 1"));
        }
        Ok(Self {
            max_concurrent,
            max_queue,
            active: 0,
            queued: 0,
        })
    }

    /// Ask to run a call.
    pub fn acquire(&mut self) -> Entry {
        if self.active < self.max_concurrent {
            self.active += 1;
            Entry::Admitted
        } else if self.queued < self.max_queue {
            self.queued += 1;
            Entry::Queued
        } else {
            Entry::Rejected
        }
    }

    /// A queued call takes a free slot, if there is one. True when it may now run.
    pub fn promote(&mut self) -> bool {
        if self.queued > 0 && self.active < self.max_concurrent {
            self.queued -= 1;
            self.active += 1;
            true
        } else {
            false
        }
    }

    /// A queued call gave up waiting.
    pub fn abandon(&mut self) {
        self.queued = self.queued.saturating_sub(1);
    }

    /// A running call ended.
    pub fn release(&mut self) {
        self.active = self.active.saturating_sub(1);
    }

    /// Running calls over capacity, in `[0, 1]`.
    pub fn utilization(&self) -> f64 {
        f64::from(self.active) / f64::from(self.max_concurrent)
    }

    /// Calls running now.
    pub fn active(&self) -> u32 {
        self.active
    }

    /// Calls waiting now.
    pub fn queued(&self) -> u32 {
        self.queued
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn zero_capacity_is_refused_not_divided_by() {
        assert!(Bulkhead::new(0, 5).is_err());
    }

    #[test]
    fn fills_then_queues_then_rejects() {
        let mut b = Bulkhead::new(2, 1).unwrap();
        assert_eq!(b.acquire(), Entry::Admitted);
        assert_eq!(b.acquire(), Entry::Admitted);
        assert_eq!(b.acquire(), Entry::Queued);
        assert_eq!(b.acquire(), Entry::Rejected);
        assert_eq!(b.utilization(), 1.0);
    }

    #[test]
    fn a_released_slot_goes_to_the_queue() {
        let mut b = Bulkhead::new(1, 1).unwrap();
        b.acquire();
        b.acquire();
        assert!(!b.promote());
        b.release();
        assert!(b.promote());
        assert_eq!((b.active(), b.queued()), (1, 0));
    }

    #[test]
    fn giving_up_a_wait_frees_the_queue_without_a_rejection() {
        let mut b = Bulkhead::new(1, 1).unwrap();
        b.acquire();
        assert_eq!(b.acquire(), Entry::Queued);
        b.abandon();
        assert_eq!(b.acquire(), Entry::Queued);
    }

    #[test]
    fn double_release_does_not_underflow() {
        let mut b = Bulkhead::new(1, 0).unwrap();
        b.release();
        b.release();
        assert_eq!(b.active(), 0);
    }
}
