//! The cascade, reconciliation, tombstones and local-first writes, tested through the public
//! API only.
//!
//! Every tier is a [`Tier`], a test layer whose failures are scripted: it can be down, refuse
//! writes, apply a write and then report failure (the acknowledgement is lost), or run out of
//! write budget. The clock is a [`ManualClock`] or a `Sync` host clock, so every result is
//! deterministic and no future ever waits.

use std::collections::BTreeMap;
use std::future::Future;
use std::pin::pin;
use std::sync::Mutex;
use std::task::{Context, Poll, Waker};

use mzizi_data::{
    Cascade, Clock, Error, Layer, ManualClock, MemoryLayer, OptimisticError, Record, Source,
    WriteOutcome,
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

enum Gate {
    Apply,
    ApplyThenFail,
}

struct State<V> {
    records: BTreeMap<String, Record<V>>,
    available: bool,
    refuse_next: u32,
    apply_then_fail_next: u32,
    writes_left: u64,
    gets: u32,
    puts: u32,
}

/// A scriptable tier. Its state sits behind a `Mutex`, so it is `Sync` and the futures built
/// on it are `Send`.
struct Tier<V> {
    state: Mutex<State<V>>,
}

impl<V> Tier<V> {
    fn new() -> Self {
        Self {
            state: Mutex::new(State {
                records: BTreeMap::new(),
                available: true,
                refuse_next: 0,
                apply_then_fail_next: 0,
                writes_left: u64::MAX,
                gets: 0,
                puts: 0,
            }),
        }
    }

    fn with<R>(&self, f: impl FnOnce(&mut State<V>) -> R) -> R {
        let mut state = self.state.lock().unwrap();
        f(&mut state)
    }

    /// Stores a record without going through the layer, as if an earlier write had landed.
    fn seed(&self, key: &str, record: Record<V>) {
        self.with(|s| {
            s.records.insert(key.to_owned(), record);
        });
    }

    fn peek(&self, key: &str) -> Option<Record<V>>
    where
        V: Clone,
    {
        self.with(|s| s.records.get(key).cloned())
    }

    fn set_available(&self, up: bool) {
        self.with(|s| s.available = up);
    }

    /// The next `n` writes return an error without applying (`u32::MAX`: every write).
    fn refuse_next_writes(&self, n: u32) {
        self.with(|s| s.refuse_next = n);
    }

    /// The next `n` writes apply, then return an error.
    fn apply_then_fail_next_writes(&self, n: u32) {
        self.with(|s| s.apply_then_fail_next = n);
    }

    /// Only `n` more writes succeed; after that every write is refused.
    fn write_budget(&self, n: u64) {
        self.with(|s| s.writes_left = n);
    }

    fn gets(&self) -> u32 {
        self.with(|s| s.gets)
    }

    fn puts(&self) -> u32 {
        self.with(|s| s.puts)
    }

    fn gate(&self) -> Result<Gate, Error> {
        self.with(|s| {
            if !s.available {
                return Err(Error::Io("tier is down".to_owned()));
            }
            if s.refuse_next > 0 {
                s.refuse_next -= 1;
                return Err(Error::Io("write refused".to_owned()));
            }
            if s.writes_left == 0 {
                return Err(Error::Io("write budget spent".to_owned()));
            }
            s.writes_left -= 1;
            if s.apply_then_fail_next > 0 {
                s.apply_then_fail_next -= 1;
                return Ok(Gate::ApplyThenFail);
            }
            Ok(Gate::Apply)
        })
    }
}

impl<V: Clone> Layer<V> for Tier<V> {
    async fn get(&self, key: &str) -> Result<Option<Record<V>>, Error> {
        self.with(|s| {
            s.gets += 1;
            if !s.available {
                return Err(Error::Io("tier is down".to_owned()));
            }
            Ok(s.records.get(key).cloned())
        })
    }

    async fn put(&self, key: &str, record: Record<V>) -> Result<(), Error> {
        self.with(|s| s.puts += 1);
        match self.gate()? {
            Gate::Apply => {
                self.seed(key, record);
                Ok(())
            }
            Gate::ApplyThenFail => {
                self.seed(key, record);
                Err(Error::Io("acknowledgement lost".to_owned()))
            }
        }
    }

    async fn delete(&self, key: &str) -> Result<(), Error> {
        match self.gate()? {
            Gate::Apply => {
                self.with(|s| s.records.remove(key));
                Ok(())
            }
            Gate::ApplyThenFail => {
                self.with(|s| s.records.remove(key));
                Err(Error::Io("acknowledgement lost".to_owned()))
            }
        }
    }
}

/// The edge, except that a concurrent local write lands in the middle of every read. It
/// reproduces a `get` that writes the local tier and then answers with an older record.
struct EdgeWithConcurrentLocalWrite<'a> {
    local: &'a Tier<&'static str>,
    edge: Tier<&'static str>,
}

impl Layer<&'static str> for EdgeWithConcurrentLocalWrite<'_> {
    async fn get(&self, key: &str) -> Result<Option<Record<&'static str>>, Error> {
        self.local.seed(key, Record::live("local-v5", 5, 1_000));
        self.edge.get(key).await
    }

    async fn put(&self, key: &str, record: Record<&'static str>) -> Result<(), Error> {
        self.edge.put(key, record).await
    }

    async fn delete(&self, key: &str) -> Result<(), Error> {
        self.edge.delete(key).await
    }
}

/// A clock that is `Sync`, so the futures built on it can be checked for `Send`.
struct HostClock(u64);

impl Clock for HostClock {
    fn now_ms(&self) -> u64 {
        self.0
    }
}

/// Unwraps a write that the test expects to fail at a tier, and returns the tier and whether
/// the rollback completed.
fn tier_failure(result: Result<WriteOutcome<&'static str>, OptimisticError>) -> (Source, bool) {
    match result {
        Err(OptimisticError::Tier {
            layer, reverted, ..
        }) => (layer, reverted),
        other => panic!("expected a tier failure, got {other:?}"),
    }
}

// ─── Fetch: local first, within the time-to-live ──────────────────────────

#[test]
fn local_hit_answers_without_touching_the_lower_tiers() {
    let local = Tier::<&str>::new();
    let edge = Tier::<&str>::new();
    let cloud = Tier::<&str>::new();
    let clock = ManualClock::new(1_000);
    local.seed("k", Record::live("here", 1, 1_000));

    let cascade = Cascade::new(&local, &edge, &cloud, &clock);
    let found = block_on(cascade.fetch("k")).unwrap().unwrap();

    assert_eq!(found.value, "here");
    assert_eq!(found.source, Source::Local);
    assert!(!found.stale);
    assert_eq!((edge.gets(), cloud.gets()), (0, 0));
}

#[test]
fn a_fresh_local_record_is_not_checked_against_the_edge() {
    let local = Tier::<&str>::new();
    let edge = Tier::<&str>::new();
    let cloud = Tier::<&str>::new();
    let clock = ManualClock::new(1_000);
    local.seed("k", Record::live("local", 1, 1_000));
    edge.seed("k", Record::live("edge", 9, 1_000));

    let cascade = Cascade::new(&local, &edge, &cloud, &clock);
    let found = block_on(cascade.fetch("k")).unwrap().unwrap();

    assert_eq!(
        found.value, "local",
        "within the time-to-live, local answers alone"
    );
    assert_eq!(edge.gets(), 0);
}

#[test]
fn edge_hit_writes_back_to_local_and_leaves_the_cloud_alone() {
    let local = Tier::<&str>::new();
    let edge = Tier::<&str>::new();
    let cloud = Tier::<&str>::new();
    let clock = ManualClock::new(1_000);
    edge.seed("k", Record::live("edge", 2, 1_000));

    let cascade = Cascade::new(&local, &edge, &cloud, &clock);
    let found = block_on(cascade.fetch("k")).unwrap().unwrap();

    assert_eq!(found.source, Source::Edge);
    assert_eq!(found.value, "edge");
    assert_eq!(
        cloud.gets(),
        0,
        "the cloud is not reached on a fresh edge hit"
    );
    assert_eq!(local.peek("k"), Some(Record::live("edge", 2, 1_000)));
}

#[test]
fn cloud_hit_writes_back_to_local_and_edge() {
    let local = Tier::<&str>::new();
    let edge = Tier::<&str>::new();
    let cloud = Tier::<&str>::new();
    let clock = ManualClock::new(1_000);
    cloud.seed("k", Record::live("origin", 4, 1_000));

    let cascade = Cascade::new(&local, &edge, &cloud, &clock);
    let found = block_on(cascade.fetch("k")).unwrap().unwrap();

    assert_eq!(found.source, Source::Cloud);
    assert_eq!(found.version, 4);
    assert_eq!(local.peek("k"), Some(Record::live("origin", 4, 1_000)));
    assert_eq!(edge.peek("k"), Some(Record::live("origin", 4, 1_000)));
}

#[test]
fn cloud_miss_is_an_authoritative_none_and_writes_nothing() {
    let local = Tier::<&str>::new();
    let edge = Tier::<&str>::new();
    let cloud = Tier::<&str>::new();
    let clock = ManualClock::new(1_000);

    let cascade = Cascade::new(&local, &edge, &cloud, &clock);
    assert_eq!(block_on(cascade.fetch("absent")).unwrap(), None);
    assert_eq!(local.puts() + edge.puts() + cloud.puts(), 0);
}

#[test]
fn a_cloud_miss_after_the_upper_tiers_failed_is_still_a_miss() {
    // O5: local and edge could not answer, so their silence proves nothing. The cloud is the
    // origin, and it says there is no record, so the answer is a miss, not an error.
    let local = Tier::<&str>::new();
    let edge = Tier::<&str>::new();
    let cloud = Tier::<&str>::new();
    let clock = ManualClock::new(1_000);
    local.set_available(false);
    edge.set_available(false);

    let cascade = Cascade::new(&local, &edge, &cloud, &clock);
    assert_eq!(block_on(cascade.fetch("absent")).unwrap(), None);
}

#[test]
fn a_failing_local_tier_falls_through_to_edge_and_is_reported_as_skipped() {
    let local = Tier::<&str>::new();
    let edge = Tier::<&str>::new();
    let cloud = Tier::<&str>::new();
    let clock = ManualClock::new(1_000);
    edge.seed("k", Record::live("edge", 2, 1_000));
    local.set_available(false);

    let cascade = Cascade::new(&local, &edge, &cloud, &clock);
    let found = block_on(cascade.fetch("k")).unwrap().unwrap();

    assert_eq!(found.source, Source::Edge);
    assert_eq!(found.skipped.len(), 1);
    assert_eq!(found.skipped[0].0, Source::Local);
    assert_eq!(found.skipped[0].1, Error::Io("tier is down".to_owned()));
}

#[test]
fn a_failing_edge_falls_through_to_cloud_and_writes_back_only_to_local() {
    let local = Tier::<&str>::new();
    let edge = Tier::<&str>::new();
    let cloud = Tier::<&str>::new();
    let clock = ManualClock::new(1_000);
    cloud.seed("k", Record::live("origin", 5, 1_000));
    edge.set_available(false);

    let cascade = Cascade::new(&local, &edge, &cloud, &clock);
    let found = block_on(cascade.fetch("k")).unwrap().unwrap();

    assert_eq!(found.source, Source::Cloud);
    assert_eq!(found.skipped[0].0, Source::Edge);
    assert_eq!(local.peek("k"), Some(Record::live("origin", 5, 1_000)));
    assert_eq!(edge.peek("k"), None, "a tier that failed is not written");
}

#[test]
fn every_tier_failing_is_an_error_not_a_miss() {
    let local = Tier::<&str>::new();
    let edge = Tier::<&str>::new();
    let cloud = Tier::<&str>::new();
    let clock = ManualClock::new(1_000);
    local.set_available(false);
    edge.set_available(false);
    cloud.set_available(false);

    let cascade = Cascade::new(&local, &edge, &cloud, &clock);
    let err = block_on(cascade.fetch("k")).unwrap_err();

    let tiers: Vec<Source> = err.errors.iter().map(|(s, _)| *s).collect();
    assert_eq!(tiers, vec![Source::Local, Source::Edge, Source::Cloud]);
}

#[test]
fn a_cloud_failure_still_answers_from_a_fresh_local_hit() {
    let local = Tier::<&str>::new();
    let edge = Tier::<&str>::new();
    let cloud = Tier::<&str>::new();
    let clock = ManualClock::new(1_000);
    local.seed("k", Record::live("cached", 1, 1_000));
    cloud.set_available(false);

    let cascade = Cascade::new(&local, &edge, &cloud, &clock);
    let found = block_on(cascade.fetch("k")).unwrap().unwrap();

    assert_eq!(found.source, Source::Local);
    assert!(found.skipped.is_empty());
}

#[test]
fn a_cloud_failure_with_nothing_local_is_an_error_even_if_edge_missed() {
    let local = Tier::<&str>::new();
    let edge = Tier::<&str>::new();
    let cloud = Tier::<&str>::new();
    let clock = ManualClock::new(1_000);
    cloud.set_available(false);

    let cascade = Cascade::new(&local, &edge, &cloud, &clock);
    // Local and edge answered "no record", but the cloud could not say, so the read is unknown.
    let err = block_on(cascade.fetch("k")).unwrap_err();
    assert_eq!(err.errors.len(), 1);
    assert_eq!(err.errors[0].0, Source::Cloud);
}

#[test]
fn read_through_keeps_the_version_and_the_writers_timestamp() {
    let local = Tier::<&str>::new();
    let edge = Tier::<&str>::new();
    let cloud = Tier::<&str>::new();
    let clock = ManualClock::new(9_000);
    cloud.seed("k", Record::live("v", 7, 4_200));

    let cascade = Cascade::new(&local, &edge, &cloud, &clock);
    block_on(cascade.fetch("k")).unwrap();

    assert_eq!(local.peek("k"), Some(Record::live("v", 7, 4_200)));
}

#[test]
fn a_cloud_error_names_the_failed_tier_in_its_display() {
    let local = Tier::<&str>::new();
    let edge = Tier::<&str>::new();
    let cloud = Tier::<&str>::new();
    let clock = ManualClock::new(0);
    cloud.set_available(false);

    let cascade = Cascade::new(&local, &edge, &cloud, &clock);
    let err = block_on(cascade.fetch("k")).unwrap_err();
    assert_eq!(
        err.to_string(),
        "no tier answered; cloud: socket: tier is down"
    );
}

// ─── Fetch: a stale local record refreshes (B1) ───────────────────────────

#[test]
fn a_stale_local_record_consults_the_edge_and_takes_its_newer_fresh_record() {
    let local = Tier::<&str>::new();
    let edge = Tier::<&str>::new();
    let cloud = Tier::<&str>::new();
    let clock = ManualClock::new(31_001);
    local.seed("k", Record::live("old", 1, 1_000));
    edge.seed("k", Record::live("new", 2, 31_001));

    let cascade = Cascade::new(&local, &edge, &cloud, &clock);
    let found = block_on(cascade.fetch("k")).unwrap().unwrap();

    assert_eq!(found.value, "new");
    assert_eq!(found.source, Source::Edge);
    assert!(!found.stale);
    assert_eq!(
        edge.gets(),
        1,
        "the stale local record sends the read to the edge"
    );
    assert_eq!(cloud.gets(), 0, "a fresh, newer edge record is enough");
    assert_eq!(
        local.peek("k"),
        Some(Record::live("new", 2, 31_001)),
        "written back"
    );
}

#[test]
fn a_stale_local_record_with_a_failing_edge_refreshes_from_the_cloud() {
    let local = Tier::<&str>::new();
    let edge = Tier::<&str>::new();
    let cloud = Tier::<&str>::new();
    let clock = ManualClock::new(31_001);
    local.seed("k", Record::live("old", 1, 1_000));
    edge.set_available(false);
    cloud.seed("k", Record::live("origin", 3, 31_001));

    let cascade = Cascade::new(&local, &edge, &cloud, &clock);
    let found = block_on(cascade.fetch("k")).unwrap().unwrap();

    assert_eq!(found.source, Source::Cloud);
    assert_eq!(found.value, "origin");
    assert!(!found.stale);
    assert_eq!(found.skipped[0].0, Source::Edge);
    assert_eq!(local.peek("k"), Some(Record::live("origin", 3, 31_001)));
}

#[test]
fn a_stale_local_record_with_every_lower_tier_failing_is_returned_stale_with_the_failures() {
    let local = Tier::<&str>::new();
    let edge = Tier::<&str>::new();
    let cloud = Tier::<&str>::new();
    let clock = ManualClock::new(31_001);
    local.seed("k", Record::live("old", 1, 1_000));
    edge.set_available(false);
    cloud.set_available(false);

    let cascade = Cascade::new(&local, &edge, &cloud, &clock);
    let found = block_on(cascade.fetch("k")).unwrap().unwrap();

    assert_eq!(found.value, "old");
    assert_eq!(found.source, Source::Local);
    assert!(found.stale);
    let tiers: Vec<Source> = found.skipped.iter().map(|(s, _)| *s).collect();
    assert_eq!(tiers, vec![Source::Edge, Source::Cloud]);
}

#[test]
fn a_stale_local_record_is_kept_when_the_lower_tiers_hold_only_older_records() {
    let local = Tier::<&str>::new();
    let edge = Tier::<&str>::new();
    let cloud = Tier::<&str>::new();
    let clock = ManualClock::new(31_001);
    local.seed("k", Record::live("local", 2, 1_000));
    edge.seed("k", Record::live("edge-old", 1, 31_001));

    let cascade = Cascade::new(&local, &edge, &cloud, &clock);
    let found = block_on(cascade.fetch("k")).unwrap().unwrap();

    assert_eq!(found.value, "local");
    assert_eq!(found.source, Source::Local);
    assert!(found.stale);
    assert_eq!(
        edge.peek("k"),
        Some(Record::live("edge-old", 1, 31_001)),
        "no write to a slower tier"
    );
}

#[test]
fn a_stale_local_record_is_superseded_by_a_cloud_tombstone_and_reads_as_none() {
    let local = Tier::<&str>::new();
    let edge = Tier::<&str>::new();
    let cloud = Tier::<&str>::new();
    let clock = ManualClock::new(31_001);
    local.seed("k", Record::live("old", 1, 1_000));
    cloud.seed("k", Record::tombstone(3, 31_001));

    let cascade = Cascade::new(&local, &edge, &cloud, &clock);
    assert_eq!(block_on(cascade.fetch("k")).unwrap(), None);
    assert_eq!(local.peek("k"), Some(Record::tombstone(3, 31_001)));
    assert_eq!(edge.peek("k"), Some(Record::tombstone(3, 31_001)));
}

// ─── Staleness and time (O1) ──────────────────────────────────────────────

#[test]
fn a_record_is_fresh_within_its_ttl_and_stale_past_it() {
    let local = Tier::<&str>::new();
    let edge = Tier::<&str>::new();
    let cloud = Tier::<&str>::new();
    let clock = ManualClock::new(10_000);
    local.seed("k", Record::live("v", 1, 10_000));
    let cascade = Cascade::new(&local, &edge, &cloud, &clock).with_default_ttl(5_000);

    assert!(
        !block_on(cascade.fetch("k")).unwrap().unwrap().stale,
        "age 0 is fresh"
    );

    clock.advance(5_000);
    assert!(
        !block_on(cascade.fetch("k")).unwrap().unwrap().stale,
        "an age equal to the ttl is still fresh"
    );

    clock.advance(1);
    let stale = block_on(cascade.fetch("k")).unwrap().unwrap();
    assert!(stale.stale, "one millisecond past the ttl is stale");
    assert_eq!(stale.fetched_at, 15_001);
    assert_eq!(stale.updated_at, 10_000);
}

#[test]
fn a_per_key_ttl_overrides_the_default() {
    let local = Tier::<&str>::new();
    let edge = Tier::<&str>::new();
    let cloud = Tier::<&str>::new();
    let clock = ManualClock::new(10_000);
    local.seed("slow", Record::live("v", 1, 10_000));
    local.seed("fast", Record::live("v", 1, 10_000));

    let mut cascade = Cascade::new(&local, &edge, &cloud, &clock).with_default_ttl(1_000);
    cascade.set_ttl("slow", 60_000);
    clock.advance(30_000);

    assert!(!block_on(cascade.fetch("slow")).unwrap().unwrap().stale);
    assert!(block_on(cascade.fetch("fast")).unwrap().unwrap().stale);
}

#[test]
fn a_record_stamped_after_the_clock_is_reported_stale() {
    // O1: a future-stamped record cannot be aged, so it is flagged stale rather than fresh.
    let local = Tier::<&str>::new();
    let edge = Tier::<&str>::new();
    let cloud = Tier::<&str>::new();
    let clock = ManualClock::new(1_000);
    local.seed("k", Record::live("v", 1, 5_000));

    let cascade = Cascade::new(&local, &edge, &cloud, &clock);
    let found = block_on(cascade.fetch("k")).unwrap().unwrap();
    assert!(found.stale);
    assert_eq!(found.source, Source::Local);
}

#[test]
fn a_host_clock_and_a_shared_reference_to_one_clock_both_work() {
    let local = Tier::<&str>::new();
    let edge = Tier::<&str>::new();
    let cloud = Tier::<&str>::new();
    local.seed("k", Record::live("v", 1, 0));

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

// ─── Write-back never overwrites a newer record (B3) and reports failures (O2) ─

#[test]
fn write_back_never_replaces_a_newer_record_with_an_older_one() {
    // The repro from the review: a `get` writes local v5 mid-fetch, then returns edge v2.
    let local = Tier::<&str>::new();
    let cloud = Tier::<&str>::new();
    let edge = EdgeWithConcurrentLocalWrite {
        local: &local,
        edge: Tier::<&str>::new(),
    };
    let clock = ManualClock::new(1_000);
    edge.edge.seed("k", Record::live("edge-v2", 2, 1_000));

    let cascade = Cascade::new(&local, &edge, &cloud, &clock);
    let found = block_on(cascade.fetch("k")).unwrap().unwrap();

    assert_eq!(found.source, Source::Edge);
    assert_eq!(found.version, 2);
    assert_eq!(
        local.peek("k"),
        Some(Record::live("local-v5", 5, 1_000)),
        "local ends at v5"
    );
}

#[test]
fn write_back_errors_are_reported_in_skipped_and_never_dropped() {
    let local = Tier::<&str>::new();
    let edge = Tier::<&str>::new();
    let cloud = Tier::<&str>::new();
    let clock = ManualClock::new(1_000);
    edge.seed("k", Record::live("edge", 2, 1_000));
    local.refuse_next_writes(u32::MAX);

    let cascade = Cascade::new(&local, &edge, &cloud, &clock);
    let found = block_on(cascade.fetch("k")).unwrap().unwrap();

    assert_eq!(found.value, "edge", "the read still succeeds");
    assert_eq!(found.skipped.len(), 1);
    assert_eq!(found.skipped[0].0, Source::Local);
    assert_eq!(found.skipped[0].1, Error::Io("write refused".to_owned()));
    assert_eq!(local.peek("k"), None);
}

// ─── Reconciliation ───────────────────────────────────────────────────────

#[test]
fn reconcile_pushes_the_newest_version_to_every_tier_that_is_behind() {
    let local = Tier::<&str>::new();
    let edge = Tier::<&str>::new();
    let cloud = Tier::<&str>::new();
    let clock = ManualClock::new(1_000);
    local.seed("k", Record::live("old", 1, 100));
    edge.seed("k", Record::live("new", 3, 300));

    let cascade = Cascade::new(&local, &edge, &cloud, &clock);
    let report = block_on(cascade.reconcile("k"));

    assert_eq!(report.winner, Some((Source::Edge, 3)));
    assert_eq!(report.written, vec![Source::Local, Source::Cloud]);
    assert!(report.errors.is_empty());
    assert_eq!(local.peek("k"), Some(Record::live("new", 3, 300)));
    assert_eq!(cloud.peek("k"), Some(Record::live("new", 3, 300)));
}

#[test]
fn a_higher_version_beats_a_more_authoritative_tier() {
    let local = Tier::<&str>::new();
    let edge = Tier::<&str>::new();
    let cloud = Tier::<&str>::new();
    let clock = ManualClock::new(1_000);
    local.seed("k", Record::live("device edit", 9, 900));
    cloud.seed("k", Record::live("older origin", 4, 400));

    let cascade = Cascade::new(&local, &edge, &cloud, &clock);
    let report = block_on(cascade.reconcile("k"));

    assert_eq!(
        report.winner,
        Some((Source::Local, 9)),
        "version decides, not the tier"
    );
    assert_eq!(cloud.peek("k"), Some(Record::live("device edit", 9, 900)));
    assert_eq!(report.written, vec![Source::Edge, Source::Cloud]);
}

#[test]
fn a_version_tie_goes_to_the_more_authoritative_tier_deterministically() {
    let local = Tier::<&str>::new();
    let edge = Tier::<&str>::new();
    let cloud = Tier::<&str>::new();
    let clock = ManualClock::new(1_000);
    local.seed("k", Record::live("from device", 5, 100));
    cloud.seed("k", Record::live("from origin", 5, 200));

    let cascade = Cascade::new(&local, &edge, &cloud, &clock);
    let report = block_on(cascade.reconcile("k"));

    assert_eq!(report.winner, Some((Source::Cloud, 5)));
    assert_eq!(local.peek("k"), Some(Record::live("from origin", 5, 200)));
    assert_eq!(report.written, vec![Source::Local, Source::Edge]);
}

#[test]
fn a_tie_between_edge_and_local_goes_to_the_edge() {
    let local = Tier::<&str>::new();
    let edge = Tier::<&str>::new();
    let cloud = Tier::<&str>::new();
    let clock = ManualClock::new(1_000);
    local.seed("k", Record::live("device", 2, 1));
    edge.seed("k", Record::live("edge", 2, 1));

    let cascade = Cascade::new(&local, &edge, &cloud, &clock);
    let report = block_on(cascade.reconcile("k"));

    assert_eq!(report.winner, Some((Source::Edge, 2)));
    assert_eq!(local.peek("k"), Some(Record::live("edge", 2, 1)));
    assert_eq!(cloud.peek("k"), Some(Record::live("edge", 2, 1)));
}

#[test]
fn reconcile_skips_an_unreachable_tier_and_never_writes_it() {
    let local = Tier::<&str>::new();
    let edge = Tier::<&str>::new();
    let cloud = Tier::<&str>::new();
    let clock = ManualClock::new(1_000);
    local.seed("k", Record::live("v", 2, 1));
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
    let local = Tier::<&str>::new();
    let edge = Tier::<&str>::new();
    let cloud = Tier::<&str>::new();
    let clock = ManualClock::new(1_000);

    let cascade = Cascade::new(&local, &edge, &cloud, &clock);
    let report = block_on(cascade.reconcile("k"));

    assert_eq!(report.winner, None);
    assert!(report.written.is_empty());
    assert_eq!(local.puts() + edge.puts() + cloud.puts(), 0);
}

#[test]
fn reconcile_is_idempotent() {
    let local = Tier::<&str>::new();
    let edge = Tier::<&str>::new();
    let cloud = Tier::<&str>::new();
    let clock = ManualClock::new(1_000);
    local.seed("k", Record::live("v", 1, 1));
    cloud.seed("k", Record::live("w", 2, 2));

    let cascade = Cascade::new(&local, &edge, &cloud, &clock);
    let first = block_on(cascade.reconcile("k"));
    let second = block_on(cascade.reconcile("k"));

    assert_eq!(first.written, vec![Source::Local, Source::Edge]);
    assert!(second.written.is_empty(), "a converged key writes nothing");
    assert_eq!(second.winner, Some((Source::Cloud, 2)));
}

#[test]
fn a_tier_is_in_sync_only_when_the_whole_record_matches_including_updated_at() {
    // O4: the same version and value, but a different updated_at, is not in sync.
    let local = Tier::<&str>::new();
    let edge = Tier::<&str>::new();
    let cloud = Tier::<&str>::new();
    let clock = ManualClock::new(1_000);
    local.seed("k", Record::live("x", 5, 100));
    cloud.seed("k", Record::live("x", 5, 200));

    let cascade = Cascade::new(&local, &edge, &cloud, &clock);
    let report = block_on(cascade.reconcile("k"));

    assert_eq!(report.winner, Some((Source::Cloud, 5)));
    assert!(
        report.written.contains(&Source::Local),
        "local differs only in updated_at"
    );
    assert_eq!(local.peek("k"), Some(Record::live("x", 5, 200)));
}

// ─── Tombstones (B4) ──────────────────────────────────────────────────────

#[test]
fn a_newer_tombstone_wins_and_propagates_and_an_older_live_copy_cannot_resurrect_it() {
    let local = Tier::<&str>::new();
    let edge = Tier::<&str>::new();
    let cloud = Tier::<&str>::new();
    let clock = ManualClock::new(300);
    local.seed("k", Record::tombstone(3, 300));
    edge.seed("k", Record::live("old", 2, 200));

    let cascade = Cascade::new(&local, &edge, &cloud, &clock);
    let report = block_on(cascade.reconcile("k"));

    assert_eq!(report.winner, Some((Source::Local, 3)));
    assert_eq!(edge.peek("k"), Some(Record::tombstone(3, 300)));
    assert_eq!(cloud.peek("k"), Some(Record::tombstone(3, 300)));
    assert_eq!(
        block_on(cascade.fetch("k")).unwrap(),
        None,
        "a tombstone reads as none"
    );
}

#[test]
fn delete_writes_a_tombstone_through_every_tier_and_fetch_returns_none() {
    let local = Tier::<&str>::new();
    let edge = Tier::<&str>::new();
    let cloud = Tier::<&str>::new();
    let clock = ManualClock::new(1_000);
    for tier in [&local, &edge, &cloud] {
        tier.seed("k", Record::live("a", 1, 1_000));
    }

    let cascade = Cascade::new(&local, &edge, &cloud, &clock);
    let outcome = block_on(cascade.delete("k")).unwrap();

    assert!(outcome.record.is_tombstone());
    assert_eq!(outcome.record.version, 2);
    assert!(outcome.unconfirmed.is_empty());
    assert_eq!(local.peek("k"), Some(Record::tombstone(2, 1_000)));
    assert_eq!(edge.peek("k"), Some(Record::tombstone(2, 1_000)));
    assert_eq!(cloud.peek("k"), Some(Record::tombstone(2, 1_000)));
    assert_eq!(block_on(cascade.fetch("k")).unwrap(), None);
}

#[test]
fn a_refused_delete_is_rolled_back_like_a_refused_write() {
    let local = Tier::<&str>::new();
    let edge = Tier::<&str>::new();
    let cloud = Tier::<&str>::new();
    let clock = ManualClock::new(1_000);
    for tier in [&local, &edge, &cloud] {
        tier.seed("k", Record::live("a", 1, 1_000));
    }
    cloud.refuse_next_writes(1);

    let cascade = Cascade::new(&local, &edge, &cloud, &clock);
    let result = block_on(cascade.delete("k"));

    assert_eq!(tier_failure(result), (Source::Cloud, true));
    assert_eq!(local.peek("k"), Some(Record::live("a", 1, 1_000)));
    assert_eq!(edge.peek("k"), Some(Record::live("a", 1, 1_000)));
    assert_eq!(cloud.peek("k"), Some(Record::live("a", 1, 1_000)));
}

// ─── Local-first writes: rollback (B5, B6) ────────────────────────────────

#[test]
fn optimistic_write_reaches_every_tier_confirmed_with_the_next_version() {
    let local = Tier::<&str>::new();
    let edge = Tier::<&str>::new();
    let cloud = Tier::<&str>::new();
    let clock = ManualClock::new(5_000);
    local.seed("k", Record::live("before", 1, 1));

    let cascade = Cascade::new(&local, &edge, &cloud, &clock);
    let outcome = block_on(cascade.apply_optimistic("k", "after")).unwrap();

    assert_eq!(outcome.record, Record::live("after", 2, 5_000));
    assert!(outcome.unconfirmed.is_empty());
    assert_eq!(local.peek("k"), Some(Record::live("after", 2, 5_000)));
    assert_eq!(edge.peek("k"), Some(Record::live("after", 2, 5_000)));
    assert_eq!(cloud.peek("k"), Some(Record::live("after", 2, 5_000)));
}

#[test]
fn an_optimistic_version_builds_on_the_newest_version_any_tier_holds_and_survives_reconcile() {
    let local = Tier::<&str>::new();
    let edge = Tier::<&str>::new();
    let cloud = Tier::<&str>::new();
    let clock = ManualClock::new(5_000);
    local.seed("k", Record::live("stale local", 1, 1));
    edge.seed("k", Record::live("edge", 5, 2));

    let cascade = Cascade::new(&local, &edge, &cloud, &clock);
    let outcome = block_on(cascade.apply_optimistic("k", "mine")).unwrap();
    assert_eq!(outcome.record.version, 6);

    let report = block_on(cascade.reconcile("k"));
    assert_eq!(report.winner, Some((Source::Cloud, 6)));
    assert!(
        report.written.is_empty(),
        "every tier already holds the write"
    );
    assert_eq!(cloud.peek("k"), Some(Record::live("mine", 6, 5_000)));
}

#[test]
fn an_unreadable_edge_is_reported_as_an_incomplete_rollback() {
    // The edge is down, so its previous record is unknown and cannot be restored: the
    // rollback is reported as incomplete, and local is restored.
    let local = Tier::<&str>::new();
    let edge = Tier::<&str>::new();
    let cloud = Tier::<&str>::new();
    let clock = ManualClock::new(5_000);
    for tier in [&local, &edge, &cloud] {
        tier.seed("k", Record::live("before", 1, 1));
    }
    edge.set_available(false);

    let cascade = Cascade::new(&local, &edge, &cloud, &clock);
    let result = block_on(cascade.apply_optimistic("k", "after"));

    assert_eq!(tier_failure(result), (Source::Edge, false));
    assert_eq!(local.peek("k"), Some(Record::live("before", 1, 1)));
    assert_eq!(cloud.peek("k"), Some(Record::live("before", 1, 1)));
}

#[test]
fn a_cloud_refusal_restores_edge_and_local_to_their_records() {
    let local = Tier::<&str>::new();
    let edge = Tier::<&str>::new();
    let cloud = Tier::<&str>::new();
    let clock = ManualClock::new(5_000);
    for tier in [&local, &edge, &cloud] {
        tier.seed("k", Record::live("before", 1, 1));
    }
    cloud.refuse_next_writes(1);

    let cascade = Cascade::new(&local, &edge, &cloud, &clock);
    let result = block_on(cascade.apply_optimistic("k", "after"));

    assert_eq!(tier_failure(result), (Source::Cloud, true));
    assert_eq!(local.peek("k"), Some(Record::live("before", 1, 1)));
    assert_eq!(edge.peek("k"), Some(Record::live("before", 1, 1)));
}

#[test]
fn a_rollback_with_no_previous_record_removes_the_copy_from_every_tier() {
    let local = Tier::<&str>::new();
    let edge = Tier::<&str>::new();
    let cloud = Tier::<&str>::new();
    let clock = ManualClock::new(5_000);
    cloud.refuse_next_writes(1);

    let cascade = Cascade::new(&local, &edge, &cloud, &clock);
    let result = block_on(cascade.apply_optimistic("new-key", "hello"));

    assert_eq!(tier_failure(result), (Source::Cloud, true));
    assert_eq!(
        local.peek("new-key"),
        None,
        "no previous record means the copy is removed"
    );
    assert_eq!(edge.peek("new-key"), None);
}

#[test]
fn b5_rollback_restores_each_tier_to_its_own_record() {
    // The review's repro: local a v1, edge empty, cloud b v2; apply c with the cloud put
    // refused. Local returns to a v1 and edge to empty.
    let local = Tier::<&str>::new();
    let edge = Tier::<&str>::new();
    let cloud = Tier::<&str>::new();
    let clock = ManualClock::new(5_000);
    local.seed("k", Record::live("a", 1, 1_000));
    cloud.seed("k", Record::live("b", 2, 1_000));
    cloud.refuse_next_writes(1);

    let cascade = Cascade::new(&local, &edge, &cloud, &clock);
    let result = block_on(cascade.apply_optimistic("k", "c"));

    assert_eq!(tier_failure(result), (Source::Cloud, true));
    assert_eq!(
        local.peek("k"),
        Some(Record::live("a", 1, 1_000)),
        "local is back to a v1"
    );
    assert_eq!(edge.peek("k"), None, "edge is back to empty");
    assert_eq!(cloud.peek("k"), Some(Record::live("b", 2, 1_000)));
}

#[test]
fn b6_a_put_that_errors_after_applying_is_still_restored() {
    // The acknowledgement is lost: the cloud applied c, then reported an error. The cloud was
    // attempted, so it is restored too.
    let local = Tier::<&str>::new();
    let edge = Tier::<&str>::new();
    let cloud = Tier::<&str>::new();
    let clock = ManualClock::new(5_000);
    local.seed("k", Record::live("a", 1, 1_000));
    cloud.seed("k", Record::live("b", 2, 1_000));
    cloud.apply_then_fail_next_writes(1);

    let cascade = Cascade::new(&local, &edge, &cloud, &clock);
    let result = block_on(cascade.apply_optimistic("k", "c"));

    assert_eq!(tier_failure(result), (Source::Cloud, true));
    assert_eq!(
        cloud.peek("k"),
        Some(Record::live("b", 2, 1_000)),
        "the lost write is undone"
    );
    assert_eq!(local.peek("k"), Some(Record::live("a", 1, 1_000)));
    assert_eq!(edge.peek("k"), None);
}

#[test]
fn a_failed_restore_reports_reverted_false() {
    let local = Tier::<&str>::new();
    let edge = Tier::<&str>::new();
    let cloud = Tier::<&str>::new();
    let clock = ManualClock::new(5_000);
    for tier in [&local, &edge, &cloud] {
        tier.seed("k", Record::live("a", 1, 1_000));
    }
    cloud.refuse_next_writes(u32::MAX);

    let cascade = Cascade::new(&local, &edge, &cloud, &clock);
    let result = block_on(cascade.apply_optimistic("k", "b"));

    assert_eq!(tier_failure(result), (Source::Cloud, false));
    assert_eq!(local.peek("k"), Some(Record::live("a", 1, 1_000)));
    assert_eq!(edge.peek("k"), Some(Record::live("a", 1, 1_000)));
}

#[test]
fn an_optimistic_write_with_every_tier_down_is_an_error_and_writes_nothing() {
    let local = Tier::<&str>::new();
    let edge = Tier::<&str>::new();
    let cloud = Tier::<&str>::new();
    let clock = ManualClock::new(5_000);
    local.set_available(false);
    edge.set_available(false);
    cloud.set_available(false);

    let cascade = Cascade::new(&local, &edge, &cloud, &clock);
    let result = block_on(cascade.apply_optimistic("k", "after"));

    assert_eq!(tier_failure(result), (Source::Local, true));
    assert_eq!(local.puts() + edge.puts() + cloud.puts(), 0);
}

#[test]
fn a_version_at_the_top_of_the_range_is_an_error_not_a_wrap() {
    // O3: the next version cannot be represented, so nothing is written.
    let local = Tier::<&str>::new();
    let edge = Tier::<&str>::new();
    let cloud = Tier::<&str>::new();
    let clock = ManualClock::new(5_000);
    local.seed("k", Record::live("max", u64::MAX, 1));

    let cascade = Cascade::new(&local, &edge, &cloud, &clock);
    let result = block_on(cascade.apply_optimistic("k", "next"));

    assert_eq!(result.unwrap_err(), OptimisticError::VersionOverflow);
    assert_eq!(local.puts() + edge.puts() + cloud.puts(), 0);
    assert_eq!(
        block_on(cascade.delete("k")).unwrap_err(),
        OptimisticError::VersionOverflow
    );
}

// ─── Pending writes and reconciliation (B7) ───────────────────────────────

#[test]
fn a_rejected_pending_write_never_wins_after_recovery() {
    // The review's B7 repro: local's put succeeds once and then fails (including the restore),
    // edge is down, cloud is a v1. After recovery, reconcile keeps cloud at a.
    let local = Tier::<&str>::new();
    let edge = Tier::<&str>::new();
    let cloud = Tier::<&str>::new();
    let clock = ManualClock::new(5_000);
    cloud.seed("k", Record::live("a", 1, 1_000));
    local.write_budget(1);
    edge.set_available(false);

    let cascade = Cascade::new(&local, &edge, &cloud, &clock);
    let result = block_on(cascade.apply_optimistic("k", "b"));
    assert_eq!(
        tier_failure(result),
        (Source::Edge, false),
        "the rollback is incomplete"
    );

    // Local was left holding the rejected write, pending.
    assert_eq!(
        local.peek("k"),
        Some(Record::from_parts(Some("b"), 2, 5_000, true))
    );

    edge.set_available(true);
    local.write_budget(u64::MAX);

    let cascade = Cascade::new(&local, &edge, &cloud, &clock);
    let report = block_on(cascade.reconcile("k"));
    assert_eq!(
        report.winner,
        Some((Source::Cloud, 1)),
        "the confirmed a beats the pending b"
    );
    assert_eq!(cloud.peek("k"), Some(Record::live("a", 1, 1_000)));
    assert_eq!(local.peek("k"), Some(Record::live("a", 1, 1_000)));
}

#[test]
fn a_pending_record_with_no_confirmed_rival_is_propagated_then_confirmed() {
    let local = Tier::<&str>::new();
    let edge = Tier::<&str>::new();
    let cloud = Tier::<&str>::new();
    let clock = ManualClock::new(5_000);
    local.seed("k", Record::from_parts(Some("b"), 2, 1_000, true));

    let cascade = Cascade::new(&local, &edge, &cloud, &clock);
    let report = block_on(cascade.reconcile("k"));

    assert_eq!(report.winner, Some((Source::Local, 2)));
    assert!(report.errors.is_empty());
    for tier in [&local, &edge, &cloud] {
        assert_eq!(
            tier.peek("k"),
            Some(Record::live("b", 2, 1_000)),
            "confirmed everywhere"
        );
    }
}

#[test]
fn a_confirmation_that_fails_is_reported_and_a_later_reconcile_confirms_it() {
    let local = Tier::<&str>::new();
    let edge = Tier::<&str>::new();
    let cloud = Tier::<&str>::new();
    let clock = ManualClock::new(5_000);
    // The cloud accepts the pending copy (one write) and refuses the confirmation.
    cloud.write_budget(1);

    let cascade = Cascade::new(&local, &edge, &cloud, &clock);
    let outcome = block_on(cascade.apply_optimistic("k", "c")).unwrap();

    assert_eq!(outcome.record, Record::live("c", 1, 5_000));
    assert_eq!(outcome.unconfirmed.len(), 1);
    assert_eq!(outcome.unconfirmed[0].0, Source::Cloud);
    assert_eq!(
        cloud.peek("k"),
        Some(Record::from_parts(Some("c"), 1, 5_000, true))
    );

    cloud.write_budget(u64::MAX);
    let cascade = Cascade::new(&local, &edge, &cloud, &clock);
    let report = block_on(cascade.reconcile("k"));
    assert!(report.written.contains(&Source::Cloud));
    assert_eq!(
        cloud.peek("k"),
        Some(Record::live("c", 1, 5_000)),
        "the pending copy is confirmed"
    );
}

// ─── Layer and Send ───────────────────────────────────────────────────────

#[test]
fn the_cascades_futures_are_send_when_the_adapters_and_clock_are_send() {
    fn assert_send<T: Send>(_: &T) {}

    let local = Tier::<&str>::new();
    let edge = Tier::<&str>::new();
    let cloud = Tier::<&str>::new();
    let clock = HostClock(1_000);
    let cascade = Cascade::new(&local, &edge, &cloud, &clock);

    let fetch = cascade.fetch("k");
    assert_send(&fetch);
    let write = cascade.apply_optimistic("k", "v");
    assert_send(&write);
    let delete = cascade.delete("k");
    assert_send(&delete);
    let sync = cascade.reconcile("k");
    assert_send(&sync);
}

#[test]
fn memory_layer_round_trips_and_deletes() {
    let layer = MemoryLayer::<&str>::new();
    assert_eq!(block_on(layer.get("k")).unwrap(), None);
    block_on(layer.put("k", Record::live("v", 1, 1))).unwrap();
    assert_eq!(
        block_on(layer.get("k")).unwrap(),
        Some(Record::live("v", 1, 1))
    );
    block_on(layer.delete("k")).unwrap();
    assert_eq!(block_on(layer.get("k")).unwrap(), None);
    block_on(layer.delete("k")).unwrap();
}
