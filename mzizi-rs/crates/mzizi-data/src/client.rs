//! The client: reads through the cascade with this client's pending writes applied, and writes
//! that go to the outbox first, then to the server.
//!
//! ## Consistency (draft)
//!
//! This is a draft contract. The write model starts from Coda's published approach to
//! local-first mutations; the numbers below are targets, not measurements.
//!
//! - A write is acknowledged within the gateway's response time, and is in the outbox before
//!   the call returns.
//! - A write is expected to be applied within 5 seconds under normal load. This is a TARGET TO
//!   BE CONFIRMED, not a measured fact.
//! - A read can lag the server by that window. It reports the `version` and `as_of` of the
//!   confirmed record, so a caller can see how old it is.
//! - Read-your-own-writes: a read applies this client's unconfirmed writes on top of the
//!   confirmed record, so a caller sees its own writes at once.
//! - Server order: writes to one document apply in the order the server receives them, which
//!   is creation order.
//! - A stale `base_version` is a conflict: the server refuses the write and the optimistic
//!   change is reverted.
//!
//! No speed claim is made here.

use std::cell::{Cell, RefCell};
use std::collections::{HashMap, HashSet};
use std::marker::PhantomData;
use std::rc::Rc;

use crate::Error;
use crate::cascade::{Cascade, CascadeError};
use crate::clock::Clock;
use crate::layer::{Layer, Record, Source};
use crate::mutation::{FailReason, Mutation, MutationStatus, Op, Patch};
use crate::outbox::{Entry, EntryState, Outbox};
use crate::query::{QueryResult, UtcTime};
use crate::request_id::{RandomSource, RequestId};
use crate::transport::{MAX_STATUS_BATCH, StatusReply, Submitted, Transport};

/// The first status check after a mutation is accepted, in milliseconds.
pub const FIRST_POLL_MS: u64 = 1_000;

/// The longest wait between two status checks, in milliseconds.
pub const MAX_POLL_INTERVAL_MS: u64 = 8_000;

/// How long a mutation is polled before it is marked [`MutationStatus::Unknown`].
pub const SETTLE_TIMEOUT_MS: u64 = 60_000;

/// Everything a client is built from. The host supplies each piece.
pub struct Config<V, L, E, C, T, O, K, R> {
    /// The local tier. Holds confirmed records.
    pub local: L,
    /// The edge tier.
    pub edge: E,
    /// The cloud tier. Authoritative for "no record".
    pub cloud: C,
    /// The wire to the server.
    pub transport: T,
    /// The durable outbox.
    pub outbox: O,
    /// The clock: time, and sleeps for status polling.
    pub clock: K,
    /// Random bytes for request ids.
    pub random: R,
    /// The value type. Carried so the type parameter is named at construction.
    pub value: PhantomData<fn() -> V>,
}

/// Why a read failed.
#[derive(Debug)]
pub enum ReadError {
    /// No tier answered. Carries each tier's failure.
    Tiers(CascadeError),
    /// The outbox could not be read, so the pending writes are unknown.
    Outbox(Error),
}

impl std::fmt::Display for ReadError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ReadError::Tiers(e) => write!(f, "{e}"),
            ReadError::Outbox(e) => write!(f, "outbox: {e}"),
        }
    }
}

impl std::error::Error for ReadError {}

/// What one flush did.
#[derive(Debug, Default, Clone, Copy, PartialEq, Eq)]
pub struct FlushReport {
    /// Mutations the server accepted in this flush.
    pub sent: usize,
    /// Mutations the server refused at once.
    pub rejected: usize,
    /// Whether the flush stopped on a failure to reach the server.
    pub stopped: bool,
}

/// A callback fired when a write settles.
type Callback = Box<dyn FnMut(&MutationStatus)>;

/// One mutation's status cell, shared between the client and its handles.
#[derive(Default)]
struct Slot {
    status: Option<MutationStatus>,
    callbacks: Vec<Callback>,
}

type Slots = Rc<RefCell<HashMap<RequestId, Slot>>>;

/// A handle to one write. Returned as soon as the write is in the outbox.
#[derive(Clone)]
pub struct MutationHandle {
    request_id: RequestId,
    slots: Slots,
}

impl MutationHandle {
    /// The request id the server knows this write by.
    #[must_use]
    pub fn request_id(&self) -> RequestId {
        self.request_id
    }

    /// The write's status now.
    #[must_use]
    pub fn status(&self) -> MutationStatus {
        self.slots
            .borrow()
            .get(&self.request_id)
            .and_then(|s| s.status.clone())
            .unwrap_or(MutationStatus::Unknown)
    }

    /// Calls `callback` once the write is applied or refused. If it already is, calls it now.
    /// A write that becomes [`MutationStatus::Unknown`] is not settled, so the callback waits.
    pub fn on_settled(&self, mut callback: impl FnMut(&MutationStatus) + 'static) {
        let settled_now = {
            let mut slots = self.slots.borrow_mut();
            match slots.get_mut(&self.request_id) {
                Some(slot) => match &slot.status {
                    Some(status) if status.is_settled() => Some(status.clone()),
                    _ => {
                        slot.callbacks.push(Box::new(callback));
                        return;
                    }
                },
                None => None,
            }
        };
        if let Some(status) = settled_now {
            callback(&status);
        }
    }
}

/// The client. Reads and writes one set of tiers, through one outbox, to one server.
pub struct MziziData<V, L, E, C, T, O, K, R> {
    cascade: Cascade<V, L, E, C, Rc<K>>,
    transport: T,
    outbox: O,
    clock: Rc<K>,
    random: R,
    next_seq: Cell<Option<u64>>,
    slots: Slots,
}

impl<V, L, E, C, T, O, K, R> MziziData<V, L, E, C, T, O, K, R>
where
    V: Clone + PartialEq + Patch,
    L: Layer<V>,
    E: Layer<V>,
    C: Layer<V>,
    T: Transport<V>,
    O: Outbox<V>,
    K: Clock,
    R: RandomSource,
{
    /// A client over `config`. Call [`MziziData::resume`] once at start-up.
    pub fn new(config: Config<V, L, E, C, T, O, K, R>) -> Self {
        let clock = Rc::new(config.clock);
        Self {
            cascade: Cascade::new(config.local, config.edge, config.cloud, Rc::clone(&clock)),
            transport: config.transport,
            outbox: config.outbox,
            clock,
            random: config.random,
            next_seq: Cell::new(None),
            slots: Rc::new(RefCell::new(HashMap::new())),
        }
    }

    /// Reads a document. Tiers are tried in the cascade's order; this client's pending writes to
    /// the document are applied on top of the confirmed record.
    pub async fn get(&self, collection: &str, doc_id: &str) -> Result<QueryResult<V>, ReadError> {
        let key = key_of(collection, doc_id);
        let fetched = self.cascade.fetch(&key).await.map_err(ReadError::Tiers)?;
        let entries = self.outbox.list().await.map_err(ReadError::Outbox)?;
        let mine: Vec<&Entry<V>> = entries.iter().filter(|e| e.mutation.key() == key).collect();

        let (mut data, source, version, as_of) = match fetched {
            Some(f) => (
                Some(f.value),
                f.source,
                f.version,
                UtcTime::from_unix_ms(f.updated_at),
            ),
            None => (
                None,
                Source::Cloud,
                0,
                UtcTime::from_unix_ms(self.clock.now_ms()),
            ),
        };
        for entry in &mine {
            match entry.mutation.op {
                Op::Set => data = entry.mutation.payload.clone(),
                Op::Update => {
                    if let (Some(current), Some(patch)) =
                        (data.as_mut(), entry.mutation.payload.as_ref())
                    {
                        current.apply(patch);
                    }
                }
                Op::Delete => data = None,
            }
        }
        Ok(QueryResult {
            data,
            source,
            version,
            as_of,
            pending: mine.len(),
        })
    }

    /// Stores `value` as the whole document. Returns once the write is in the outbox.
    ///
    /// # Errors
    /// Fails if the ids are malformed or the outbox cannot store the write. Nothing is queued
    /// then.
    pub async fn set(
        &self,
        collection: &str,
        doc_id: &str,
        value: V,
    ) -> Result<MutationHandle, Error> {
        self.enqueue(Op::Set, collection, doc_id, Some(value), None)
            .await
    }

    /// Merges `patch` into the document. `base_version` is the version the caller read; the
    /// server refuses the write as a conflict if the document has since changed.
    ///
    /// # Errors
    /// As [`MziziData::set`].
    pub async fn update(
        &self,
        collection: &str,
        doc_id: &str,
        patch: V,
        base_version: u64,
    ) -> Result<MutationHandle, Error> {
        self.enqueue(
            Op::Update,
            collection,
            doc_id,
            Some(patch),
            Some(base_version),
        )
        .await
    }

    /// Removes the document. `base_version` is required, as for [`MziziData::update`].
    ///
    /// # Errors
    /// As [`MziziData::set`].
    pub async fn delete(
        &self,
        collection: &str,
        doc_id: &str,
        base_version: u64,
    ) -> Result<MutationHandle, Error> {
        self.enqueue(Op::Delete, collection, doc_id, None, Some(base_version))
            .await
    }

    async fn enqueue(
        &self,
        op: Op,
        collection: &str,
        doc_id: &str,
        payload: Option<V>,
        base_version: Option<u64>,
    ) -> Result<MutationHandle, Error> {
        check_part("collection", collection)?;
        check_part("doc_id", doc_id)?;
        let seq = self.take_seq().await?;
        let now = self.clock.now_ms();
        let request_id = RequestId::v7(now, &self.random);
        let mutation = Mutation {
            request_id,
            collection: collection.to_owned(),
            doc_id: doc_id.to_owned(),
            op,
            payload,
            base_version,
            client_ts: now,
        };
        // Written before it is sent: a crash after this point cannot lose the write.
        self.outbox
            .push(Entry {
                seq,
                mutation,
                state: EntryState::Queued,
            })
            .await?;
        self.set_status(request_id, MutationStatus::QueuedLocal);
        Ok(MutationHandle {
            request_id,
            slots: Rc::clone(&self.slots),
        })
    }

    async fn take_seq(&self) -> Result<u64, Error> {
        let seq = match self.next_seq.get() {
            Some(seq) => seq,
            None => self
                .outbox
                .list()
                .await?
                .iter()
                .map(|e| e.seq + 1)
                .max()
                .unwrap_or(0),
        };
        self.next_seq.set(Some(seq + 1));
        Ok(seq)
    }

    /// The status of a write made by this client (or loaded from the outbox after a restart).
    #[must_use]
    pub fn status(&self, request_id: RequestId) -> MutationStatus {
        self.slots
            .borrow()
            .get(&request_id)
            .and_then(|s| s.status.clone())
            .unwrap_or(MutationStatus::Unknown)
    }

    /// Start-up. Checks the status of every accepted or unknown write, so a write the server
    /// applied while the client was away is settled. Unknown writes are checked and never sent
    /// again. Then queued writes are sent.
    ///
    /// # Errors
    /// Fails only if the outbox cannot be read. A server that cannot be reached stops the work
    /// without an error, and it resumes on the next call.
    pub async fn resume(&self) -> Result<FlushReport, Error> {
        loop {
            let candidates: Vec<Entry<V>> = self
                .heads()
                .await?
                .into_iter()
                .filter(|e| e.state != EntryState::Queued)
                .collect();
            if candidates.is_empty() || self.poll(candidates).await? == 0 {
                break;
            }
        }
        self.flush().await
    }

    /// Sends every queued write, in creation order, and stops at the first failure to reach the
    /// server. An entry leaves the outbox only on `applied` or a permanent refusal.
    ///
    /// # Errors
    /// Fails only if the outbox cannot be read or updated.
    pub async fn flush(&self) -> Result<FlushReport, Error> {
        let mut report = FlushReport::default();
        for entry in self.outbox.list().await? {
            if entry.state != EntryState::Queued {
                continue;
            }
            let request_id = entry.mutation.request_id;
            match self.transport.submit(&entry.mutation).await {
                // Any failure to reach the server stops the flush and keeps the entry queued.
                Err(_) => {
                    report.stopped = true;
                    break;
                }
                Ok(Submitted::Accepted) => {
                    let mut accepted = entry;
                    accepted.state = EntryState::Accepted;
                    self.outbox.put(accepted).await?;
                    self.set_status(request_id, MutationStatus::Accepted);
                    report.sent += 1;
                }
                Ok(Submitted::Rejected(reason)) => {
                    self.finish_failed(request_id, reason).await?;
                    report.rejected += 1;
                }
            }
        }
        Ok(report)
    }

    /// Flushes, then checks the status of the accepted writes once, in batches.
    ///
    /// # Errors
    /// As [`MziziData::flush`].
    pub async fn sync(&self) -> Result<FlushReport, Error> {
        let report = self.flush().await?;
        loop {
            let candidates: Vec<Entry<V>> = self
                .heads()
                .await?
                .into_iter()
                .filter(|e| e.state == EntryState::Accepted)
                .collect();
            if candidates.is_empty() || self.poll(candidates).await? == 0 {
                break;
            }
        }
        Ok(report)
    }

    /// Follows one accepted write until it settles, checking its status on the backoff schedule
    /// (1 s, 2 s, 4 s, then every 8 s) and stopping at 60 s. At 60 s it becomes
    /// [`MutationStatus::Unknown`]: it stays in the outbox, is checked again on the next
    /// [`MziziData::resume`], and is never sent again.
    ///
    /// # Errors
    /// Fails only if the outbox cannot be read or updated.
    pub async fn track(&self, request_id: RequestId) -> Result<MutationStatus, Error> {
        let mut elapsed = 0;
        let mut interval = FIRST_POLL_MS;
        loop {
            let Some(entry) = self.find(request_id).await? else {
                return Ok(self.status(request_id));
            };
            if entry.state == EntryState::Queued {
                return Ok(MutationStatus::QueuedLocal);
            }
            if elapsed >= SETTLE_TIMEOUT_MS {
                let mut unknown = entry;
                unknown.state = EntryState::Unknown;
                self.outbox.put(unknown).await?;
                self.set_status(request_id, MutationStatus::Unknown);
                return Ok(MutationStatus::Unknown);
            }
            let step = interval.min(SETTLE_TIMEOUT_MS - elapsed);
            self.clock.sleep(step).await;
            elapsed += step;
            interval = (interval * 2).min(MAX_POLL_INTERVAL_MS);
            if self
                .heads()
                .await?
                .iter()
                .any(|e| e.mutation.request_id == request_id)
            {
                self.poll(vec![entry]).await?;
            }
            let status = self.status(request_id);
            if status.is_settled() {
                return Ok(status);
            }
        }
    }

    async fn find(&self, request_id: RequestId) -> Result<Option<Entry<V>>, Error> {
        Ok(self
            .outbox
            .list()
            .await?
            .into_iter()
            .find(|e| e.mutation.request_id == request_id))
    }

    /// The first entry of each document, in creation order. Only a head is polled, so a
    /// document's writes settle in server order.
    async fn heads(&self) -> Result<Vec<Entry<V>>, Error> {
        let mut seen = HashSet::new();
        Ok(self
            .outbox
            .list()
            .await?
            .into_iter()
            .filter(|e| seen.insert(e.mutation.key()))
            .collect())
    }

    /// Checks the status of `candidates` in batches, and settles those the server has finished.
    /// Returns how many settled.
    async fn poll(&self, candidates: Vec<Entry<V>>) -> Result<usize, Error> {
        let mut settled = 0;
        for chunk in candidates.chunks(MAX_STATUS_BATCH) {
            let ids: Vec<RequestId> = chunk.iter().map(|e| e.mutation.request_id).collect();
            for (id, reply) in self.transport.status(&ids).await? {
                let Some(entry) = chunk.iter().find(|e| e.mutation.request_id == id) else {
                    continue;
                };
                match reply {
                    StatusReply::Pending => {}
                    StatusReply::Applied(record) => {
                        self.finish_applied(entry, record).await?;
                        settled += 1;
                    }
                    StatusReply::Failed(reason) => {
                        self.finish_failed(id, reason).await?;
                        settled += 1;
                    }
                }
            }
        }
        Ok(settled)
    }

    /// The server applied the write: the confirmed record becomes the server's, and the entry
    /// leaves the outbox. A record older than the local one is not written back.
    async fn finish_applied(&self, entry: &Entry<V>, record: Record<V>) -> Result<(), Error> {
        let key = entry.mutation.key();
        let local = self.cascade.local();
        let newer = match local.get(&key).await? {
            Some(current) => record.version >= current.version,
            None => true,
        };
        if newer {
            let version = record.version;
            let confirmed =
                Record::from_parts(record.value, record.version, record.updated_at, false);
            local.put(&key, confirmed).await?;
            self.outbox.remove(entry.mutation.request_id).await?;
            self.set_status(
                entry.mutation.request_id,
                MutationStatus::Applied { version },
            );
        } else {
            self.outbox.remove(entry.mutation.request_id).await?;
            self.set_status(
                entry.mutation.request_id,
                MutationStatus::Applied {
                    version: record.version,
                },
            );
        }
        Ok(())
    }

    /// The server refused the write. The entry leaves the outbox, so the read overlay no longer
    /// shows it: the optimistic change is reverted.
    async fn finish_failed(&self, request_id: RequestId, reason: FailReason) -> Result<(), Error> {
        self.outbox.remove(request_id).await?;
        self.set_status(request_id, MutationStatus::Failed(reason));
        Ok(())
    }

    fn set_status(&self, request_id: RequestId, status: MutationStatus) {
        let to_call = {
            let mut slots = self.slots.borrow_mut();
            let slot = slots.entry(request_id).or_default();
            slot.status = Some(status.clone());
            if status.is_settled() {
                Some(std::mem::take(&mut slot.callbacks))
            } else {
                None
            }
        };
        if let Some(mut callbacks) = to_call {
            for callback in &mut callbacks {
                callback(&status);
            }
        }
    }
}

fn key_of(collection: &str, doc_id: &str) -> String {
    format!("{collection}/{doc_id}")
}

fn check_part(name: &str, value: &str) -> Result<(), Error> {
    if value.is_empty() || value.contains('/') {
        return Err(Error::Refused(format!(
            "{name} must be non-empty and contain no '/'"
        )));
    }
    Ok(())
}
