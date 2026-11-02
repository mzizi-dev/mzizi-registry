//! The write path: the read cascade, the outbox, the lifecycle, and the status polling.
//!
//! The server is a fake that dedupes by request id and applies queued mutations in order when
//! the test processes them. Its losses and outages are scripted.

use std::cell::{Cell, RefCell};
use std::collections::{HashMap, VecDeque};
use std::future::Future;
use std::marker::PhantomData;
use std::pin::pin;
use std::rc::Rc;
use std::task::{Context, Poll, Waker};

use mzizi_data::{
    Clock, Config, EntryState, Error, FIRST_POLL_MS, FailReason, Layer, ManualClock, MemoryOutbox,
    Mutation, MutationStatus, MziziData, Outbox, Patch, ReadError, Record, RequestId,
    SETTLE_TIMEOUT_MS, SeededRandom, Source, StatusReply, Submitted, Transport, UtcTime,
};

#[derive(Debug, Clone, PartialEq)]
struct Note {
    text: String,
}

impl Note {
    fn new(text: &str) -> Self {
        Self {
            text: text.to_owned(),
        }
    }
}

impl Patch for Note {
    fn apply(&mut self, patch: &Self) {
        if !patch.text.is_empty() {
            self.text.clone_from(&patch.text);
        }
    }
}

/// A tier that can be taken down and counts its reads.
#[derive(Default)]
struct Tier {
    records: RefCell<HashMap<String, Record<Note>>>,
    up: Cell<bool>,
    gets: Cell<u32>,
}

impl Tier {
    fn new() -> Self {
        Self {
            records: RefCell::new(HashMap::new()),
            up: Cell::new(true),
            gets: Cell::new(0),
        }
    }

    fn check(&self) -> Result<(), Error> {
        if self.up.get() {
            Ok(())
        } else {
            Err(Error::Io("tier is down".to_owned()))
        }
    }

    fn seed(&self, key: &str, record: Record<Note>) {
        self.records.borrow_mut().insert(key.to_owned(), record);
    }
}

impl Layer<Note> for Tier {
    async fn get(&self, key: &str) -> Result<Option<Record<Note>>, Error> {
        self.gets.set(self.gets.get() + 1);
        self.check()?;
        Ok(self.records.borrow().get(key).cloned())
    }

    async fn put(&self, key: &str, record: Record<Note>) -> Result<(), Error> {
        self.check()?;
        self.records.borrow_mut().insert(key.to_owned(), record);
        Ok(())
    }

    async fn delete(&self, key: &str) -> Result<(), Error> {
        self.check()?;
        self.records.borrow_mut().remove(key);
        Ok(())
    }
}

/// The server: dedupes by request id, applies queued mutations in order on `process`.
struct Server {
    online: Cell<bool>,
    lose_next_response: Cell<bool>,
    clock: Cell<u64>,
    received: RefCell<Vec<RequestId>>,
    queue: RefCell<VecDeque<Mutation<Note>>>,
    replies: RefCell<HashMap<RequestId, StatusReply<Note>>>,
    docs: RefCell<HashMap<String, Record<Note>>>,
    applied: Cell<u32>,
    submits: Cell<u32>,
    status_calls: Cell<u32>,
}

impl Server {
    fn new(now: u64) -> Self {
        Self {
            online: Cell::new(true),
            lose_next_response: Cell::new(false),
            clock: Cell::new(now),
            received: RefCell::new(Vec::new()),
            queue: RefCell::new(VecDeque::new()),
            replies: RefCell::new(HashMap::new()),
            docs: RefCell::new(HashMap::new()),
            applied: Cell::new(0),
            submits: Cell::new(0),
            status_calls: Cell::new(0),
        }
    }

    /// Applies every queued mutation in arrival order.
    fn process(&self) {
        let now = self.clock.get();
        loop {
            let Some(m) = self.queue.borrow_mut().pop_front() else {
                break;
            };
            let key = m.key();
            let current = self.docs.borrow().get(&key).cloned();
            let version = current.as_ref().map_or(0, |r| r.version);
            let stale = matches!(m.op, mzizi_data::Op::Update | mzizi_data::Op::Delete)
                && m.base_version != Some(version);
            if stale {
                self.replies
                    .borrow_mut()
                    .insert(m.request_id, StatusReply::Failed(FailReason::Conflict));
                continue;
            }
            let value = match m.op {
                mzizi_data::Op::Set => m.payload.clone(),
                mzizi_data::Op::Update => {
                    match (current.and_then(|r| r.value), m.payload.clone()) {
                        (Some(mut doc), Some(patch)) => {
                            doc.apply(&patch);
                            Some(doc)
                        }
                        _ => {
                            self.replies
                                .borrow_mut()
                                .insert(m.request_id, StatusReply::Failed(FailReason::Invalid));
                            continue;
                        }
                    }
                }
                mzizi_data::Op::Delete => None,
            };
            let record = match value {
                Some(v) => Record::live(v, version + 1, now),
                None => Record::tombstone(version + 1, now),
            };
            self.docs.borrow_mut().insert(key, record.clone());
            self.replies
                .borrow_mut()
                .insert(m.request_id, StatusReply::Applied(record));
            self.applied.set(self.applied.get() + 1);
        }
    }

    fn doc(&self, collection: &str, id: &str) -> Option<Record<Note>> {
        self.docs
            .borrow()
            .get(&format!("{collection}/{id}"))
            .cloned()
    }
}

impl Transport<Note> for Server {
    async fn submit(&self, m: &Mutation<Note>) -> Result<Submitted, Error> {
        self.submits.set(self.submits.get() + 1);
        if !self.online.get() {
            return Err(Error::Io("offline".to_owned()));
        }
        if m.collection == "forbidden" {
            return Ok(Submitted::Rejected(FailReason::Forbidden));
        }
        if !self.received.borrow().contains(&m.request_id) {
            self.received.borrow_mut().push(m.request_id);
            self.queue.borrow_mut().push_back(m.clone());
        }
        if self.lose_next_response.replace(false) {
            return Err(Error::Io("response lost".to_owned()));
        }
        Ok(Submitted::Accepted)
    }

    async fn status(
        &self,
        ids: &[RequestId],
    ) -> Result<Vec<(RequestId, StatusReply<Note>)>, Error> {
        self.status_calls.set(self.status_calls.get() + 1);
        if !self.online.get() {
            return Err(Error::Io("offline".to_owned()));
        }
        let replies = self.replies.borrow();
        Ok(ids
            .iter()
            .map(|id| {
                (
                    *id,
                    replies.get(id).cloned().unwrap_or(StatusReply::Pending),
                )
            })
            .collect())
    }
}

/// Everything a test needs. A "restart" is a new client over the same world.
struct World {
    local: Tier,
    edge: Tier,
    cloud: Tier,
    server: Server,
    outbox: MemoryOutbox<Note>,
    clock: ManualClock,
    random: SeededRandom,
}

impl World {
    fn new() -> Self {
        Self {
            local: Tier::new(),
            edge: Tier::new(),
            cloud: Tier::new(),
            server: Server::new(1_000_000),
            outbox: MemoryOutbox::new(),
            clock: ManualClock::new(1_000_000),
            random: SeededRandom::new(7),
        }
    }
}

type Client<'a> = MziziData<
    Note,
    &'a Tier,
    &'a Tier,
    &'a Tier,
    &'a Server,
    &'a MemoryOutbox<Note>,
    &'a ManualClock,
    &'a SeededRandom,
>;

fn client(w: &World) -> Client<'_> {
    MziziData::new(Config {
        local: &w.local,
        edge: &w.edge,
        cloud: &w.cloud,
        transport: &w.server,
        outbox: &w.outbox,
        clock: &w.clock,
        random: &w.random,
        value: PhantomData,
    })
}

/// Runs a future to completion. Every in-memory step is ready, so one poll per wait suffices.
fn block_on<F: Future>(future: F) -> F::Output {
    let mut cx = Context::from_waker(Waker::noop());
    let mut future = pin!(future);
    loop {
        if let Poll::Ready(value) = future.as_mut().poll(&mut cx) {
            return value;
        }
    }
}

fn fresh(w: &World, text: &str, version: u64) -> Record<Note> {
    Record::live(Note::new(text), version, w.clock.now_ms())
}

// --- Reads: the cascade steps -----------------------------------------------------------

#[test]
fn a_fresh_local_hit_answers_without_the_edge_or_the_cloud() {
    let w = World::new();
    w.local.seed("notes/a", fresh(&w, "local", 3));
    let got = block_on(client(&w).get("notes", "a")).unwrap();
    assert_eq!(got.data, Some(Note::new("local")));
    assert_eq!(got.source, Source::Local);
    assert_eq!(got.version, 3);
    assert_eq!((w.edge.gets.get(), w.cloud.gets.get()), (0, 0));
}

#[test]
fn an_edge_hit_answers_when_local_has_nothing() {
    let w = World::new();
    w.edge.seed("notes/a", fresh(&w, "edge", 2));
    let got = block_on(client(&w).get("notes", "a")).unwrap();
    assert_eq!(got.data, Some(Note::new("edge")));
    assert_eq!(got.source, Source::Edge);
    assert_eq!(w.cloud.gets.get(), 0);
}

#[test]
fn a_cloud_fallback_answers_when_local_and_edge_have_nothing() {
    let w = World::new();
    w.cloud.seed("notes/a", fresh(&w, "cloud", 5));
    let got = block_on(client(&w).get("notes", "a")).unwrap();
    assert_eq!(got.data, Some(Note::new("cloud")));
    assert_eq!(got.source, Source::Cloud);
    assert_eq!(got.version, 5);
}

#[test]
fn a_read_fails_when_all_three_tiers_fail() {
    let w = World::new();
    w.local.up.set(false);
    w.edge.up.set(false);
    w.cloud.up.set(false);
    match block_on(client(&w).get("notes", "a")) {
        Err(ReadError::Tiers(e)) => assert_eq!(e.errors.len(), 3),
        other => panic!("expected every tier to fail, got {other:?}"),
    }
}

// --- Writes: read-your-own-writes, lifecycle, idempotency, ordering ---------------------

#[test]
fn a_write_is_visible_to_this_client_before_it_is_sent() {
    let w = World::new();
    let c = client(&w);
    block_on(c.set("notes", "a", Note::new("draft"))).unwrap();
    let got = block_on(c.get("notes", "a")).unwrap();
    assert_eq!(got.data, Some(Note::new("draft")));
    assert_eq!(got.pending, 1);
    assert_eq!(got.version, 0, "no confirmed record yet");
    assert_eq!(w.server.submits.get(), 0, "nothing is sent until a flush");
}

#[test]
fn the_same_request_id_sent_twice_applies_once() {
    let w = World::new();
    let c = client(&w);
    let handle = block_on(c.set("notes", "a", Note::new("once"))).unwrap();
    w.server.lose_next_response.set(true);
    let first = block_on(c.flush()).unwrap();
    assert!(first.stopped, "the lost response stops the flush");
    assert_eq!(
        block_on(c.flush()).unwrap().sent,
        1,
        "the second send is accepted"
    );
    w.server.process();
    block_on(c.sync()).unwrap();
    assert_eq!(w.server.applied.get(), 1, "applied once, not twice");
    assert_eq!(w.server.submits.get(), 2);
    assert_eq!(
        w.server.received.borrow().as_slice(),
        &[handle.request_id()]
    );
    assert_eq!(handle.status(), MutationStatus::Applied { version: 1 });
}

#[test]
fn offline_mutations_flush_in_creation_order_on_reconnect() {
    let w = World::new();
    let c = client(&w);
    block_on(c.set("notes", "a", Note::new("v0"))).unwrap();
    block_on(c.flush()).unwrap();
    w.server.process();
    block_on(c.sync()).unwrap();

    w.server.online.set(false);
    let first = block_on(c.update("notes", "a", Note::new("first"), 1)).unwrap();
    let second = block_on(c.update("notes", "a", Note::new("second"), 2)).unwrap();
    let third = block_on(c.update("notes", "a", Note::new(""), 3)).unwrap();
    let report = block_on(c.flush()).unwrap();
    assert!(report.stopped);
    assert_eq!(report.sent, 0);
    assert_eq!(first.status(), MutationStatus::QueuedLocal);

    w.server.online.set(true);
    let report = block_on(c.flush()).unwrap();
    assert_eq!(report.sent, 3);
    w.server.process();
    block_on(c.sync()).unwrap();

    let expected = vec![first.request_id(), second.request_id(), third.request_id()];
    let received: Vec<RequestId> = w.server.received.borrow().clone();
    assert_eq!(&received[received.len() - 3..], expected.as_slice());
    assert_eq!(
        w.server.doc("notes", "a").unwrap().value,
        Some(Note::new("second"))
    );
    assert_eq!(third.status(), MutationStatus::Applied { version: 4 });
}

#[test]
fn a_stale_base_version_reverts_the_change_and_reports_a_conflict() {
    let w = World::new();
    let c = client(&w);
    block_on(c.set("notes", "a", Note::new("original"))).unwrap();
    block_on(c.sync()).unwrap();
    w.server.process();
    block_on(c.sync()).unwrap();

    // Someone else moves the document on to version 2 while this client still reads version 1.
    w.server.docs.borrow_mut().insert(
        "notes/a".to_owned(),
        Record::live(Note::new("theirs"), 2, w.clock.now_ms()),
    );

    let stale = block_on(c.update("notes", "a", Note::new("mine"), 1)).unwrap();
    assert_eq!(
        block_on(c.get("notes", "a")).unwrap().data,
        Some(Note::new("mine"))
    );

    block_on(c.sync()).unwrap();
    w.server.process();
    block_on(c.sync()).unwrap();

    assert_eq!(stale.status(), MutationStatus::Failed(FailReason::Conflict));
    let after = block_on(c.get("notes", "a")).unwrap();
    // The change is reverted to the last confirmed record. The client has not yet seen the
    // server's newer "theirs" (version 2): that arrives through the edge or cloud tier.
    assert_eq!(
        after.data,
        Some(Note::new("original")),
        "the optimistic change is reverted"
    );
    assert_eq!(after.version, 1);
    assert_eq!(after.pending, 0);
}

#[test]
fn a_server_refusal_at_submit_reverts_the_change_with_the_reason() {
    let w = World::new();
    let c = client(&w);
    let handle = block_on(c.set("forbidden", "a", Note::new("nope"))).unwrap();
    assert_eq!(
        block_on(c.get("forbidden", "a")).unwrap().data,
        Some(Note::new("nope"))
    );
    block_on(c.flush()).unwrap();
    assert_eq!(
        handle.status(),
        MutationStatus::Failed(FailReason::Forbidden)
    );
    assert_eq!(block_on(c.get("forbidden", "a")).unwrap().data, None);
}

#[test]
fn on_settled_fires_once_when_the_write_is_applied() {
    let w = World::new();
    let c = client(&w);
    let handle = block_on(c.set("notes", "a", Note::new("hi"))).unwrap();
    let seen: Rc<RefCell<Vec<MutationStatus>>> = Rc::new(RefCell::new(Vec::new()));
    let sink = Rc::clone(&seen);
    handle.on_settled(move |status| sink.borrow_mut().push(status.clone()));
    block_on(c.sync()).unwrap();
    w.server.process();
    block_on(c.sync()).unwrap();
    assert_eq!(
        seen.borrow().as_slice(),
        &[MutationStatus::Applied { version: 1 }]
    );
}

#[test]
fn an_unknown_mutation_is_rechecked_on_restart_and_never_resent() {
    let w = World::new();
    let c = client(&w);
    let handle = block_on(c.set("notes", "a", Note::new("slow"))).unwrap();
    block_on(c.flush()).unwrap();
    assert_eq!(w.server.submits.get(), 1);

    // The server does not process it within the timeout.
    let start = w.clock.now_ms();
    let status = block_on(c.track(handle.request_id())).unwrap();
    assert_eq!(status, MutationStatus::Unknown);
    assert_eq!(w.clock.now_ms() - start, SETTLE_TIMEOUT_MS);
    assert_eq!(
        w.server.status_calls.get(),
        10,
        "polls at 1, 3, 7, 15, 23, 31, 39, 47, 55 and 60 s"
    );
    assert_eq!(FIRST_POLL_MS, 1_000);

    // Restart: a new client over the same outbox and server.
    let restarted = client(&w);
    block_on(restarted.resume()).unwrap();
    assert_eq!(
        w.server.submits.get(),
        1,
        "an unknown mutation is never sent again"
    );
    assert!(w.server.status_calls.get() > 10, "it is checked on restart");

    w.server.process();
    block_on(restarted.resume()).unwrap();
    assert_eq!(
        restarted.status(handle.request_id()),
        MutationStatus::Applied { version: 1 }
    );
    assert_eq!(w.server.submits.get(), 1);
    assert!(block_on(w.outbox.list()).unwrap().is_empty());
}

#[test]
fn a_queued_write_survives_a_restart_and_is_sent_once() {
    let w = World::new();
    let c = client(&w);
    block_on(c.set("notes", "a", Note::new("kept"))).unwrap();
    // The client goes away before flushing. The outbox still holds the write.
    drop(c);
    let restarted = client(&w);
    block_on(restarted.resume()).unwrap();
    w.server.process();
    block_on(restarted.sync()).unwrap();
    assert_eq!(w.server.applied.get(), 1);
    assert_eq!(
        w.server.doc("notes", "a").unwrap().value,
        Some(Note::new("kept"))
    );
    let entries = block_on(w.outbox.list()).unwrap();
    assert!(entries.is_empty(), "settled entries leave the outbox");
    assert!(entries.iter().all(|e| e.state != EntryState::Queued));
}

#[test]
fn a_malformed_collection_or_id_is_refused_and_nothing_is_queued() {
    let w = World::new();
    let c = client(&w);
    assert!(block_on(c.set("a/b", "x", Note::new("t"))).is_err());
    assert!(block_on(c.set("notes", "", Note::new("t"))).is_err());
    assert!(block_on(w.outbox.list()).unwrap().is_empty());
}

// --- Request ids and UTC -----------------------------------------------------------------

#[test]
fn a_request_id_is_a_uuid_v7_with_its_time_and_unique_random_bits() {
    let rng = SeededRandom::new(1);
    let a = RequestId::v7(1_700_000_000_123, &rng);
    let b = RequestId::v7(1_700_000_000_123, &rng);
    assert!(a.is_v7());
    assert_eq!(a.unix_ms(), 1_700_000_000_123);
    assert_ne!(a, b);
    assert_eq!(a.to_string().len(), 36);
    assert_eq!(a.to_string().matches('-').count(), 4);
    assert_eq!(a.to_string().as_bytes()[14], b'7', "version nibble");
}

#[test]
fn utc_times_format_as_rfc_3339_in_utc() {
    assert_eq!(
        UtcTime::from_unix_ms(0).to_rfc3339(),
        "1970-01-01T00:00:00.000Z"
    );
    assert_eq!(
        UtcTime::from_unix_ms(1_700_000_000_123).to_rfc3339(),
        "2023-11-14T22:13:20.123Z"
    );
}
