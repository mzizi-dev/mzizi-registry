# mzizi-data

Mzizi's shared data crate: the transport and error type every database client uses, and the data
layer above them.

> **Publishes with the next registry release to main, and is not wired into any app.** Owner decision 6.3
> (production) and 6.4 (node N5 resilience) are recorded in
> [mzizi-registry#503](https://github.com/mzizi-dev/mzizi-registry/issues/503). The WASM payload budget (6.2)
> is still open and gates any app that uses this crate.

A Cloudflare Worker has no threads and no `std` sockets, so the official database drivers do
not build for it (for MongoDB: tokio's `net` feature needs `mio`, which has no backend on
`wasm32-unknown-unknown`). The Mzizi clients speak each database's wire protocol themselves,
sans-IO.

Inside this workspace, depend on it by path. Outside it, depend on the published version:

```toml
[dependencies]
# Inside this workspace: by path, with the minimum version it was released at.
mzizi-data = { path = "../mzizi-data", version = ">=0.5.0" }                       # Io, Error, Result, the data layer
mzizi-data = { path = "../mzizi-data", version = ">=0.5.0", features = ["workers"] }  # plus the Worker socket (wasm32)
# Outside it: the published crate, at a minimum version.
mzizi-data = ">=0.5.0"                                        # Io, Error, Result, the data layer
mzizi-data = { version = ">=0.5.0", features = ["workers"] }  # plus the Worker socket (wasm32)
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

## The data layer

This crate also holds the data layer that sits above the transport: a local, edge and cloud fetch cascade,
sync reconciliation, tombstones, staleness, and local-first writes that roll back. It has no UI, no storage
client and no dependencies.

## Reads

`Cascade::fetch` reads local first.

- **Within the time-to-live, local answers alone.** A fresh local record is returned without
  asking the edge or the cloud. This is by design: staleness is bounded by the time-to-live, so
  another device's change becomes visible once the local record is older than its time-to-live.
- **Past the time-to-live, the read keeps looking.** The edge is asked next. The cloud is asked
  unless the edge already has a fresh record that sorts above the local one. The record that
  sorts highest wins. If no fresh record is found, the highest stale record is returned with
  `stale = true`, and any tier failures are listed in `skipped`.
- **Write-back.** The winner is written to each faster tier that answered. A write re-reads its
  target first and writes only when the incoming record sorts higher, so a concurrent newer
  record is never replaced by an older one. Write-back failures appear in `skipped`.
- **Staleness.** A record is stale when `now - updated_at` exceeds its time-to-live (default 30
  seconds; per key with `set_ttl`). A record stamped after `now` cannot be aged, so it is
  reported stale too.
- **A cloud miss is authoritative.** When the cloud says there is no record and no tier held one,
  the result is `Ok(None)`, even if local or edge failed on the way. The cloud is the origin.
- **Errors.** `Err` only when no tier answered: the cloud failed and nothing else held a record.

## Ordering

Every comparison uses one order. A confirmed record beats a pending one. Then the higher version
wins. A version tie goes to the more authoritative tier: cloud, then edge, then local.

## Tombstones

A delete is a versioned tombstone (`Record::tombstone`, or `value: None`). Reconciliation treats it
as an ordinary record, so a newer delete wins and propagates, and an older live copy cannot bring the
record back. `fetch` returns `Ok(None)` for a tombstone. **Tombstones are retained.** This crate has no
garbage collection, so a deployment that needs one must add it with the adapters.

## Writes

`Cascade::apply_optimistic` and `Cascade::delete` write local first, then edge, then cloud, at a
version above the highest any readable tier holds. The write goes in two phases:

1. Every tier is written with the record **pending**. If a tier fails, every tier the write attempted
   (including the one that failed, whose write may still have been applied) is restored to its own
   previous record, exactly, with a delete where it had none. `OptimisticError::Tier { reverted }` says
   whether every restore completed.
2. Once every tier accepts the pending copy, each is rewritten **confirmed**. A tier whose confirmation
   fails is listed in `WriteOutcome::unconfirmed`.

A pending record that could not be restored stays on its tier. `reconcile` never chooses a pending record
while a confirmed one exists, so a rejected write cannot win after a partition heals. A pending record
with no confirmed rival is propagated and then confirmed. A version past `u64::MAX` is an error
(`OptimisticError::VersionOverflow`), and nothing is written.

## Reconciliation

`Cascade::reconcile(key)` brings every reachable tier to the winning record. A tier is in sync only
when the whole record matches, `updated_at` included. A tier that cannot be read is skipped and reported,
and is never written blind. The host decides when to call it: on a timer, when the device comes online,
or after a write.

## Shape of the API

```rust
pub trait Layer<V> {                 // one tier; an adapter implements it
    fn get(&self, key: &str) -> impl Future<Output = Result<Option<Record<V>>, LayerError>>;
    fn put(&self, key: &str, record: Record<V>) -> impl Future<Output = Result<(), LayerError>>;
    fn delete(&self, key: &str) -> impl Future<Output = Result<(), LayerError>>;
}

pub trait Clock { fn now_ms(&self) -> u64; }      // the host supplies the time

pub struct Cascade<V, L, E, C, K> { /* fetch, reconcile, apply_optimistic, delete, set_ttl */ }
pub struct Record<V> { pub value: Option<V>, pub version: u64, pub updated_at: u64, pub pending: bool }
```

Public types are `#[non_exhaustive]`; build records with `Record::live`, `Record::tombstone`, or
`Record::from_parts`. `&L` is a `Layer` and `&K` is a `Clock`, so a host can keep ownership of its tiers.

`MemoryLayer` is the in-memory reference adapter, and it is single-threaded. With the `test-util`
feature it also exposes `set_available` and `peek`, for a host's own tests.

## Send

The crate adds no `Send` bound. Whether the futures a `Cascade` returns are `Send` follows the concrete
adapter and clock types: with `Send` adapters and clock, the futures are `Send`, which a native
multi-threaded host needs to spawn them. A browser or a Worker is single-threaded and needs no `Send`.

## What it does not do

- **No storage clients.** SQLite, IndexedDB, Cloudflare D1 and KV, and Supabase are not in this crate.
  They are adapters for later changes, one `Layer` implementation each.
- **No background timer.** `reconcile` runs when the host calls it.
- **No UI, and no framework.**
- **No enumeration of keys.** Reconciliation works one key at a time.
- **No tombstone garbage collection.**

## Dependencies and size

No dependencies, and no dev dependencies. The tests drive futures with `std::task::Waker::noop()`. The
crate does no I/O and reads no wall clock. Measured sizes are in the pull request that last changed the
crate.

## Build and test

```bash
cargo test -p mzizi-data
cargo test -p mzizi-data --features test-util
cargo build --release --target wasm32-unknown-unknown -p mzizi-data
```

The workspace gates (`cargo fmt`, `cargo clippy -D warnings`, `cargo test --workspace`) run over this
crate in CI, as they do for every member of `mzizi-rs/`.

## The write path

`MziziData` reads through the cascade and writes through an outbox. The host supplies the storage
tiers, the `Transport` (its HTTP client), the `Outbox` (IndexedDB or SQLite; `MemoryOutbox` ships),
the `Clock` (time and sleeps) and the `RandomSource` (request ids). `set`, `update` and `delete`
return a `MutationHandle` as soon as the write is in the outbox. The contract is in
`src/client.rs`.

## Licence

Apache-2.0, like the rest of the registry.
