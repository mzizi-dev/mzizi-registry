# mzizi-mongodb

MongoDB over its wire protocol for places the official driver cannot build, such as a
Cloudflare Worker: `OP_MSG`, SCRAM-SHA-256 and a small BSON codec. Sans-IO, and read-only on
purpose. The transport trait, `Error` and `Result` come from [`mzizi-data`](../mzizi-data).

```toml
[dependencies]
mzizi-mongodb = "0.4"                                        # the protocol core
mzizi-mongodb = { version = "0.4", features = ["workers"] }  # plus the pooled Worker client (wasm32)
```

## What is here

| Module    | What it is                                                           |
| --------- | -------------------------------------------------------------------- |
| `bson`    | the codec and the ordered `Doc`                                      |
| `wire`    | `OP_MSG` framing                                                     |
| `scram`   | SCRAM-SHA-256 (RFC 5802 / 7677)                                      |
| `uri`     | the seed-list connection string                                      |
| `conn`    | handshake, authentication, `find`, `find_one`, `aggregate`           |
| `workers` | `Mongo`, a pooled connection on a Worker (feature `workers`, wasm32) |

## Read-only on purpose

- Reads carry read preference `secondaryPreferred` and a server-side time limit; results are
  capped (`MAX_FIND_DOCS`, `MAX_AGGREGATE_DOCS`); database and collection names are validated.
- `aggregate` refuses `$out` and `$merge`. There is no write path.
- `$where`, `$function` and `$accumulator` (server-side JavaScript) are refused at any depth of
  a filter, projection or pipeline, before anything is sent.
- The Worker client reuses its pooled connection only for the same user, password,
  `authSource`, hosts and replica set.
- `mongodb://` seed lists only; `mongodb+srv://` is refused with a way forward.
- Error messages are written not to carry the connection string, a password or a document's
  content (the connection-string parser has a test that the password never appears).

## What is not verified

The protocol core is tested natively (39 unit tests in this crate, including the RFC 7677 exchange and
hostile-server cases) and the Worker host type-checks and passes clippy for
`wasm32-unknown-unknown`. A live connection from a deployed Worker to an Atlas cluster is
exercised by the application that consumes it, not by this crate's tests.

## Licence

Apache-2.0, like the rest of the registry.
