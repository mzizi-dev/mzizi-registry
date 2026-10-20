//! The fetch cascade, sync reconciliation and optimistic writes, over three [`Layer`]s.

use std::collections::BTreeMap;
use std::fmt;
use std::marker::PhantomData;

use crate::clock::Clock;
use crate::layer::{Layer, LayerError, Record, Source};

/// The time-to-live when none is set: 30 seconds, the default `staleTime` of the
/// TypeScript `useMziziQuery` this crate replaces.
const DEFAULT_TTL_MS: u64 = 30_000;

/// A value a read found, and where it was found.
#[derive(Debug, Clone, PartialEq)]
pub struct Fetched<V> {
    /// The value.
    pub value: V,
    /// The tier that answered. A read that hit the device says `Local`, and so on.
    pub source: Source,
    /// The version of the record that answered.
    pub version: u64,
    /// The writer's timestamp on that record.
    pub updated_at: u64,
    /// The clock when this read happened.
    pub fetched_at: u64,
    /// Whether the record is older than its time-to-live, measured from `updated_at`.
    pub stale: bool,
    /// Tiers consulted before the answer that could not be read, and why. Non-empty means
    /// a tier is failing even though the read succeeded.
    pub skipped: Vec<(Source, LayerError)>,
}

/// No tier answered: every tier the read reached failed, so the read is unknown rather
/// than a miss. A miss is `Ok(None)`.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CascadeError {
    /// Each tier's failure, in cascade order.
    pub errors: Vec<(Source, LayerError)>,
}

impl fmt::Display for CascadeError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str("no tier answered")?;
        for (source, error) in &self.errors {
            write!(f, "; {source}: {error}")?;
        }
        Ok(())
    }
}

impl std::error::Error for CascadeError {}

/// What one [`Cascade::reconcile`] pass found and did.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SyncReport {
    /// The tier holding the winning record, and its version. `None` when no tier held any
    /// record for the key.
    pub winner: Option<(Source, u64)>,
    /// The tiers that were behind and now hold the winning record.
    pub written: Vec<Source>,
    /// The tiers that could not be read or written, and why. A tier that failed is never
    /// written blind, because its newer data, if any, would be lost.
    pub errors: Vec<(Source, LayerError)>,
}

/// An optimistic write did not reach every tier, so it was rolled back.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct OptimisticError {
    /// The tier whose read or write failed.
    pub layer: Source,
    /// That tier's error.
    pub cause: LayerError,
    /// Whether every tier written before the failure was restored to the record it held
    /// before. `false` means a tier now holds the optimistic value that could not be
    /// taken back, and the next reconciliation will settle it.
    pub reverted: bool,
}

impl fmt::Display for OptimisticError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(
            f,
            "optimistic write failed at {}: {}",
            self.layer, self.cause
        )?;
        if !self.reverted {
            f.write_str(" (rollback incomplete)")?;
        }
        Ok(())
    }
}

impl std::error::Error for OptimisticError {}

/// The three tiers, a clock, and the per-key time-to-live.
///
/// Reads run local, then edge, then cloud, and stop at the first tier that holds the key.
/// The cloud is authoritative: a cloud miss is `Ok(None)`, even if the device or the edge
/// failed on the way.
pub struct Cascade<V, L, E, C, K> {
    local: L,
    edge: E,
    cloud: C,
    clock: K,
    default_ttl_ms: u64,
    ttl_ms: BTreeMap<String, u64>,
    value: PhantomData<fn() -> V>,
}

impl<V, L, E, C, K> Cascade<V, L, E, C, K> {
    /// A cascade over the three tiers, with [`DEFAULT_TTL_MS`] for every key.
    pub fn new(local: L, edge: E, cloud: C, clock: K) -> Self {
        Self {
            local,
            edge,
            cloud,
            clock,
            default_ttl_ms: DEFAULT_TTL_MS,
            ttl_ms: BTreeMap::new(),
            value: PhantomData,
        }
    }

    /// Sets the time-to-live used for every key without its own.
    #[must_use]
    pub fn with_default_ttl(mut self, ttl_ms: u64) -> Self {
        self.default_ttl_ms = ttl_ms;
        self
    }

    /// Sets the time-to-live for one key, in milliseconds.
    pub fn set_ttl(&mut self, key: &str, ttl_ms: u64) {
        self.ttl_ms.insert(key.to_owned(), ttl_ms);
    }

    fn ttl_for(&self, key: &str) -> u64 {
        self.ttl_ms.get(key).copied().unwrap_or(self.default_ttl_ms)
    }
}

/// Turns one tier's read into the cascade's bookkeeping: a tier that failed is recorded in
/// `errors` and yields `None`; a tier that answered yields its `Option<Record>`.
fn settle<V>(
    source: Source,
    result: Result<Option<Record<V>>, LayerError>,
    errors: &mut Vec<(Source, LayerError)>,
) -> Option<Option<Record<V>>> {
    match result {
        Ok(record) => Some(record),
        Err(error) => {
            errors.push((source, error));
            None
        }
    }
}

/// Keeps the newest record seen so far. The newest has the highest version; a version tie
/// goes to the tier with the higher [`Source::rank`], so the outcome does not depend on
/// the order the tiers were read in.
fn newer<V: Clone>(best: &mut Option<(Source, Record<V>)>, source: Source, record: &Record<V>) {
    let beats = match best {
        None => true,
        Some((best_source, best_record)) => {
            (record.version, source.rank()) > (best_record.version, best_source.rank())
        }
    };
    if beats {
        *best = Some((source, record.clone()));
    }
}

/// Brings one tier to the winning record. A tier that could not be read is left alone.
async fn sync_tier<V, Ly>(
    layer: &Ly,
    source: Source,
    key: &str,
    state: Option<Option<Record<V>>>,
    winner: &Record<V>,
    report: &mut SyncReport,
) where
    V: Clone + PartialEq,
    Ly: Layer<V>,
{
    let Some(current) = state else {
        return;
    };
    let behind = match &current {
        None => true,
        Some(record) => record.version != winner.version || record.value != winner.value,
    };
    if !behind {
        return;
    }
    match layer.put(key, winner.clone()).await {
        Ok(()) => report.written.push(source),
        Err(error) => report.errors.push((source, error)),
    }
}

/// Puts `prev` back on a tier, or removes the key when there was no previous record.
async fn restore_tier<V, Ly>(layer: &Ly, key: &str, prev: &Option<Record<V>>) -> bool
where
    V: Clone,
    Ly: Layer<V>,
{
    match prev {
        Some(record) => layer.put(key, record.clone()).await.is_ok(),
        None => layer.delete(key).await.is_ok(),
    }
}

impl<V, L, E, C, K> Cascade<V, L, E, C, K>
where
    L: Layer<V>,
    E: Layer<V>,
    C: Layer<V>,
    K: Clock,
{
    fn fetched(
        &self,
        key: &str,
        source: Source,
        record: Record<V>,
        skipped: Vec<(Source, LayerError)>,
    ) -> Fetched<V> {
        let now = self.clock.now_ms();
        Fetched {
            stale: now.saturating_sub(record.updated_at) > self.ttl_for(key),
            value: record.value,
            source,
            version: record.version,
            updated_at: record.updated_at,
            fetched_at: now,
            skipped,
        }
    }

    /// Reads `key` from local, then edge, then cloud.
    ///
    /// - A hit answers at once and is written back to every faster tier that was consulted
    ///   and missed. Failed tiers are not written.
    /// - A miss on every tier is `Ok(None)`, but only when the cloud answered. If the cloud
    ///   failed, the answer is unknown and the call is an error.
    /// - Errors from tiers above the answer do not fail the read. They are reported in
    ///   [`Fetched::skipped`].
    ///
    /// # Errors
    ///
    /// Returns [`CascadeError`] when the cloud failed and no faster tier held the key.
    pub async fn fetch(&self, key: &str) -> Result<Option<Fetched<V>>, CascadeError>
    where
        V: Clone,
    {
        let mut errors = Vec::new();

        let local_missed = match self.local.get(key).await {
            Ok(Some(record)) => return Ok(Some(self.fetched(key, Source::Local, record, errors))),
            Ok(None) => true,
            Err(error) => {
                errors.push((Source::Local, error));
                false
            }
        };

        let edge_missed = match self.edge.get(key).await {
            Ok(Some(record)) => {
                if local_missed {
                    let _ = self.local.put(key, record.clone()).await;
                }
                return Ok(Some(self.fetched(key, Source::Edge, record, errors)));
            }
            Ok(None) => true,
            Err(error) => {
                errors.push((Source::Edge, error));
                false
            }
        };

        match self.cloud.get(key).await {
            Ok(Some(record)) => {
                if local_missed {
                    let _ = self.local.put(key, record.clone()).await;
                }
                if edge_missed {
                    let _ = self.edge.put(key, record.clone()).await;
                }
                Ok(Some(self.fetched(key, Source::Cloud, record, errors)))
            }
            Ok(None) => Ok(None),
            Err(error) => {
                errors.push((Source::Cloud, error));
                Err(CascadeError { errors })
            }
        }
    }

    /// Brings all three tiers to the newest record for `key`.
    ///
    /// The winner is the record with the highest version. A version tie goes to the tier
    /// with the higher [`Source::rank`] (cloud, then edge, then local). A tier that is behind
    /// the winner, or holds none, is written. A tier that cannot be read is skipped and
    /// reported, and is never written.
    ///
    /// The crate does not spawn this. The host schedules it, for example on a timer, when
    /// it comes online, or after a write.
    pub async fn reconcile(&self, key: &str) -> SyncReport
    where
        V: Clone + PartialEq,
    {
        let mut report = SyncReport {
            winner: None,
            written: Vec::new(),
            errors: Vec::new(),
        };
        let local = settle(Source::Local, self.local.get(key).await, &mut report.errors);
        let edge = settle(Source::Edge, self.edge.get(key).await, &mut report.errors);
        let cloud = settle(Source::Cloud, self.cloud.get(key).await, &mut report.errors);

        let mut best = None;
        for (source, state) in [
            (Source::Local, &local),
            (Source::Edge, &edge),
            (Source::Cloud, &cloud),
        ] {
            if let Some(Some(record)) = state {
                newer(&mut best, source, record);
            }
        }
        let Some((winner_source, winner)) = best else {
            return report;
        };
        report.winner = Some((winner_source, winner.version));

        sync_tier(&self.local, Source::Local, key, local, &winner, &mut report).await;
        sync_tier(&self.edge, Source::Edge, key, edge, &winner, &mut report).await;
        sync_tier(&self.cloud, Source::Cloud, key, cloud, &winner, &mut report).await;
        report
    }

    /// The newest record across every tier that answered, or the failure of the first tier
    /// when none did.
    async fn newest(&self, key: &str) -> Result<Option<Record<V>>, (Source, LayerError)>
    where
        V: Clone,
    {
        let mut errors = Vec::new();
        let local = settle(Source::Local, self.local.get(key).await, &mut errors);
        let edge = settle(Source::Edge, self.edge.get(key).await, &mut errors);
        let cloud = settle(Source::Cloud, self.cloud.get(key).await, &mut errors);

        let mut any_answered = false;
        let mut best = None;
        for (source, state) in [
            (Source::Local, &local),
            (Source::Edge, &edge),
            (Source::Cloud, &cloud),
        ] {
            if let Some(record) = state {
                any_answered = true;
                if let Some(record) = record {
                    newer(&mut best, source, record);
                }
            }
        }
        if !any_answered {
            if let Some(first) = errors.into_iter().next() {
                return Err(first);
            }
        }
        Ok(best.map(|(_, record)| record))
    }

    /// Writes `value` to the local tier first, then the edge, then the cloud, and returns
    /// the record written.
    ///
    /// The version is one above the newest version any reachable tier holds, so a later
    /// [`Cascade::reconcile`] keeps this write instead of overwriting it. If any tier fails,
    /// every tier already written is restored to the record it held before, and the error
    /// reports the failing tier and whether the restore completed.
    ///
    /// # Errors
    ///
    /// Returns [`OptimisticError`] when a tier cannot be read or written. When no tier can
    /// be read, nothing is written.
    pub async fn apply_optimistic(&self, key: &str, value: V) -> Result<Record<V>, OptimisticError>
    where
        V: Clone,
    {
        let prev = self
            .newest(key)
            .await
            .map_err(|(layer, cause)| OptimisticError {
                layer,
                cause,
                reverted: true,
            })?;

        let next = Record {
            value,
            version: prev
                .as_ref()
                .map_or(1, |record| record.version.saturating_add(1)),
            updated_at: self.clock.now_ms(),
        };

        let mut written = Vec::new();

        if let Err(cause) = self.local.put(key, next.clone()).await {
            return Err(self.abort(key, &prev, &written, Source::Local, cause).await);
        }
        written.push(Source::Local);

        if let Err(cause) = self.edge.put(key, next.clone()).await {
            return Err(self.abort(key, &prev, &written, Source::Edge, cause).await);
        }
        written.push(Source::Edge);

        if let Err(cause) = self.cloud.put(key, next.clone()).await {
            return Err(self.abort(key, &prev, &written, Source::Cloud, cause).await);
        }

        Ok(next)
    }

    async fn abort(
        &self,
        key: &str,
        prev: &Option<Record<V>>,
        written: &[Source],
        layer: Source,
        cause: LayerError,
    ) -> OptimisticError
    where
        V: Clone,
    {
        let mut reverted = true;
        if written.contains(&Source::Cloud) && !restore_tier(&self.cloud, key, prev).await {
            reverted = false;
        }
        if written.contains(&Source::Edge) && !restore_tier(&self.edge, key, prev).await {
            reverted = false;
        }
        if written.contains(&Source::Local) && !restore_tier(&self.local, key, prev).await {
            reverted = false;
        }
        OptimisticError {
            layer,
            cause,
            reverted,
        }
    }
}
