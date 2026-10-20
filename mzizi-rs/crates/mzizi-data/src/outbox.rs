//! The local outbox: every mutation is written here before it is sent.
//!
//! An entry leaves the outbox only when the server has applied it or refused it for good.
//! Entries are kept in creation order (`seq`). A host stores them durably by implementing
//! [`Outbox`] over IndexedDB (browser) or SQLite (native); [`MemoryOutbox`] is the in-memory one.

use std::cell::RefCell;
use std::future::Future;

use crate::Error;
use crate::mutation::Mutation;
use crate::request_id::RequestId;

/// Where an entry stands in the send path.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum EntryState {
    /// Written, not yet acknowledged. Sent again on the next flush (the server dedupes it).
    Queued,
    /// Acknowledged by the server. Its status is polled.
    Accepted,
    /// Not settled in time. Its status is re-checked on the next start. Never re-sent.
    Unknown,
}

/// A mutation in the outbox.
#[derive(Debug, Clone, PartialEq)]
pub struct Entry<V> {
    /// The creation order. Unique, and never reused.
    pub seq: u64,
    /// The mutation.
    pub mutation: Mutation<V>,
    /// Where it stands in the send path.
    pub state: EntryState,
}

/// Durable, ordered storage for the mutations not yet settled.
pub trait Outbox<V> {
    /// Appends `entry`. Its `request_id` must not already be present.
    fn push(&self, entry: Entry<V>) -> impl Future<Output = Result<(), Error>>;

    /// Every entry, in ascending `seq` order.
    fn list(&self) -> impl Future<Output = Result<Vec<Entry<V>>, Error>>;

    /// Replaces the entry with the same `request_id`. Fails if there is none.
    fn put(&self, entry: Entry<V>) -> impl Future<Output = Result<(), Error>>;

    /// Removes the entry with `request_id`. Removing one that is not there succeeds.
    fn remove(&self, request_id: RequestId) -> impl Future<Output = Result<(), Error>>;
}

/// A reference to an outbox is an outbox, so a host can keep it across client instances.
impl<V, T: Outbox<V> + ?Sized> Outbox<V> for &T {
    fn push(&self, entry: Entry<V>) -> impl Future<Output = Result<(), Error>> {
        (**self).push(entry)
    }

    fn list(&self) -> impl Future<Output = Result<Vec<Entry<V>>, Error>> {
        (**self).list()
    }

    fn put(&self, entry: Entry<V>) -> impl Future<Output = Result<(), Error>> {
        (**self).put(entry)
    }

    fn remove(&self, request_id: RequestId) -> impl Future<Output = Result<(), Error>> {
        (**self).remove(request_id)
    }
}

/// An in-memory outbox. It survives a client instance, not a page reload: use a durable
/// adapter for that.
#[derive(Debug)]
pub struct MemoryOutbox<V> {
    entries: RefCell<Vec<Entry<V>>>,
}

impl<V> MemoryOutbox<V> {
    /// An empty outbox.
    #[must_use]
    pub fn new() -> Self {
        Self {
            entries: RefCell::new(Vec::new()),
        }
    }
}

impl<V> Default for MemoryOutbox<V> {
    fn default() -> Self {
        Self::new()
    }
}

impl<V: Clone> Outbox<V> for MemoryOutbox<V> {
    async fn push(&self, entry: Entry<V>) -> Result<(), Error> {
        let mut entries = self.entries.borrow_mut();
        if entries
            .iter()
            .any(|e| e.mutation.request_id == entry.mutation.request_id)
        {
            return Err(Error::Refused(
                "duplicate request id in the outbox".to_owned(),
            ));
        }
        entries.push(entry);
        Ok(())
    }

    async fn list(&self) -> Result<Vec<Entry<V>>, Error> {
        let mut entries = self.entries.borrow().clone();
        entries.sort_by_key(|e| e.seq);
        Ok(entries)
    }

    async fn put(&self, entry: Entry<V>) -> Result<(), Error> {
        let mut entries = self.entries.borrow_mut();
        match entries
            .iter_mut()
            .find(|e| e.mutation.request_id == entry.mutation.request_id)
        {
            Some(slot) => {
                *slot = entry;
                Ok(())
            }
            None => Err(Error::Refused("no such entry in the outbox".to_owned())),
        }
    }

    async fn remove(&self, request_id: RequestId) -> Result<(), Error> {
        self.entries
            .borrow_mut()
            .retain(|e| e.mutation.request_id != request_id);
        Ok(())
    }
}
