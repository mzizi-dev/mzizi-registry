//! Mzizi MongoDB: MongoDB over its wire protocol (`OP_MSG`, SCRAM-SHA-256 and a small BSON
//! codec) for places the official driver cannot build, such as a Cloudflare Worker.
//! Read-only by design.
//!
//! - [`bson`]: the codec and the ordered `Doc`;
//! - [`wire`]: `OP_MSG` framing;
//! - [`scram`]: SCRAM-SHA-256 (RFC 5802 / 7677);
//! - [`uri`]: the seed-list connection string (`mongodb://`, not `+srv`);
//! - [`conn`]: handshake, authentication, commands and the read-only helpers
//!   `find`, `find_one` and `aggregate` (no writes, and no `$out` / `$merge`);
//! - `workers::Mongo` (feature `workers`, `wasm32`): a pooled connection on a Worker.
//!
//! Reads are sent with read preference `secondaryPreferred`, so any member of the replica
//! set answers (the first seed host that responds is used). The transport, [`Error`] and
//! [`Result`] come from `mzizi-data`.

pub mod bson;
pub mod conn;
pub mod scram;
pub mod uri;
pub mod wire;

#[cfg(all(feature = "workers", target_arch = "wasm32"))]
pub mod workers;

pub use mzizi_data::{Error, Result};

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
