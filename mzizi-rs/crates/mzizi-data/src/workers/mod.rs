//! The Cloudflare Workers host: the transport every Mzizi database client uses.
//!
//! Compiled only for `wasm32` with the `workers` feature, because `worker` has no native
//! build.

mod socket;

pub use socket::{IO_TIMEOUT, SocketIo, within};
