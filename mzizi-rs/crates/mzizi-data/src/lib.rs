//! Mzizi's data layer: where a value is read from, how the tiers agree, and how a write
//! that fails is taken back.
//!
//! # What it does
//!
//! - **The cascade.** [`Cascade::fetch`] reads a key from the local tier, then the edge,
//!   then the cloud, and stops at the first tier that holds it. It returns the value and
//!   the [`Source`] that answered, and writes the record back to the faster tiers it
//!   missed.
//! - **Staleness.** Each result says whether its record is older than the key's
//!   time-to-live, so a caller can show the value and refresh it in the background.
//! - **Reconciliation.** [`Cascade::reconcile`] brings every reachable tier to the record
//!   with the highest version. A version tie goes to the more authoritative tier, cloud
//!   over edge over local, so the same inputs always give the same answer.
//! - **Optimistic writes.** [`Cascade::apply_optimistic`] writes local first, then edge,
//!   then cloud. If one of them fails, every tier already written is restored, and the
//!   error names the failing tier.
//!
//! # What it does not do
//!
//! It contains no UI and no storage client. The three tiers are the [`Layer`] trait. The
//! adapters for SQLite, IndexedDB, Cloudflare D1 and KV, and Supabase come in later
//! changes. [`MemoryLayer`] is the reference implementation the tests run on. The crate
//! has no dependencies, performs no I/O, and reads no wall clock; the host supplies a
//! [`Clock`].
//!
//! # Where it sits
//!
//! It is a production dependency (owner decision 6.3, mzizi-registry#503) and the data
//! layer of node N5, resilience. It compiles to `wasm32-unknown-unknown` for the browser
//! and a Worker. It is not published and is not wired into any app until the owner sets
//! the WASM payload budget (decision 6.2). See the crate README.
//!
//! ```
//! use mzizi_data::{Cascade, Layer, ManualClock, MemoryLayer, Record, Source};
//! use std::future::Future;
//! use std::pin::pin;
//! use std::task::{Context, Poll, Waker};
//!
//! // A minimal executor for this example only: the in-memory tiers never wait.
//! fn block_on<F: Future>(future: F) -> F::Output {
//!     let mut cx = Context::from_waker(Waker::noop());
//!     let mut future = pin!(future);
//!     match future.as_mut().poll(&mut cx) {
//!         Poll::Ready(value) => value,
//!         Poll::Pending => unreachable!("in-memory tiers never pend"),
//!     }
//! }
//!
//! let (local, edge, cloud) = (MemoryLayer::new(), MemoryLayer::new(), MemoryLayer::new());
//! let clock = ManualClock::new(1_000);
//! let cascade = Cascade::new(&local, &edge, &cloud, &clock);
//!
//! // Only the cloud holds the record, as it would after another device wrote it.
//! let record = Record { value: "hello", version: 3, updated_at: 900 };
//! block_on(cloud.put("greeting", record)).unwrap();
//!
//! let found = block_on(cascade.fetch("greeting")).unwrap().unwrap();
//! assert_eq!(found.value, "hello");
//! assert_eq!(found.source, Source::Cloud);
//! assert!(!found.stale);
//!
//! // The read wrote the record back to the local tier, so the next read is local.
//! assert_eq!(block_on(cascade.fetch("greeting")).unwrap().unwrap().source, Source::Local);
//! ```

mod cascade;
mod clock;
mod layer;

pub use cascade::{Cascade, CascadeError, Fetched, OptimisticError, SyncReport};
pub use clock::{Clock, ManualClock};
pub use layer::{Layer, LayerError, MemoryLayer, Record, Source};
