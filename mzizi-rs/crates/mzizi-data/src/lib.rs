//! Mzizi's data layer: where a value is read from, how the tiers agree, and how a write
//! that fails is taken back.
//!
//! # Reads
//!
//! [`Cascade::fetch`] reads local first. A local record within its time-to-live is returned
//! without asking the edge or the cloud. A stale or missing local record keeps the read going:
//! the edge, then the cloud. The newest record found wins, and it is written back to every
//! faster tier that answered. If nothing fresh is found, the newest stale record is returned
//! with [`Fetched::stale`] set. The cloud is authoritative for "no record": a cloud miss is
//! `Ok(None)`, even if local or edge failed on the way.
//!
//! # Versions, tombstones and conflicts
//!
//! Every record carries a version. A higher version is newer; a version tie goes to the
//! more authoritative tier (cloud, then edge, then local). A delete is a tombstone with a
//! version of its own, so a newer delete beats an older live copy, and nothing brings the
//! record back. Tombstones are kept: this crate has no garbage collection for them.
//!
//! # Writes
//!
//! [`Cascade::apply_optimistic`] and [`Cascade::delete`] write local first, then edge, then
//! cloud, at a version above the highest any readable tier holds. Each write is first made
//! *pending*. If a tier fails, every tier the write attempted is restored to its own previous
//! record, exactly, and the error says whether that restore completed. Once every tier has
//! accepted the pending copy, each is rewritten as *confirmed*.
//!
//! A pending record that could not be restored stays pending. [`Cascade::reconcile`] never
//! chooses a pending record while a confirmed one exists, so a rejected write cannot win
//! after a partition heals.
//!
//! # Reconciliation
//!
//! [`Cascade::reconcile`] brings every reachable tier to the winning record. The host
//! schedules it; the crate spawns nothing.
//!
//! # What it does not do
//!
//! It contains no UI and no storage client. The three tiers are the [`Layer`] trait. The
//! adapters for SQLite, IndexedDB, Cloudflare D1 and KV, and Supabase come in later changes.
//! [`MemoryLayer`] is the in-memory reference adapter. The crate has no dependencies, performs
//! no I/O, and reads no wall clock; the host supplies a [`Clock`].
//!
//! # Where it sits
//!
//! It is a production dependency (owner decision 6.3, mzizi-registry#503) and the data layer
//! of node N5, resilience. It compiles to `wasm32-unknown-unknown` for the browser and a
//! Worker. It is not published and is not wired into any app until the owner sets the WASM
//! payload budget (decision 6.2). See the crate README.
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
//! block_on(cloud.put("greeting", Record::live("hello", 3, 900))).unwrap();
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

pub use cascade::{Cascade, CascadeError, Fetched, OptimisticError, SyncReport, WriteOutcome};
pub use clock::{Clock, ManualClock};
pub use layer::{Layer, LayerError, MemoryLayer, Record, Source};
