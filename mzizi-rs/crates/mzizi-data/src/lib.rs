//! Mzizi data: what every Mzizi database client shares, so a client is only its protocol.
//!
//! A Cloudflare Worker has no threads and no `std` sockets, so the official database
//! drivers do not build for it. The Mzizi clients speak each database's wire protocol
//! themselves, sans-IO: the protocol core is generic over [`io::Io`], a pair of
//! `write_all` and `read_exact`, and never opens a socket. The host supplies the transport
//! (`workers::SocketIo` on a Worker, an in-memory peer in tests), so the handshake, the
//! authentication and the cursor handling all run in plain native tests.
//!
//! This crate holds the shared parts and nothing database-specific:
//!
//! - [`io::Io`], the transport trait;
//! - [`harness::Harness`], where a client reports what it did (pluggable, adaptable, removable);
//! - [`Error`] and [`Result`];
//! - `workers::SocketIo`, a Worker's outbound TLS socket as an `Io` (feature `workers`,
//!   `wasm32` only).
//!
//! The clients are separate crates on top of it: `mzizi-mongodb` today; Postgres and SQLite
//! would be `mzizi-postgres` and `mzizi-sqlite`. There is deliberately no query API common
//! to a document store and a SQL database: what they share is the transport and the error
//! type, not a query language.

pub mod harness;
pub mod io;

#[cfg(all(feature = "workers", target_arch = "wasm32"))]
pub mod workers;

/// What can go wrong. Messages never carry the connection string, a password
/// or a document's content.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Error {
    /// The connection string is unusable.
    Uri(String),
    /// A socket failed or closed.
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
