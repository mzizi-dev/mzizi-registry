# mzizi-mongodb

MongoDB over its wire protocol for places the official driver cannot build, such as a
Cloudflare Worker: `OP_MSG`, SCRAM-SHA-256 and a small BSON codec. Sans-IO, and read-only on
purpose. The transport trait, `Error` and `Result` come from [`mzizi-data`](../mzizi-data).

```toml
[dependencies]
mzizi-mongodb = ">=0.6.0"                                     # the protocol core
mzizi-mongodb = { version = ">=0.6.0", features = ["workers"] }  # plus the pooled Worker client (wasm32)
```

## What is here

| Module    | What it is                                                                      |
| --------- | ------------------------------------------------------------------------------- |
| `bson`    | the codec and the ordered `Doc`                                                 |
| `wire`    | `OP_MSG` framing                                                                |
| `scram`   | SCRAM-SHA-256 (RFC 5802 / 7677)                                                 |
| `uri`     | the seed-list connection string                                                 |
| `conn`    | handshake, authentication, `find`, `find_one`, `aggregate`, `aggregate_joining` |
| `workers` | `Mongo`, a pooled connection on a Worker (feature `workers`, wasm32)            |

## Read-only on purpose

- Reads carry read preference `secondaryPreferred` and a server-side time limit; results are
  capped (`MAX_FIND_DOCS`, `MAX_AGGREGATE_DOCS`); database and collection names are validated.
- `aggregate` refuses `$out` and `$merge`, at any depth. There is no write path.
- `aggregate` refuses any `$lookup`, `$graphLookup` or `$unionWith`, at any depth (sub-pipelines
  and `$facet` included), that reads a collection other than its own. To join, name the
  collections a pipeline may read: `aggregate_joining(db, coll, pipeline, &["persons"])`.
  Another database is never allowed. The refusal is reported to the harness as
  `cross_collection`.
- `$where`, `$function` and `$accumulator` (server-side JavaScript) are refused at any depth of
  a filter, projection or pipeline, before anything is sent.
- The Worker client reuses its pooled connection only for the same user, password,
  `authSource`, hosts and replica set.
- `mongodb://` seed lists only; `mongodb+srv://` is refused with a way forward.
- Error messages are written not to carry the connection string, a password or a document's
  content (the connection-string parser has a test that the password never appears). A server
  error keeps its code and a fixed text for it (`server_message`); MongoDB's own `errmsg`, which
  can echo the query, is dropped.
- Until the login succeeds, a reply over 64 KiB (`MAX_PRE_AUTH_MESSAGE`) is refused from its
  header, before the body is read; after it, the limit is 48 MB.
- The password in `Uri`, the salted password, the SCRAM keys and the `SaltCache` entries are
  wiped from memory when dropped (`zeroize`). `Uri::password` is a `Zeroizing<String>`.
- The `hello` handshake names the driver `mzizi-mongodb` at the crate's version, and the
  application only when you set one (`with_app_name`, on `Connection` and `workers::Mongo`).

## What is not verified

The protocol core is tested natively (48 unit tests in this crate, including the RFC 7677 exchange and
hostile-server cases) and the Worker host type-checks and passes clippy for
`wasm32-unknown-unknown`. A live connection from a deployed Worker to an Atlas cluster is
exercised by the application that consumes it, not by this crate's tests.

## Licence

Apache-2.0, like the rest of the registry.
