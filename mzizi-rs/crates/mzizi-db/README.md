# mzizi-db

Database clients for places where the usual drivers cannot run. A Cloudflare Worker has no
threads and no `std` sockets, so the official MongoDB driver does not build for it: tokio's
`net` feature needs `mio`, which has no backend on `wasm32-unknown-unknown`. This crate
speaks the database's wire protocol itself.

```toml
[dependencies]
mzizi-db = "0.3"                                              # MongoDB protocol core
mzizi-db = { version = "0.3", features = ["workers"] }        # plus the Worker host (wasm32)
```

## What is here

| Module    | Database | Feature             | State                                      |
| --------- | -------- | ------------------- | ------------------------------------------ |
| `mongodb` | MongoDB  | `mongodb` (default) | read-only: `find`, `find_one`, `aggregate` |
| `workers` | (host)   | `workers`, wasm32   | a TLS socket and a pooled connection       |

Postgres and SQLite are **not** here. They would be modules of the same shape behind their
own features. The crate deliberately offers no query API common to a document store and a SQL
database: what the databases share is the transport (`io::Io`), the error type and the
connection-string handling, not a query language.

## Sans-IO

A protocol core is generic over `io::Io`, a `write_all` and a `read_exact`, and never opens a
socket. The host supplies the transport: `workers::SocketIo` on a Worker, a scripted
in-memory peer in the tests. So the whole handshake, the SCRAM-SHA-256 exchange and the cursor
handling run in plain native tests (33 of them, including the RFC 7677 exchange and
hostile-server cases). This is the registry's own boundary, drawn at I/O rather than at language.

## MongoDB, read-only on purpose

- `OP_MSG` over one TLS connection, SCRAM-SHA-256, a small BSON codec.
- Reads carry read preference `secondaryPreferred` and a server-side time limit; results are
  capped (`MAX_FIND_DOCS`, `MAX_AGGREGATE_DOCS`); database and collection names are validated.
- `aggregate` refuses `$out` and `$merge`. There is no write path.
- `mongodb://` seed lists only; `mongodb+srv://` is refused with a way forward.
- Error messages are written not to carry the connection string, a password or a document's
  content (the connection-string parser has a test that the password never appears).

## What is not verified

The protocol core is tested natively and the Worker host type-checks and passes clippy for
`wasm32-unknown-unknown`. A live connection from a deployed Worker to an Atlas cluster is
exercised by the application that consumes it, not by this crate's tests.

## Licence

Apache-2.0, like the rest of the registry.
