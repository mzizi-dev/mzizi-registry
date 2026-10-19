//! Mzizi database clients that run where the usual drivers cannot: a Cloudflare
//! Worker has no threads and no `std` sockets, so the official drivers do not
//! build for it. This crate speaks each database's wire protocol itself.
//!
//! The design is sans-IO. A protocol core is generic over [`io::Io`], a pair of
//! `write_all` and `read_exact`, and never opens a socket. The host supplies the
//! transport (`workers::SocketIo` on a Worker, an in-memory peer in tests), so
//! the whole handshake, the authentication and the cursor handling run in plain
//! native tests.
//!
//! | Module | Database | Feature | State |
//! | ------ | -------- | ------- | ----- |
//! | [`mongodb`] | MongoDB (`OP_MSG`, SCRAM-SHA-256) | `mongodb` (default) | read-only |
//!
//! A relational client (Postgres) and an SQLite client would be modules of the
//! same shape, behind their own features. Neither exists yet, and the crate
//! deliberately offers no query API common to a document store and a SQL
//! database: what they share is the transport, the error type and the
//! connection-string handling, not a query language.

pub mod io;

#[cfg(feature = "mongodb")]
pub mod mongodb;

#[cfg(all(feature = "workers", target_arch = "wasm32"))]
pub mod workers;

/// Test-only inputs, read from `testdata/vectors.txt`.
#[cfg(test)]
pub(crate) mod testdata {
    const RAW: &str = include_str!("../testdata/vectors.txt");

    /// The value of `key`; panics when the fixture lacks it.
    pub fn get(key: &str) -> String {
        RAW.lines()
            .filter(|l| !l.starts_with('#'))
            .find_map(|l| l.split_once('=').filter(|(k, _)| *k == key))
            .map(|(_, v)| v.to_owned())
            .unwrap_or_else(|| panic!("testdata has no `{key}`"))
    }
}

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
    /// A malformed BSON document.
    Bson(String),
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
            Error::Bson(m) => write!(f, "bson: {m}"),
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
