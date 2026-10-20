//! What a write is, and where it stands.

use std::fmt;

use crate::request_id::RequestId;

/// What a mutation does to a document.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Op {
    /// Store the payload as the whole document.
    Set,
    /// Merge the payload into the document with [`Patch::apply`].
    Update,
    /// Remove the document.
    Delete,
}

/// Why the server refused a mutation. A refused mutation leaves the outbox and its optimistic
/// change is reverted.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum FailReason {
    /// The `base_version` is stale: the document changed since the client read it.
    Conflict,
    /// The mutation is malformed.
    Invalid,
    /// The caller may not change this document.
    Forbidden,
}

impl fmt::Display for FailReason {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(match self {
            FailReason::Conflict => "conflict",
            FailReason::Invalid => "invalid",
            FailReason::Forbidden => "forbidden",
        })
    }
}

/// Where a mutation stands, from the client's side.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum MutationStatus {
    /// In the outbox, not yet acknowledged by the server.
    QueuedLocal,
    /// Acknowledged by the server (202), not yet applied.
    Accepted,
    /// Applied by the server, which assigned `version`.
    Applied {
        /// The document's version after the mutation.
        version: u64,
    },
    /// Refused by the server. Its optimistic change is reverted.
    Failed(FailReason),
    /// Not settled within the status timeout. It is re-checked on the next start and never
    /// re-sent.
    Unknown,
}

impl MutationStatus {
    /// Applied or failed: nothing more will change.
    #[must_use]
    pub fn is_settled(&self) -> bool {
        matches!(
            self,
            MutationStatus::Applied { .. } | MutationStatus::Failed(_)
        )
    }
}

/// One write to one document.
#[derive(Debug, Clone, PartialEq)]
pub struct Mutation<V> {
    /// The client-generated id. The server applies a given id at most once.
    pub request_id: RequestId,
    /// The collection the document is in. It must be non-empty and contain no `/`.
    pub collection: String,
    /// The document's id within the collection. Non-empty, with no `/`.
    pub doc_id: String,
    /// What the mutation does.
    pub op: Op,
    /// The value for `Set`, the patch for `Update`, nothing for `Delete`.
    pub payload: Option<V>,
    /// The version the caller read. Required for `Update` and `Delete`: a different current
    /// version is a conflict. Optional for `Set`.
    pub base_version: Option<u64>,
    /// The client's clock when the mutation was made. For diagnostics only, never ordering.
    pub client_ts: u64,
}

impl<V> Mutation<V> {
    /// The document this mutation is for, as `collection/doc_id`.
    #[must_use]
    pub fn key(&self) -> String {
        format!("{}/{}", self.collection, self.doc_id)
    }
}

/// How an `Update` merges into the document it changes.
pub trait Patch {
    /// Merges `patch` into `self`.
    fn apply(&mut self, patch: &Self);
}
