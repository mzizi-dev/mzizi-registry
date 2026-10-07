// GENERATED — DO NOT EDIT.
//
// Copied verbatim from components/registry/n5-resilience/bulkhead.rs by scripts/generate-rust-components.mjs.
// That file is the one a human edits; this is the copy `cargo package` can ship,
// because a tarball only carries files under the crate root.
//
// Regenerate with `pnpm rust:generate`. CI runs `pnpm rust:generate:check`,
// which fails if this copy and its source have drifted.

//! Bulkhead for the Mzizi resilience node (N5), Resilience4j-style: a cap on concurrent
//! calls to one dependency.
//!
//! - Under `max_concurrent`, a call is admitted.
//! - At capacity it waits in a FIFO queue of up to `max_queue` calls; when a running call
//!   ends, the oldest waiter is admitted in its place.
//! - With the queue full: [`Error::BulkheadFull`] (code `bulkhead-full`).
//! - A waiter not admitted within `max_queue_wait_ms` is removed:
//!   [`Error::BulkheadQueueTimeout`] (code `bulkhead-queue-timeout`).
//!
//! [`BulkheadCore`] is the sans-IO state; [`Bulkhead`] runs async calls through it. A call
//! whose future is dropped (cancelled) gives its slot or its queue place back.
//!
//! The TypeScript build is `bulkhead.ts`; both are held to `contracts/lib/bulkhead.contract.json`.

use std::cell::RefCell;
use std::collections::{HashMap, HashSet, VecDeque};
use std::future::Future;
use std::task::{Poll, Waker};

use crate::resilience_core::{ConfigError, Either, Error, Runtime, check_min, check_name, race};

/// A bulkhead's numbers.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct BulkheadConfig {
    /// Identifier, e.g. the dependency it isolates.
    pub name: String,
    /// Concurrent calls allowed (>= 1, default 10).
    pub max_concurrent: usize,
    /// Calls allowed to wait at capacity (default 0: reject at once).
    pub max_queue: usize,
    /// The longest a call may wait in the queue, in ms (default 5000).
    pub max_queue_wait_ms: u64,
}

impl BulkheadConfig {
    /// The defaults, named `name`.
    pub fn new(name: impl Into<String>) -> Self {
        BulkheadConfig {
            name: name.into(),
            max_concurrent: 10,
            max_queue: 0,
            max_queue_wait_ms: 5_000,
        }
    }

    /// Check every value.
    pub fn validate(&self) -> Result<(), ConfigError> {
        check_name("name", &self.name)?;
        check_min("max_concurrent", self.max_concurrent as u64, 1)?;
        Ok(())
    }
}

/// The answer to [`BulkheadCore::try_enter`].
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Entry {
    /// Run now (counted active).
    Admitted,
    /// Wait; this ticket is admitted by a later [`BulkheadCore::release`].
    Queued(u64),
    /// Full.
    Rejected,
}

/// A snapshot of the counts.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct BulkheadMetrics {
    /// Calls running.
    pub concurrent: usize,
    /// Calls waiting.
    pub queued: usize,
    /// The cap.
    pub max_concurrent: usize,
    /// The queue's size.
    pub max_queue: usize,
}

/// The sans-IO bulkhead: counts and a FIFO of tickets (from 1).
#[derive(Debug, Clone)]
pub struct BulkheadCore {
    config: BulkheadConfig,
    active: usize,
    queue: VecDeque<u64>,
    next_ticket: u64,
}

impl BulkheadCore {
    /// An empty bulkhead, or the config error.
    pub fn new(config: BulkheadConfig) -> Result<Self, ConfigError> {
        config.validate()?;
        Ok(BulkheadCore {
            config,
            active: 0,
            queue: VecDeque::new(),
            next_ticket: 1,
        })
    }

    /// The config.
    pub fn config(&self) -> &BulkheadConfig {
        &self.config
    }

    /// Enter: admitted, queued with a ticket, or rejected.
    pub fn try_enter(&mut self) -> Entry {
        if self.active < self.config.max_concurrent {
            self.active += 1;
            return Entry::Admitted;
        }
        if self.queue.len() < self.config.max_queue {
            let ticket = self.next_ticket;
            self.next_ticket += 1;
            self.queue.push_back(ticket);
            return Entry::Queued(ticket);
        }
        Entry::Rejected
    }

    /// An active call ended: the ticket admitted in its place (now active), or `None`.
    pub fn release(&mut self) -> Option<u64> {
        if let Some(next) = self.queue.pop_front() {
            return Some(next);
        }
        self.active = self.active.saturating_sub(1);
        None
    }

    /// A queued ticket's wait ran out: remove it. False if it was already admitted.
    pub fn expire(&mut self, ticket: u64) -> bool {
        match self.queue.iter().position(|t| *t == ticket) {
            Some(i) => {
                self.queue.remove(i);
                true
            }
            None => false,
        }
    }

    /// The counts.
    pub fn metrics(&self) -> BulkheadMetrics {
        BulkheadMetrics {
            concurrent: self.active,
            queued: self.queue.len(),
            max_concurrent: self.config.max_concurrent,
            max_queue: self.config.max_queue,
        }
    }
}

#[derive(Debug)]
struct Shared {
    core: BulkheadCore,
    /// Tickets admitted by a release, not yet picked up by their waiter.
    admitted: HashSet<u64>,
    wakers: HashMap<u64, Waker>,
}

/// A bulkhead for async calls. Single-threaded (interior `RefCell`, never held across an
/// await).
#[derive(Debug)]
pub struct Bulkhead {
    shared: RefCell<Shared>,
}

impl Bulkhead {
    /// A bulkhead, or the config error.
    pub fn new(config: BulkheadConfig) -> Result<Self, ConfigError> {
        Ok(Bulkhead {
            shared: RefCell::new(Shared {
                core: BulkheadCore::new(config)?,
                admitted: HashSet::new(),
                wakers: HashMap::new(),
            }),
        })
    }

    /// The counts now.
    pub fn metrics(&self) -> BulkheadMetrics {
        self.shared.borrow().core.metrics()
    }

    /// Run `op` inside the bulkhead, waiting in the queue if allowed.
    pub async fn execute<R, T, E, F, Fut>(&self, rt: &R, op: F) -> Result<T, Error<E>>
    where
        R: Runtime + ?Sized,
        F: FnOnce() -> Fut,
        Fut: Future<Output = Result<T, Error<E>>>,
    {
        let entry = self.shared.borrow_mut().core.try_enter();
        match entry {
            Entry::Rejected => {
                let s = self.shared.borrow();
                let m = s.core.metrics();
                return Err(Error::BulkheadFull {
                    name: s.core.config.name.clone(),
                    concurrent: m.concurrent,
                    queued: m.queued,
                });
            }
            Entry::Admitted => {}
            Entry::Queued(ticket) => {
                let wait = self.shared.borrow().core.config.max_queue_wait_ms;
                let mut queued = QueueGuard {
                    bulkhead: self,
                    ticket,
                    armed: true,
                };
                let turn = std::future::poll_fn(|cx| {
                    let mut s = self.shared.borrow_mut();
                    if s.admitted.remove(&ticket) {
                        s.wakers.remove(&ticket);
                        Poll::Ready(())
                    } else {
                        s.wakers.insert(ticket, cx.waker().clone());
                        Poll::Pending
                    }
                });
                match race(turn, rt.sleep(wait)).await {
                    Either::Left(()) => queued.armed = false,
                    Either::Right(()) => {
                        let mut s = self.shared.borrow_mut();
                        s.wakers.remove(&ticket);
                        if s.core.expire(ticket) {
                            queued.armed = false;
                            return Err(Error::BulkheadQueueTimeout {
                                name: s.core.config.name.clone(),
                                waited_ms: wait,
                            });
                        }
                        // Admitted in the same instant the wait ran out: take the slot.
                        s.admitted.remove(&ticket);
                        queued.armed = false;
                    }
                }
            }
        }
        let _slot = SlotGuard { bulkhead: self };
        op().await
    }

    fn release(&self) {
        let mut s = self.shared.borrow_mut();
        if let Some(next) = s.core.release() {
            s.admitted.insert(next);
            let waker = s.wakers.remove(&next);
            drop(s);
            if let Some(w) = waker {
                w.wake();
            }
        }
    }
}

/// Gives the slot back when the call ends or is cancelled.
struct SlotGuard<'a> {
    bulkhead: &'a Bulkhead,
}

impl Drop for SlotGuard<'_> {
    fn drop(&mut self) {
        self.bulkhead.release();
    }
}

/// Gives the queue place (or a slot granted meanwhile) back if the waiter is cancelled.
struct QueueGuard<'a> {
    bulkhead: &'a Bulkhead,
    ticket: u64,
    armed: bool,
}

impl Drop for QueueGuard<'_> {
    fn drop(&mut self) {
        if !self.armed {
            return;
        }
        let granted = {
            let mut s = self.bulkhead.shared.borrow_mut();
            s.wakers.remove(&self.ticket);
            if s.core.expire(self.ticket) {
                false
            } else {
                s.admitted.remove(&self.ticket)
            }
        };
        if granted {
            self.bulkhead.release();
        }
    }
}
