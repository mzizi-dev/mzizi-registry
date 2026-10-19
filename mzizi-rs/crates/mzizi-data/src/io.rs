//! The byte transport every backend runs over.
//!
//! A protocol core in this crate never opens a socket. It is generic over [`Io`]
//! and the host supplies the transport: a Worker's TLS socket in production
//! (`workers::SocketIo`), a scripted in-memory peer in the tests. That is what
//! keeps the wire protocols testable natively and the crate free of any runtime.

use std::future::Future;

use crate::Result;

/// A byte transport.
pub trait Io {
    /// Write the whole buffer and flush it.
    fn write_all(&mut self, buf: &[u8]) -> impl Future<Output = Result<()>>;
    /// Exactly `n` bytes, or an error if the peer closes first.
    fn read_exact(&mut self, n: usize) -> impl Future<Output = Result<Vec<u8>>>;
}
