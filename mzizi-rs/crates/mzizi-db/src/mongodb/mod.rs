//! MongoDB over its wire protocol: `OP_MSG`, SCRAM-SHA-256 and a small BSON
//! codec. Read-only by design.
//!
//! - [`bson`]: the codec and the ordered `Doc`;
//! - [`wire`]: `OP_MSG` framing;
//! - [`scram`]: SCRAM-SHA-256 (RFC 5802 / 7677);
//! - [`uri`]: the seed-list connection string (`mongodb://`, not `+srv`);
//! - [`conn`]: handshake, authentication, commands and the read-only helpers
//!   `find`, `find_one` and `aggregate` (no writes, and no `$out` / `$merge`).
//!
//! Reads are sent with read preference `secondaryPreferred`, so any member of
//! the replica set answers (the first seed host that responds is used).

pub mod bson;
pub mod conn;
pub mod scram;
pub mod uri;
pub mod wire;
