//! The Cloudflare Workers host: the transport and the pooled clients.
//!
//! Compiled only for `wasm32` with the `workers` feature, because `worker`
//! has no native build. Everything under it that is not a socket is a pure
//! protocol core, tested natively.

mod socket;

#[cfg(feature = "mongodb")]
mod mongo;

pub use socket::SocketIo;

#[cfg(feature = "mongodb")]
pub use mongo::Mongo;
