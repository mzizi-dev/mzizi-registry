//! The tiers the cascade reads and writes, and the record each one holds.

use std::cell::{Cell, RefCell};
use std::collections::BTreeMap;
use std::fmt;
use std::future::Future;

/// Which tier answered a read, or holds a record.
#[non_exhaustive]
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

/// A stored entry: a live value, or a tombstone that records a delete.
///
/// A tombstone is an ordinary versioned record with `value: None`. Reconciliation treats it
/// like any other record, so a newer delete wins over an older live copy. Tombstones are
/// kept; this crate has no garbage collection for them.
#[non_exhaustive]
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Record<V> {
    /// The value, or `None` for a tombstone.
    pub value: Option<V>,
    /// A version chosen by the writer. Higher versions are newer.
    pub version: u64,
    /// The writer's clock when the record was written, in milliseconds since the Unix epoch.
    /// Staleness is measured from this instant.
    pub updated_at: u64,
    /// `true` while an optimistic write is not yet confirmed on every tier. Reconciliation
    /// prefers a record that is not pending; see [`crate::Cascade::reconcile`].
    pub pending: bool,
}

impl<V> Record<V> {
    /// A live, confirmed record.
    pub fn live(value: V, version: u64, updated_at: u64) -> Self {
        Self::from_parts(Some(value), version, updated_at, false)
    }

    /// A confirmed tombstone: the key was deleted at `version`.
    pub fn tombstone(version: u64, updated_at: u64) -> Self {
        Self::from_parts(None, version, updated_at, false)
    }

    /// Builds a record from its parts. An adapter uses this to decode a stored row.
    pub fn from_parts(value: Option<V>, version: u64, updated_at: u64, pending: bool) -> Self {
        Self {
            value,
            version,
            updated_at,
            pending,
        }
    }

    /// Whether this record is a tombstone.
    #[must_use]
    pub fn is_tombstone(&self) -> bool {
        self.value.is_none()
    }
}

/// A tier that could not be read or written: offline, timed out, or refused.
///
/// This is not a miss. A key a tier does not hold is `Ok(None)`.
#[non_exhaustive]
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
/// A missing key is `Ok(None)`. `Err` means the tier could not answer. A `put` or `delete`
/// that returns `Err` may still have been applied, so the cascade restores such a tier too.
///
/// # Send
///
/// The crate adds no `Send` bound. Whether the futures a [`crate::Cascade`] returns are
/// `Send` follows the concrete adapter and clock types: with `Send` adapters and clock, the
/// futures are `Send`, which a native multi-threaded host needs to spawn them. A browser or a
/// Worker is single-threaded and needs no `Send`.
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

/// An in-memory tier: the reference adapter for the crate's examples. It is single-threaded.
///
/// With the `test-util` feature it also exposes [`MemoryLayer::set_available`] and
/// [`MemoryLayer::peek`], for a host's own tests.
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
    #[cfg(feature = "test-util")]
    pub fn set_available(&self, available: bool) {
        self.available.set(available);
    }

    /// Reads a record without going through the async interface.
    #[cfg(feature = "test-util")]
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
