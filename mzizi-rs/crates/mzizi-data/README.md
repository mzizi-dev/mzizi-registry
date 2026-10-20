# mzizi-data

The data layer behind Mzizi's apps: where a value is read from, how the tiers agree, and
how a write that fails is taken back.

> **A production dependency, built to production standard, and not yet wired into any app
> or published.** Owner decisions on [mzizi-registry#503](https://github.com/mzizi-dev/mzizi-registry/issues/503):
> 6.3, production; 6.4, node N5 (resilience). The WASM payload budget (6.2) is still open,
> so `publish = false` keeps the crate off crates.io and no app depends on it until the
> owner sets that budget.

## What it does

| Piece                       | What it gives you                                                                                                                                                                                                                         |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Cascade::fetch`            | Reads a key from local, then edge, then cloud, and stops at the first tier that holds it. Returns `Fetched { value, source, version, updated_at, fetched_at, stale, skipped }`, and writes the record back to the faster tiers it missed. |
| Staleness                   | `stale` is true when the record is older than the key's time-to-live, measured from the writer's `updated_at`. The default is 30 seconds. Set a TTL per key with `set_ttl`.                                                               |
| `Cascade::reconcile`        | Brings every reachable tier to the record with the highest version. A version tie goes to the more authoritative tier: cloud, then edge, then local. A tier that cannot be read is skipped and reported, and never written blind.         |
| `Cascade::apply_optimistic` | Writes local, then edge, then cloud, at the next version above the newest any tier holds. If a tier fails, every tier already written is restored, and `OptimisticError` names the tier and says whether the restore completed.           |

The cloud tier is authoritative. A cloud miss is `Ok(None)`. If every tier a read reaches
fails, the read is an error, not a miss.

## Shape of the API

```rust
pub trait Layer<V> {                      // one tier; an adapter implements it
    fn get(&self, key: &str) -> impl Future<Output = Result<Option<Record<V>>, LayerError>>;
    fn put(&self, key: &str, record: Record<V>) -> impl Future<Output = Result<(), LayerError>>;
    fn delete(&self, key: &str) -> impl Future<Output = Result<(), LayerError>>;
}

pub trait Clock { fn now_ms(&self) -> u64; }   // the host supplies the time

pub struct Cascade<V, L, E, C, K> { /* local, edge, cloud, clock, ttls */ }
pub struct Record<V> { pub value: V, pub version: u64, pub updated_at: u64 }
pub enum Source { Local, Edge, Cloud }
```

`&L` is a `Layer` and `&K` is a `Clock`, so a host can keep ownership of its tiers.
`MemoryLayer` is the in-memory reference tier, and `ManualClock` is the deterministic clock.

## What it does not do

- **No storage clients.** SQLite, IndexedDB, Cloudflare D1 and KV, and Supabase are not in
  this crate. They are adapters for later changes, one `Layer` implementation each:
  - local: SQLite (native) and IndexedDB (browser);
  - edge: Cloudflare D1 and KV;
  - cloud: Supabase Postgres.
- **No background timer.** `reconcile` runs when the host calls it. The host decides when:
  on a timer, when the device comes online, or after a write.
- **No UI, and no framework.** `MziziListView` and `MziziSearchView` stay out of this crate.
- **No enumeration of keys.** Reconciliation works one key at a time. A full sync needs a
  key listing from each adapter, and that comes with the adapters.
- **Futures are not `Send`.** The browser and a Worker are single-threaded. A native host
  that needs `Send` wraps its adapter.

## Dependencies and size

No dependencies, and no dev dependencies. The tests drive futures with
`std::task::Waker::noop()`. The crate is plain Rust and `std`, and does no I/O. The
release `wasm32-unknown-unknown` size is recorded in the pull request that adds it.

## Build and test

```bash
cargo test -p mzizi-data
cargo build --release --target wasm32-unknown-unknown -p mzizi-data
```

The workspace gates (`cargo fmt`, `cargo clippy -D warnings`, `cargo test --workspace`) run
over this crate in CI, as they do for every member of `mzizi-rs/`.
