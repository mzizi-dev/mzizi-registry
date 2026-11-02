//! The Cloudflare Workers host: a pooled, authenticated connection.
//!
//! Compiled only for `wasm32` with the `workers` feature, because `worker` has no native
//! build. The socket itself is `mzizi_data::workers::SocketIo`.

mod mongo;

pub use mongo::Mongo;
