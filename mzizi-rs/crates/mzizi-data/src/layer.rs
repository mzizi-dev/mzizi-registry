//! The tiers the cascade reads and writes, and the record each one holds.

use std::cell::{Cell, RefCell};
use std::collections::BTreeMap;
use std::fmt;
use std::future::Future;

/// Which tier answered a read, or holds a record.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum Source {
    /// The device's own cache. A later adapter is SQLite or IndexedDB.
    Local,
    /// The edge tier. A later adapter is Cloudflare D1 or KV.
    Edge,
    /// The origin database. A later adapter is Supabase Postgres.
    Cloud,
}

impl Source {
    /// Authority used to break a version tie: the origin outranks the edge, and the edge
    /// outranks the device.
    #[must_use]
    pub(crate) const fn rank(self) -> u8 {
        match self {
            Self::Local => 0,
            Self::Edge => 1,
            Self::Cloud => 2,
        }
    }
}

impl fmt::Display for Source {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(match self {
            Self::Local => "local",
            Self::Edge => "edge",
            Self::Cloud => "cloud",
        })
    }
}

/// A stored value, with the metadata the cascade and reconciliation need.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Record<V> {
    /// The stored value.
    pub value: V,
    /// A version chosen by the writer. Reconciliation keeps the highest version.
    pub version: u64,
    /// The writer's clock when the record was written, in milliseconds since the Unix
    /// epoch. Staleness is measured from this instant.
    pub updated_at: u64,
}

/// A tier that could not be read or written: offline, timed out, or refused.
///
/// This is not a miss. A key a tier does not hold is `Ok(None)`.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct LayerError {
    /// What went wrong, for a log or a message to the user.
    pub message: String,
}

impl LayerError {
    /// Builds an error with the given message.
    pub fn new(message: impl Into<String>) -> Self {
        Self {
            message: message.into(),
        }
    }
}

impl fmt::Display for LayerError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(&self.message)
    }
}

impl std::error::Error for LayerError {}

/// One storage tier. An adapter implements this; the core never names a concrete store.
///
/// The futures are not `Send`. The browser and a Worker are single-threaded, and a native
/// host that needs `Send` wraps its adapter.
pub trait Layer<V> {
    /// Reads the record stored under `key`. A missing key is `Ok(None)`.
    fn get(&self, key: &str) -> impl Future<Output = Result<Option<Record<V>>, LayerError>>;

    /// Stores `record` under `key`, replacing whatever was there.
    fn put(&self, key: &str, record: Record<V>) -> impl Future<Output = Result<(), LayerError>>;

    /// Removes `key`. Removing a key that is not there succeeds.
    fn delete(&self, key: &str) -> impl Future<Output = Result<(), LayerError>>;
}

/// A reference to a layer is a layer, so a host can keep ownership of an adapter.
impl<V, T: Layer<V> + ?Sized> Layer<V> for &T {
    fn get(&self, key: &str) -> impl Future<Output = Result<Option<Record<V>>, LayerError>> {
        (**self).get(key)
    }

    fn put(&self, key: &str, record: Record<V>) -> impl Future<Output = Result<(), LayerError>> {
        (**self).put(key, record)
    }

    fn delete(&self, key: &str) -> impl Future<Output = Result<(), LayerError>> {
        (**self).delete(key)
    }
}

/// An in-memory tier: the reference adapter, and the test double for the cascade.
///
/// [`MemoryLayer::set_available`]`(false)` makes every call fail, as a tier that is offline
/// would.
#[derive(Debug)]
pub struct MemoryLayer<V> {
    records: RefCell<BTreeMap<String, Record<V>>>,
    available: Cell<bool>,
}

impl<V> MemoryLayer<V> {
    /// An empty, available layer.
    #[must_use]
    pub fn new() -> Self {
        Self {
            records: RefCell::new(BTreeMap::new()),
            available: Cell::new(true),
        }
    }

    /// Makes every subsequent call succeed (`true`) or fail with [`LayerError`] (`false`).
    pub fn set_available(&self, available: bool) {
        self.available.set(available);
    }

    /// Reads a record without going through the async interface. Hosts use it for
    /// inspection, and tests use it to assert on what a tier holds.
    #[must_use]
    pub fn peek(&self, key: &str) -> Option<Record<V>>
    where
        V: Clone,
    {
        self.records.borrow().get(key).cloned()
    }

    fn check(&self) -> Result<(), LayerError> {
        if self.available.get() {
            Ok(())
        } else {
            Err(LayerError::new("memory layer is unavailable"))
        }
    }
}

impl<V> Default for MemoryLayer<V> {
    fn default() -> Self {
        Self::new()
    }
}

impl<V: Clone> Layer<V> for MemoryLayer<V> {
    async fn get(&self, key: &str) -> Result<Option<Record<V>>, LayerError> {
        self.check()?;
        Ok(self.records.borrow().get(key).cloned())
    }

    async fn put(&self, key: &str, record: Record<V>) -> Result<(), LayerError> {
        self.check()?;
        self.records.borrow_mut().insert(key.to_owned(), record);
        Ok(())
    }

    async fn delete(&self, key: &str) -> Result<(), LayerError> {
        self.check()?;
        self.records.borrow_mut().remove(key);
        Ok(())
    }
}
