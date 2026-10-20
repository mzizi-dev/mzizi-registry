//! The cascade, reconciliation and optimistic writes, tested through the public API only.
//!
//! Every tier is a [`MemoryLayer`] (or a wrapper of one), so the tests are deterministic:
//! the clock is a [`ManualClock`], and no future ever waits.

use std::cell::Cell;
use std::future::Future;
use std::pin::pin;
use std::task::{Context, Poll, Waker};

use mzizi_data::{
    Cascade, CascadeError, Clock, Layer, LayerError, ManualClock, MemoryLayer, Record, Source,
};

/// Drives a future that never waits. A `Pending` here is a bug in the test layers.
fn block_on<F: Future>(future: F) -> F::Output {
    let mut cx = Context::from_waker(Waker::noop());
    let mut future = pin!(future);
    match future.as_mut().poll(&mut cx) {
        Poll::Ready(value) => value,
        Poll::Pending => panic!("a test layer returned Pending"),
    }
}

fn record(value: &'static str, version: u64, updated_at: u64) -> Record<&'static str> {
    Record {
        value,
        version,
        updated_at,
    }
}

/// Counts reads and writes, so a test can say which tiers the cascade touched.
struct Counted<L> {
    inner: L,
    gets: Cell<u32>,
    puts: Cell<u32>,
}

impl<L> Counted<L> {
    fn new(inner: L) -> Self {
        Self {
            inner,
            gets: Cell::new(0),
            puts: Cell::new(0),
        }
    }
}

impl<V, L: Layer<V>> Layer<V> for Counted<L> {
    async fn get(&self, key: &str) -> Result<Option<Record<V>>, LayerError> {
        self.gets.set(self.gets.get() + 1);
        self.inner.get(key).await
    }

    async fn put(&self, key: &str, record: Record<V>) -> Result<(), LayerError> {
        self.puts.set(self.puts.get() + 1);
        self.inner.put(key, record).await
    }

    async fn delete(&self, key: &str) -> Result<(), LayerError> {
        self.inner.delete(key).await
    }
}

/// Accepts `budget` writes, then refuses every later write while still answering reads.
/// It lets a test make the rollback itself fail.
struct WriteBudget<L> {
    inner: L,
    budget: Cell<u32>,
}

impl<V, L: Layer<V>> Layer<V> for WriteBudget<L> {
    async fn get(&self, key: &str) -> Result<Option<Record<V>>, LayerError> {
        self.inner.get(key).await
    }

    async fn put(&self, key: &str, record: Record<V>) -> Result<(), LayerError> {
        if self.budget.get() == 0 {
            return Err(LayerError::new("write budget spent"));
        }
        self.budget.set(self.budget.get() - 1);
        self.inner.put(key, record).await
    }

    async fn delete(&self, key: &str) -> Result<(), LayerError> {
        self.inner.delete(key).await
    }
}

// ─── Fetch cascade ────────────────────────────────────────────────────────

#[test]
fn local_hit_answers_without_touching_the_lower_tiers() {
    let local = Counted::new(MemoryLayer::<&str>::new());
    let edge = Counted::new(MemoryLayer::<&str>::new());
    let cloud = Counted::new(MemoryLayer::<&str>::new());
    let clock = ManualClock::new(1_000);
    block_on(local.put("k", record("here", 1, 1_000))).unwrap();

    let cascade = Cascade::new(&local, &edge, &cloud, &clock);
    let found = block_on(cascade.fetch("k")).unwrap().unwrap();

    assert_eq!(found.value, "here");
    assert_eq!(found.source, Source::Local);
    assert_eq!((edge.gets.get(), cloud.gets.get()), (0, 0));
}

#[test]
fn edge_hit_writes_back_to_local_and_leaves_the_cloud_alone() {
    let local = MemoryLayer::new();
    let edge = MemoryLayer::new();
    let cloud = Counted::new(MemoryLayer::new());
    let clock = ManualClock::new(1_000);
    block_on(edge.put("k", record("edge", 2, 1_000))).unwrap();

    let cascade = Cascade::new(&local, &edge, &cloud, &clock);
    let found = block_on(cascade.fetch("k")).unwrap().unwrap();

    assert_eq!(found.source, Source::Edge);
    assert_eq!(found.value, "edge");
    assert_eq!(
        cloud.gets.get(),
        0,
        "the cloud is not reached on an edge hit"
    );
    assert_eq!(
        local.peek("k"),
        Some(record("edge", 2, 1_000)),
        "read-through to local"
    );
}

#[test]
fn cloud_hit_writes_back_to_local_and_edge() {
    let local = MemoryLayer::new();
    let edge = MemoryLayer::new();
    let cloud = MemoryLayer::new();
    let clock = ManualClock::new(1_000);
    block_on(cloud.put("k", record("origin", 4, 1_000))).unwrap();

    let cascade = Cascade::new(&local, &edge, &cloud, &clock);
    let found = block_on(cascade.fetch("k")).unwrap().unwrap();

    assert_eq!(found.source, Source::Cloud);
    assert_eq!(found.version, 4);
    assert_eq!(local.peek("k"), Some(record("origin", 4, 1_000)));
    assert_eq!(edge.peek("k"), Some(record("origin", 4, 1_000)));
}

#[test]
fn cloud_miss_is_an_authoritative_none_and_writes_nothing() {
    let local = Counted::new(MemoryLayer::<&str>::new());
    let edge = Counted::new(MemoryLayer::<&str>::new());
    let cloud = Counted::new(MemoryLayer::<&str>::new());
    let clock = ManualClock::new(1_000);

    let cascade = Cascade::new(&local, &edge, &cloud, &clock);
    assert_eq!(block_on(cascade.fetch("absent")).unwrap(), None);
    assert_eq!(local.puts.get() + edge.puts.get() + cloud.puts.get(), 0);
}

#[test]
fn a_failing_local_tier_falls_through_to_edge_and_is_reported_as_skipped() {
    let local = MemoryLayer::new();
    let edge = MemoryLayer::new();
    let cloud = MemoryLayer::new();
    let clock = ManualClock::new(1_000);
    block_on(edge.put("k", record("edge", 2, 1_000))).unwrap();
    local.set_available(false);

    let cascade = Cascade::new(&local, &edge, &cloud, &clock);
    let found = block_on(cascade.fetch("k")).unwrap().unwrap();

    assert_eq!(found.source, Source::Edge);
    assert_eq!(found.skipped.len(), 1);
    assert_eq!(found.skipped[0].0, Source::Local);
    assert_eq!(found.skipped[0].1.message, "memory layer is unavailable");
}

#[test]
fn a_failing_edge_falls_through_to_cloud_and_writes_back_only_to_local() {
    let local = MemoryLayer::new();
    let edge = MemoryLayer::new();
    let cloud = MemoryLayer::new();
    let clock = ManualClock::new(1_000);
    block_on(cloud.put("k", record("origin", 5, 1_000))).unwrap();
    edge.set_available(false);

    let cascade = Cascade::new(&local, &edge, &cloud, &clock);
    let found = block_on(cascade.fetch("k")).unwrap().unwrap();

    assert_eq!(found.source, Source::Cloud);
    assert_eq!(found.skipped[0].0, Source::Edge);
    assert_eq!(local.peek("k"), Some(record("origin", 5, 1_000)));
    assert_eq!(edge.peek("k"), None, "a tier that failed is not written");
}

#[test]
fn every_tier_failing_is_an_error_not_a_miss() {
    let local = MemoryLayer::<&str>::new();
    let edge = MemoryLayer::new();
    let cloud = MemoryLayer::new();
    let clock = ManualClock::new(1_000);
    local.set_available(false);
    edge.set_available(false);
    cloud.set_available(false);

    let cascade = Cascade::new(&local, &edge, &cloud, &clock);
    let err: CascadeError = block_on(cascade.fetch("k")).unwrap_err();

    let tiers: Vec<Source> = err.errors.iter().map(|(s, _)| *s).collect();
    assert_eq!(tiers, vec![Source::Local, Source::Edge, Source::Cloud]);
}

#[test]
fn a_cloud_failure_still_answers_from_a_local_hit() {
    let local = MemoryLayer::new();
    let edge = MemoryLayer::new();
    let cloud = MemoryLayer::new();
    let clock = ManualClock::new(1_000);
    block_on(local.put("k", record("cached", 1, 1_000))).unwrap();
    cloud.set_available(false);

    let cascade = Cascade::new(&local, &edge, &cloud, &clock);
    let found = block_on(cascade.fetch("k")).unwrap().unwrap();

    assert_eq!(found.source, Source::Local);
    assert!(found.skipped.is_empty());
}

#[test]
fn a_cloud_failure_with_nothing_local_is_an_error_even_if_edge_missed() {
    let local = MemoryLayer::<&str>::new();
    let edge = MemoryLayer::<&str>::new();
    let cloud = MemoryLayer::<&str>::new();
    let clock = ManualClock::new(1_000);
    cloud.set_available(false);

    let cascade = Cascade::new(&local, &edge, &cloud, &clock);
    // Local and edge answered "no record", but the cloud could not say, so it is unknown.
    let err = block_on(cascade.fetch("k")).unwrap_err();
    assert_eq!(err.errors.len(), 1);
    assert_eq!(err.errors[0].0, Source::Cloud);
}

#[test]
fn read_through_keeps_the_version_and_the_writers_timestamp() {
    let local = MemoryLayer::new();
    let edge = MemoryLayer::new();
    let cloud = MemoryLayer::new();
    let clock = ManualClock::new(9_000);
    block_on(cloud.put("k", record("v", 7, 4_200))).unwrap();

    let cascade = Cascade::new(&local, &edge, &cloud, &clock);
    block_on(cascade.fetch("k")).unwrap();

    assert_eq!(local.peek("k"), Some(record("v", 7, 4_200)));
}

// ─── Staleness ────────────────────────────────────────────────────────────

#[test]
fn a_record_is_fresh_within_its_ttl_and_stale_past_it() {
    let local = MemoryLayer::new();
    let edge = MemoryLayer::<&str>::new();
    let cloud = MemoryLayer::<&str>::new();
    let clock = ManualClock::new(10_000);
    block_on(local.put("k", record("v", 1, 10_000))).unwrap();
    let cascade = Cascade::new(&local, &edge, &cloud, &clock).with_default_ttl(5_000);

    let fresh = block_on(cascade.fetch("k")).unwrap().unwrap();
    assert!(!fresh.stale, "age 0 is fresh");

    clock.advance(5_000);
    let boundary = block_on(cascade.fetch("k")).unwrap().unwrap();
    assert!(!boundary.stale, "an age equal to the ttl is still fresh");

    clock.advance(1);
    let stale = block_on(cascade.fetch("k")).unwrap().unwrap();
    assert!(stale.stale, "one millisecond past the ttl is stale");
    assert_eq!(stale.fetched_at, 15_001);
    assert_eq!(stale.updated_at, 10_000);
}

#[test]
fn a_per_key_ttl_overrides_the_default() {
    let local = MemoryLayer::new();
    let edge = MemoryLayer::<&str>::new();
    let cloud = MemoryLayer::<&str>::new();
    let clock = ManualClock::new(10_000);
    block_on(local.put("slow", record("v", 1, 10_000))).unwrap();
    block_on(local.put("fast", record("v", 1, 10_000))).unwrap();

    let mut cascade = Cascade::new(&local, &edge, &cloud, &clock).with_default_ttl(1_000);
    cascade.set_ttl("slow", 60_000);
    clock.advance(30_000);

    assert!(!block_on(cascade.fetch("slow")).unwrap().unwrap().stale);
    assert!(block_on(cascade.fetch("fast")).unwrap().unwrap().stale);
}

#[test]
fn a_record_stamped_after_the_clock_is_age_zero_not_negative() {
    let local = MemoryLayer::new();
    let edge = MemoryLayer::<&str>::new();
    let cloud = MemoryLayer::<&str>::new();
    let clock = ManualClock::new(1_000);
    block_on(local.put("k", record("v", 1, 5_000))).unwrap();

    let cascade = Cascade::new(&local, &edge, &cloud, &clock).with_default_ttl(0);
    assert!(!block_on(cascade.fetch("k")).unwrap().unwrap().stale);
}

#[test]
fn a_host_clock_and_a_shared_reference_to_one_clock_both_work() {
    struct HostClock(u64);
    impl Clock for HostClock {
        fn now_ms(&self) -> u64 {
            self.0
        }
    }

    let local = MemoryLayer::new();
    let edge = MemoryLayer::<&str>::new();
    let cloud = MemoryLayer::<&str>::new();
    block_on(local.put("k", record("v", 1, 0))).unwrap();

    let cascade = Cascade::new(&local, &edge, &cloud, HostClock(250));
    assert_eq!(
        block_on(cascade.fetch("k")).unwrap().unwrap().fetched_at,
        250
    );

    let shared = ManualClock::new(77);
    assert_eq!(shared.now_ms(), 77);
    let cascade = Cascade::new(&local, &edge, &cloud, &shared);
    assert_eq!(
        block_on(cascade.fetch("k")).unwrap().unwrap().fetched_at,
        77
    );
}

// ─── Reconciliation ───────────────────────────────────────────────────────

#[test]
fn reconcile_pushes_the_newest_version_to_every_tier_that_is_behind() {
    let local = MemoryLayer::new();
    let edge = MemoryLayer::new();
    let cloud = MemoryLayer::new();
    let clock = ManualClock::new(1_000);
    block_on(local.put("k", record("old", 1, 100))).unwrap();
    block_on(edge.put("k", record("new", 3, 300))).unwrap();

    let cascade = Cascade::new(&local, &edge, &cloud, &clock);
    let report = block_on(cascade.reconcile("k"));

    assert_eq!(report.winner, Some((Source::Edge, 3)));
    assert_eq!(report.written, vec![Source::Local, Source::Cloud]);
    assert!(report.errors.is_empty());
    assert_eq!(local.peek("k"), Some(record("new", 3, 300)));
    assert_eq!(cloud.peek("k"), Some(record("new", 3, 300)));
}

#[test]
fn a_higher_version_beats_a_more_authoritative_tier() {
    let local = MemoryLayer::new();
    let edge = MemoryLayer::new();
    let cloud = MemoryLayer::new();
    let clock = ManualClock::new(1_000);
    block_on(local.put("k", record("device edit", 9, 900))).unwrap();
    block_on(cloud.put("k", record("older origin", 4, 400))).unwrap();

    let cascade = Cascade::new(&local, &edge, &cloud, &clock);
    let report = block_on(cascade.reconcile("k"));

    assert_eq!(
        report.winner,
        Some((Source::Local, 9)),
        "version, not tier, decides"
    );
    assert_eq!(cloud.peek("k"), Some(record("device edit", 9, 900)));
    assert_eq!(
        report.written,
        vec![Source::Edge, Source::Cloud],
        "the empty edge and the behind cloud are written"
    );
}

#[test]
fn a_version_tie_goes_to_the_more_authoritative_tier_deterministically() {
    let local = MemoryLayer::new();
    let edge = MemoryLayer::new();
    let cloud = MemoryLayer::new();
    let clock = ManualClock::new(1_000);
    block_on(local.put("k", record("from device", 5, 100))).unwrap();
    block_on(cloud.put("k", record("from origin", 5, 200))).unwrap();

    let cascade = Cascade::new(&local, &edge, &cloud, &clock);
    let report = block_on(cascade.reconcile("k"));

    assert_eq!(report.winner, Some((Source::Cloud, 5)));
    assert_eq!(local.peek("k"), Some(record("from origin", 5, 200)));
    assert_eq!(report.written, vec![Source::Local, Source::Edge]);
}

#[test]
fn a_tie_between_edge_and_local_goes_to_the_edge() {
    let local = MemoryLayer::new();
    let edge = MemoryLayer::new();
    let cloud = MemoryLayer::new();
    let clock = ManualClock::new(1_000);
    block_on(local.put("k", record("device", 2, 1))).unwrap();
    block_on(edge.put("k", record("edge", 2, 1))).unwrap();

    let cascade = Cascade::new(&local, &edge, &cloud, &clock);
    let report = block_on(cascade.reconcile("k"));

    assert_eq!(report.winner, Some((Source::Edge, 2)));
    assert_eq!(local.peek("k"), Some(record("edge", 2, 1)));
    assert_eq!(cloud.peek("k"), Some(record("edge", 2, 1)));
}

#[test]
fn reconcile_skips_an_unreachable_tier_and_never_writes_it() {
    let local = MemoryLayer::new();
    let edge = MemoryLayer::new();
    let cloud = MemoryLayer::new();
    let clock = ManualClock::new(1_000);
    block_on(local.put("k", record("v", 2, 1))).unwrap();
    cloud.set_available(false);

    let cascade = Cascade::new(&local, &edge, &cloud, &clock);
    let report = block_on(cascade.reconcile("k"));

    assert_eq!(report.winner, Some((Source::Local, 2)));
    assert_eq!(report.written, vec![Source::Edge]);
    assert_eq!(report.errors.len(), 1);
    assert_eq!(report.errors[0].0, Source::Cloud);
    assert_eq!(cloud.peek("k"), None);
}

#[test]
fn reconcile_with_no_record_anywhere_is_a_no_op() {
    let local = Counted::new(MemoryLayer::<&str>::new());
    let edge = Counted::new(MemoryLayer::<&str>::new());
    let cloud = Counted::new(MemoryLayer::<&str>::new());
    let clock = ManualClock::new(1_000);

    let cascade = Cascade::new(&local, &edge, &cloud, &clock);
    let report = block_on(cascade.reconcile("k"));

    assert_eq!(report.winner, None);
    assert!(report.written.is_empty());
    assert_eq!(local.puts.get() + edge.puts.get() + cloud.puts.get(), 0);
}

#[test]
fn reconcile_is_idempotent() {
    let local = Counted::new(MemoryLayer::new());
    let edge = Counted::new(MemoryLayer::new());
    let cloud = Counted::new(MemoryLayer::new());
    let clock = ManualClock::new(1_000);
    block_on(local.put("k", record("v", 1, 1))).unwrap();
    block_on(cloud.put("k", record("w", 2, 2))).unwrap();

    let cascade = Cascade::new(&local, &edge, &cloud, &clock);
    let first = block_on(cascade.reconcile("k"));
    let second = block_on(cascade.reconcile("k"));

    assert_eq!(first.written.len(), 2);
    assert!(second.written.is_empty(), "a converged key writes nothing");
    assert_eq!(second.winner, Some((Source::Cloud, 2)));
}

// ─── Optimistic writes ────────────────────────────────────────────────────

#[test]
fn an_optimistic_write_reaches_every_tier_with_the_next_version() {
    let local = MemoryLayer::new();
    let edge = MemoryLayer::new();
    let cloud = MemoryLayer::new();
    let clock = ManualClock::new(5_000);
    block_on(local.put("k", record("before", 1, 1))).unwrap();

    let cascade = Cascade::new(&local, &edge, &cloud, &clock);
    let written = block_on(cascade.apply_optimistic("k", "after")).unwrap();

    assert_eq!(written, record("after", 2, 5_000));
    assert_eq!(local.peek("k"), Some(record("after", 2, 5_000)));
    assert_eq!(edge.peek("k"), Some(record("after", 2, 5_000)));
    assert_eq!(cloud.peek("k"), Some(record("after", 2, 5_000)));
}

#[test]
fn an_optimistic_version_builds_on_the_newest_version_any_tier_holds() {
    let local = MemoryLayer::new();
    let edge = MemoryLayer::new();
    let cloud = MemoryLayer::new();
    let clock = ManualClock::new(5_000);
    block_on(local.put("k", record("stale local", 1, 1))).unwrap();
    block_on(edge.put("k", record("edge", 5, 2))).unwrap();

    let cascade = Cascade::new(&local, &edge, &cloud, &clock);
    let written = block_on(cascade.apply_optimistic("k", "mine")).unwrap();
    assert_eq!(written.version, 6);

    // The write survives a reconciliation: it is the newest, so nothing overwrites it. All
    // three tiers now hold version 6, so the tie goes to the cloud and nothing is rewritten.
    let report = block_on(cascade.reconcile("k"));
    assert_eq!(report.winner, Some((Source::Cloud, 6)));
    assert!(report.written.is_empty());
    assert_eq!(cloud.peek("k"), Some(record("mine", 6, 5_000)));
}

#[test]
fn an_edge_failure_reverts_local_and_leaves_the_cloud_untouched() {
    let local = MemoryLayer::new();
    let edge = MemoryLayer::new();
    let cloud = MemoryLayer::new();
    let clock = ManualClock::new(5_000);
    block_on(local.put("k", record("before", 1, 1))).unwrap();
    block_on(edge.put("k", record("before", 1, 1))).unwrap();
    block_on(cloud.put("k", record("before", 1, 1))).unwrap();

    let cascade = Cascade::new(&local, &edge, &cloud, &clock);
    edge.set_available(false);
    let err = block_on(cascade.apply_optimistic("k", "after")).unwrap_err();

    assert_eq!(err.layer, Source::Edge);
    assert!(err.reverted);
    assert_eq!(
        local.peek("k"),
        Some(record("before", 1, 1)),
        "local is back to before"
    );
    assert_eq!(cloud.peek("k"), Some(record("before", 1, 1)));
}

#[test]
fn a_cloud_failure_reverts_the_edge_and_the_local_tier() {
    let local = MemoryLayer::new();
    let edge = MemoryLayer::new();
    let cloud = MemoryLayer::new();
    let clock = ManualClock::new(5_000);
    block_on(local.put("k", record("before", 1, 1))).unwrap();
    block_on(edge.put("k", record("before", 1, 1))).unwrap();
    block_on(cloud.put("k", record("before", 1, 1))).unwrap();

    // The cloud's read still answers, so the write is attempted, but its write fails.
    let cloud_writes = WriteBudget {
        inner: &cloud,
        budget: Cell::new(0),
    };
    let cascade = Cascade::new(&local, &edge, &cloud_writes, &clock);
    let err = block_on(cascade.apply_optimistic("k", "after")).unwrap_err();

    assert_eq!(err.layer, Source::Cloud);
    assert!(err.reverted);
    assert_eq!(local.peek("k"), Some(record("before", 1, 1)));
    assert_eq!(edge.peek("k"), Some(record("before", 1, 1)));
}

#[test]
fn a_rollback_with_no_previous_record_removes_the_optimistic_copy() {
    let local = MemoryLayer::new();
    let edge = MemoryLayer::new();
    let cloud = MemoryLayer::new();
    let clock = ManualClock::new(5_000);
    let cloud_writes = WriteBudget {
        inner: &cloud,
        budget: Cell::new(0),
    };

    let cascade = Cascade::new(&local, &edge, &cloud_writes, &clock);
    let err = block_on(cascade.apply_optimistic("new-key", "hello")).unwrap_err();

    assert_eq!(err.layer, Source::Cloud);
    assert!(err.reverted);
    assert_eq!(
        local.peek("new-key"),
        None,
        "no previous record means the key is removed"
    );
    assert_eq!(edge.peek("new-key"), None);
}

#[test]
fn a_local_failure_writes_nothing_to_the_other_tiers() {
    let local = MemoryLayer::<&str>::new();
    let edge = Counted::new(MemoryLayer::new());
    let cloud = Counted::new(MemoryLayer::new());
    let clock = ManualClock::new(5_000);
    let cascade_local = WriteBudget {
        inner: &local,
        budget: Cell::new(0),
    };
    block_on(edge.put("k", record("before", 1, 1))).unwrap();
    edge.puts.set(0);

    let cascade = Cascade::new(&cascade_local, &edge, &cloud, &clock);
    let err = block_on(cascade.apply_optimistic("k", "after")).unwrap_err();

    assert_eq!(err.layer, Source::Local);
    assert!(
        err.reverted,
        "nothing was written, so nothing needed restoring"
    );
    assert_eq!(edge.puts.get() + cloud.puts.get(), 0);
    assert_eq!(edge.inner.peek("k"), Some(record("before", 1, 1)));
}

#[test]
fn an_optimistic_write_with_every_tier_down_is_an_error_and_writes_nothing() {
    let local = MemoryLayer::<&str>::new();
    let edge = MemoryLayer::<&str>::new();
    let cloud = MemoryLayer::<&str>::new();
    let clock = ManualClock::new(5_000);
    local.set_available(false);
    edge.set_available(false);
    cloud.set_available(false);

    let cascade = Cascade::new(&local, &edge, &cloud, &clock);
    let err = block_on(cascade.apply_optimistic("k", "after")).unwrap_err();

    assert_eq!(err.layer, Source::Local);
    assert!(err.reverted);
    assert!(err.cause.message.contains("unavailable"));
}

#[test]
fn reverted_is_false_when_the_rollback_itself_fails() {
    let local = MemoryLayer::new();
    let edge = WriteBudget {
        inner: MemoryLayer::new(),
        budget: Cell::new(1),
    };
    let cloud = MemoryLayer::new();
    let clock = ManualClock::new(5_000);
    block_on(local.put("k", record("before", 1, 1))).unwrap();
    block_on(edge.inner.put("k", record("before", 1, 1))).unwrap();
    cloud.set_available(false);

    let cascade = Cascade::new(&local, &edge, &cloud, &clock);
    let err = block_on(cascade.apply_optimistic("k", "after")).unwrap_err();

    // The edge took the optimistic write (its one allowed write), the cloud failed, and the
    // edge's restore was refused: the edge still holds the optimistic value.
    assert_eq!(err.layer, Source::Cloud);
    assert!(!err.reverted);
    assert_eq!(edge.inner.peek("k"), Some(record("after", 2, 5_000)));
    assert_eq!(local.peek("k"), Some(record("before", 1, 1)));
}

// ─── The layer itself ─────────────────────────────────────────────────────

#[test]
fn memory_layer_round_trips_and_deletes() {
    let layer = MemoryLayer::new();
    assert_eq!(block_on(layer.get("k")).unwrap(), None);
    block_on(layer.put("k", record("v", 1, 1))).unwrap();
    assert_eq!(block_on(layer.get("k")).unwrap(), Some(record("v", 1, 1)));
    block_on(layer.delete("k")).unwrap();
    assert_eq!(block_on(layer.get("k")).unwrap(), None);
    block_on(layer.delete("k")).unwrap();
}

#[test]
fn a_layer_error_names_itself_in_display_and_in_the_cascade_error() {
    let local = MemoryLayer::<&str>::new();
    let edge = MemoryLayer::<&str>::new();
    let cloud = MemoryLayer::<&str>::new();
    let clock = ManualClock::new(0);
    cloud.set_available(false);

    let cascade = Cascade::new(&local, &edge, &cloud, &clock);
    let err = block_on(cascade.fetch("k")).unwrap_err();
    assert_eq!(
        err.to_string(),
        "no tier answered; cloud: memory layer is unavailable"
    );
}
