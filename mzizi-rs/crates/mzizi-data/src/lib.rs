//! Mzizi data: the shared base of Mzizi's data crates, and the data layer above it.
//!
//! Two layers live in this crate, and they answer different questions.
//!
//! **The transport and the error type** (the base, shared by every database client). A
//! Cloudflare Worker has no threads and no `std` sockets, so the official database drivers do
//! not build for it. The Mzizi clients speak each database's wire protocol themselves, sans-IO:
//! the protocol core is generic over [`io::Io`], a pair of `write_all` and `read_exact`, and
//! never opens a socket. The host supplies the transport (`workers::SocketIo` on a Worker, an
//! in-memory peer in tests), so the handshake, the authentication and the cursor handling all
//! run in plain native tests.
//!
//! - [`io::Io`], the transport trait;
//! - [`Error`] and [`Result`], the error every data crate reports;
//! - `workers::SocketIo`, a Worker's outbound TLS socket as an `Io` (feature `workers`,
//!   `wasm32` only).
//!
//! **The data layer** (this crate's cascade). It owns data logic and no UI and no storage
//! client:
//!
//! - [`Cascade::fetch`] reads local, then edge, then cloud. Within its time-to-live a fresh local
//!   record answers alone; a stale or missing one keeps the read going, and the newest fresh
//!   record wins. The cloud is authoritative for "no record".
//! - [`Cascade::reconcile`] brings every reachable tier to the winning record. A confirmed record
//!   beats a pending one, then the higher version wins, then the more authoritative tier.
//! - [`Cascade::apply_optimistic`] and [`Cascade::delete`] write local first, then edge, then
//!   cloud, as pending copies, then confirm them. A failure restores every attempted tier to its
//!   own previous record, exactly.
//! - Deletes are tombstones, kept (no garbage collection yet).
//!
//! The three tiers are the [`Layer`] trait. The adapters that implement it are separate crates
//! or modules: a wire-protocol backend such as `mzizi-mongodb` builds its own `Layer` on the
//! `Io` transport, and the browser and native local stores (IndexedDB, SQLite) and the edge and
//! cloud stores (D1 and KV, Supabase) come later. [`MemoryLayer`] is the in-memory reference
//! adapter. Nothing in this crate opens a connection, reads the wall clock, or depends on a
//! runtime; the host supplies a [`Clock`].
//!
//! The server harness is a separate crate, `mzizi-harness`, that every server component plugs
//! into; it is the same harness the UI and the language use.
//!
//! The clients are separate crates on top of the transport: `mzizi-mongodb` today; Postgres and
//! SQLite would be `mzizi-postgres` and `mzizi-sqlite`. There is deliberately no query API common
//! to a document store and a SQL database: what they share is the transport and the error type,
//! not a query language.
//!
//! # Where the data layer sits
//!
//! It is a production dependency (owner decision 6.3, mzizi-registry#503) and the data layer of
//! node N5, resilience. It compiles to `wasm32-unknown-unknown`. It is not published and is not
//! wired into any app until the owner sets the WASM payload budget (decision 6.2).
//!
//! ```
//! use mzizi_data::{Cascade, Layer, ManualClock, MemoryLayer, Record, Source};
//! use std::future::Future;
//! use std::pin::pin;
//! use std::task::{Context, Poll, Waker};
//!
//! // A minimal executor for this example only: the in-memory tiers never wait.
//! fn block_on<F: Future>(future: F) -> F::Output {
//!     let mut cx = Context::from_waker(Waker::noop());
//!     let mut future = pin!(future);
//!     match future.as_mut().poll(&mut cx) {
//!         Poll::Ready(value) => value,
//!         Poll::Pending => unreachable!("in-memory tiers never pend"),
//!     }
//! }
//!
//! let (local, edge, cloud) = (MemoryLayer::new(), MemoryLayer::new(), MemoryLayer::new());
//! let clock = ManualClock::new(1_000);
//! let cascade = Cascade::new(&local, &edge, &cloud, &clock);
//!
//! // Only the cloud holds the record, as it would after another device wrote it.
//! block_on(cloud.put("greeting", Record::live("hello", 3, 900))).unwrap();
//!
//! let found = block_on(cascade.fetch("greeting")).unwrap().unwrap();
//! assert_eq!(found.value, "hello");
//! assert_eq!(found.source, Source::Cloud);
//! assert!(!found.stale);
//!
//! // The read wrote the record back to the local tier, so the next read is local.
//! assert_eq!(block_on(cascade.fetch("greeting")).unwrap().unwrap().source, Source::Local);
//! ```

pub mod io;

#[cfg(all(feature = "workers", target_arch = "wasm32"))]
pub mod workers;

mod cascade;
mod clock;
mod layer;

pub use cascade::{Cascade, CascadeError, Fetched, OptimisticError, SyncReport, WriteOutcome};
pub use clock::{Clock, ManualClock};
pub use layer::{Layer, MemoryLayer, Record, Source};

/// What can go wrong. Messages never carry the connection string, a password
/// or a document's content.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Error {
    /// The connection string is unusable.
    Uri(String),
    /// A socket failed or closed, or a data tier is unreachable.
    Io(String),
    /// A timeout.
    Timeout(&'static str),
    /// A malformed document in the database's own encoding (BSON, for MongoDB).
    Codec(String),
    /// The server spoke out of turn or sent something unexpected.
    Protocol(String),
    /// Authentication failed.
    Auth(String),
    /// The server answered with an error.
    Server {
        /// The server's error code.
        code: i64,
        /// The server's message.
        message: String,
    },
    /// The caller asked for something the read-only client refuses.
    Refused(String),
}

impl std::fmt::Display for Error {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Error::Uri(m) => write!(f, "connection string: {m}"),
            Error::Io(m) => write!(f, "socket: {m}"),
            Error::Timeout(what) => write!(f, "timed out: {what}"),
            Error::Codec(m) => write!(f, "codec: {m}"),
            Error::Protocol(m) => write!(f, "protocol: {m}"),
            Error::Auth(m) => write!(f, "authentication: {m}"),
            Error::Server { code, message } => write!(f, "server error {code}: {message}"),
            Error::Refused(m) => write!(f, "refused: {m}"),
        }
    }
}

impl std::error::Error for Error {}

/// `Result` with this crate's [`Error`].
pub type Result<T> = std::result::Result<T, Error>;
