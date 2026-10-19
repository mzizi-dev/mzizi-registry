# mzizi-data

What every Mzizi database client shares, so a client is only its protocol.

A Cloudflare Worker has no threads and no `std` sockets, so the official database drivers do
not build for it (for MongoDB: tokio's `net` feature needs `mio`, which has no backend on
`wasm32-unknown-unknown`). The Mzizi clients speak each database's wire protocol themselves,
sans-IO.

```toml
[dependencies]
mzizi-data = "0.3"                                        # Io, Error, Result
mzizi-data = { version = "0.3", features = ["workers"] }  # plus the Worker socket (wasm32)
```

## What is here

| Item                | Feature           | What it is                                      |
| ------------------- | ----------------- | ----------------------------------------------- |
| `io::Io`            | (always)          | a `write_all` and a `read_exact`: the transport |
| `Error`, `Result`   | (always)          | the error type every client returns             |
| `workers::SocketIo` | `workers`, wasm32 | a Worker's outbound TLS socket as an `Io`       |

## The clients

| Crate           | Database | State                                      |
| --------------- | -------- | ------------------------------------------ |
| `mzizi-mongodb` | MongoDB  | read-only: `find`, `find_one`, `aggregate` |

Postgres and SQLite are **not** here. They would be `mzizi-postgres` and `mzizi-sqlite` on this
same core. There is deliberately no query API common to a document store and a SQL database:
what the databases share is the transport and the error type, not a query language.

## Sans-IO

A protocol core is generic over `io::Io` and never opens a socket. The host supplies the
transport: `SocketIo` on a Worker, a scripted in-memory peer in the tests. So the handshake,
the authentication and the cursor handling run in plain native tests.

## Licence

Apache-2.0, like the rest of the registry.
