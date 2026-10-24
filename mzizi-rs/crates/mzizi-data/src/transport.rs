//! The wire, as the host implements it.
//!
//! The crate never opens a connection. A host implements [`Transport`] over `fetch` (browser)
//! or its HTTP client (native). The endpoints it maps to are `POST /v1/mutations` for
//! [`Transport::submit`] and `GET /v1/mutations/{id}` (one id) or `GET /v1/mutations?ids=`
//! (up to [`MAX_STATUS_BATCH`]) for [`Transport::status`].

use std::future::Future;

use crate::Error;
use crate::layer::Record;
use crate::mutation::{FailReason, Mutation};
use crate::request_id::RequestId;

/// The largest number of ids one status request may carry.
pub const MAX_STATUS_BATCH: usize = 50;

/// What the server said to a submitted mutation.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Submitted {
    /// Accepted (202) with the same request id. Its status is polled from now on.
    Accepted,
    /// Refused at once, for a reason that will not change if it is sent again.
    Rejected(FailReason),
}

/// The server's current view of one mutation.
#[derive(Debug, Clone, PartialEq)]
pub enum StatusReply<V> {
    /// Not applied yet, or not yet seen by the server.
    Pending,
    /// Applied. The record is the document as the server now holds it.
    Applied(Record<V>),
    /// Refused after acceptance.
    Failed(FailReason),
}

/// The wire to the server.
///
/// Every `Err` is a failure to reach the server, which keeps the mutation queued. A refusal
/// the server states is never an `Err`: it is [`Submitted::Rejected`] or [`StatusReply::Failed`].
pub trait Transport<V> {
    /// Sends one mutation.
    fn submit(&self, mutation: &Mutation<V>) -> impl Future<Output = Result<Submitted, Error>>;

    /// The status of each id. Ids the server does not know are reported as
    /// [`StatusReply::Pending`]. The caller never sends more than [`MAX_STATUS_BATCH`] ids.
    fn status(
        &self,
        ids: &[RequestId],
    ) -> impl Future<Output = Result<Vec<(RequestId, StatusReply<V>)>, Error>>;
}

/// A reference to a transport is a transport.
impl<V, T: Transport<V> + ?Sized> Transport<V> for &T {
    fn submit(&self, mutation: &Mutation<V>) -> impl Future<Output = Result<Submitted, Error>> {
        (**self).submit(mutation)
    }

    fn status(
        &self,
        ids: &[RequestId],
    ) -> impl Future<Output = Result<Vec<(RequestId, StatusReply<V>)>, Error>> {
        (**self).status(ids)
    }
}
