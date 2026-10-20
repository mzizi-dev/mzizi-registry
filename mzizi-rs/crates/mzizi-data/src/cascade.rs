//! The fetch cascade, sync reconciliation and local-first writes, over three [`Layer`]s.

use std::collections::BTreeMap;
use std::fmt;
use std::marker::PhantomData;

use crate::clock::Clock;
use crate::layer::{Layer, LayerError, Record, Source};

/// The time-to-live when none is set: 30 seconds, the default `staleTime` of the TypeScript
/// `useMziziQuery` this crate replaces.
const DEFAULT_TTL_MS: u64 = 30_000;

/// What one tier answered: `None` when the tier failed (the failure is already recorded),
/// `Some(None)` when it has no record for the key, and `Some(Some(record))` otherwise.
type Read<V> = Option<Option<Record<V>>>;

/// A tier's state before a write, for the rollback: `Err` when it could not be read.
type Snap<V> = Result<Option<Record<V>>, LayerError>;

/// The order every comparison uses. A confirmed record beats a pending one. Then the higher
/// version wins, and a version tie goes to the tier with the higher [`Source::rank`].
fn order_key<V>(record: &Record<V>, source: Source) -> (bool, u64, u8) {
    (!record.pending, record.version, source.rank())
}

/// Keeps the record that sorts highest by [`order_key`].
fn consider<V: Clone>(best: &mut Option<(Source, Record<V>)>, source: Source, record: &Record<V>) {
    let beats = match best {
        None => true,
        Some((best_source, best_record)) => {
            order_key(record, source) > order_key(best_record, *best_source)
        }
    };
    if beats {
        *best = Some((source, record.clone()));
    }
}

/// Turns one tier's read into the cascade's bookkeeping: a failed read is recorded in
/// `errors` and yields `None`.
fn settle<V>(
    source: Source,
    result: Result<Option<Record<V>>, LayerError>,
    errors: &mut Vec<(Source, LayerError)>,
) -> Read<V> {
    match result {
        Ok(record) => Some(record),
        Err(error) => {
            errors.push((source, error));
            None
        }
    }
}

/// The tiers faster than `source`: the only tiers a record from `source` is written up to.
fn faster_tiers(source: Source) -> &'static [Source] {
    match source {
        Source::Local => &[],
        Source::Edge => &[Source::Local],
        Source::Cloud => &[Source::Local, Source::Edge],
    }
}

/// Writes `incoming` to `layer` unless the record already there sorts at or above it.
///
/// This is the one place a record is written to a tier that already holds one. It reads the
/// target first, so a write that raced with this one is never overwritten by an older record.
/// It returns `Ok(true)` when it wrote.
async fn write_if_newer<V, Ly>(
    layer: &Ly,
    target: Source,
    key: &str,
    incoming: &Record<V>,
    from: Source,
) -> Result<bool, LayerError>
where
    V: Clone + PartialEq,
    Ly: Layer<V>,
{
    if let Some(existing) = layer.get(key).await? {
        if &existing == incoming {
            return Ok(false);
        }
        if order_key(&existing, target) >= order_key(incoming, from) {
            return Ok(false);
        }
    }
    layer.put(key, incoming.clone()).await?;
    Ok(true)
}

/// Puts `prev` back on a tier, or removes the key when there was no record.
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

/// A value a read found, and where it was found.
///
/// `stale` is true when the record is older than its time-to-live, or stamped after the
/// clock's current time. A future-stamped record cannot be aged, so it is reported stale.
#[non_exhaustive]
#[derive(Debug, Clone, PartialEq)]
pub struct Fetched<V> {
    /// The value.
    pub value: V,
    /// The tier whose record answered.
    pub source: Source,
    /// The version of that record.
    pub version: u64,
    /// The writer's timestamp on that record.
    pub updated_at: u64,
    /// The clock when this read happened.
    pub fetched_at: u64,
    /// Whether the record is stale, as described above.
    pub stale: bool,
    /// Tier failures the read ran into, including write-back failures. A read can succeed
    /// with a non-empty list, which means a tier is failing.
    pub skipped: Vec<(Source, LayerError)>,
}

/// No tier answered, so the read is unknown. A miss is `Ok(None)`, never this.
#[non_exhaustive]
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CascadeError {
    /// Each failed tier, in cascade order.
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
#[non_exhaustive]
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SyncReport {
    /// The tier holding the winning record, and its version. `None` when no tier held any
    /// record for the key.
    pub winner: Option<(Source, u64)>,
    /// The tiers written: behind the winner, or confirmed (see [`Cascade::reconcile`]).
    pub written: Vec<Source>,
    /// The tiers that could not be read or written, and why.
    pub errors: Vec<(Source, LayerError)>,
}

/// A local-first write could not be completed.
#[non_exhaustive]
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum OptimisticError {
    /// A tier could not be read or written, and the write was rolled back. `reverted` is
    /// `false` when a tier the write touched could not be restored. That tier keeps a
    /// pending record, which reconciliation will not choose while a confirmed one exists.
    Tier {
        /// The tier whose read or write failed.
        layer: Source,
        /// That tier's error.
        cause: LayerError,
        /// Whether every tier the write touched was restored to its own previous record.
        reverted: bool,
    },
    /// The newest version is `u64::MAX`, so the next version cannot be written. Nothing was
    /// written.
    VersionOverflow,
}

impl fmt::Display for OptimisticError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Tier {
                layer,
                cause,
                reverted,
            } => {
                write!(f, "write failed at {layer}: {cause}")?;
                if !reverted {
                    f.write_str(" (rollback incomplete)")?;
                }
                Ok(())
            }
            Self::VersionOverflow => {
                f.write_str("the newest version is u64::MAX, so the next version cannot be written")
            }
        }
    }
}

impl std::error::Error for OptimisticError {}

/// A write that reached every tier.
#[non_exhaustive]
#[derive(Debug, Clone, PartialEq)]
pub struct WriteOutcome<V> {
    /// The confirmed record, as written on every tier.
    pub record: Record<V>,
    /// Tiers that accepted the pending copy but not the confirmation. They keep the pending
    /// flag until a later [`Cascade::reconcile`] confirms them.
    pub unconfirmed: Vec<(Source, LayerError)>,
}

/// The three tiers, a clock, and the per-key time-to-live.
///
/// Reads run local, then edge, then cloud. The cloud is authoritative for "no record".
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
    /// A cascade over the three tiers, with a 30-second time-to-live for every key.
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

impl<V, L, E, C, K> Cascade<V, L, E, C, K>
where
    L: Layer<V>,
    E: Layer<V>,
    C: Layer<V>,
    K: Clock,
{
    /// Whether `record` is stale at `now`: older than its time-to-live, or stamped after
    /// `now`.
    fn is_stale(&self, key: &str, record: &Record<V>, now: u64) -> bool {
        record.updated_at > now || now - record.updated_at > self.ttl_for(key)
    }

    /// Builds the answer for a winning record, or `None` when it is a tombstone.
    fn answer(
        &self,
        key: &str,
        source: Source,
        record: Record<V>,
        skipped: Vec<(Source, LayerError)>,
        now: u64,
    ) -> Option<Fetched<V>> {
        let stale = self.is_stale(key, &record, now);
        let Record {
            value,
            version,
            updated_at,
            ..
        } = record;
        Some(Fetched {
            value: value?,
            source,
            version,
            updated_at,
            fetched_at: now,
            stale,
            skipped,
        })
    }

    async fn put_one(&self, source: Source, key: &str, record: Record<V>) -> Result<(), LayerError>
    where
        V: Clone,
    {
        match source {
            Source::Local => self.local.put(key, record).await,
            Source::Edge => self.edge.put(key, record).await,
            Source::Cloud => self.cloud.put(key, record).await,
        }
    }

    async fn write_back(
        &self,
        target: Source,
        key: &str,
        record: &Record<V>,
        from: Source,
    ) -> Result<bool, LayerError>
    where
        V: Clone + PartialEq,
    {
        match target {
            Source::Local => write_if_newer(&self.local, target, key, record, from).await,
            Source::Edge => write_if_newer(&self.edge, target, key, record, from).await,
            Source::Cloud => write_if_newer(&self.cloud, target, key, record, from).await,
        }
    }

    /// Reads `key`, local first.
    ///
    /// - **Within the time-to-live, local answers alone.** A fresh local record is returned
    ///   without asking the edge or the cloud. Staleness is bounded by the time-to-live, so
    ///   the cost is that another device's change becomes visible only once the local record
    ///   is older than the time-to-live.
    /// - **Otherwise the read keeps looking.** The edge is asked next, and the cloud after it
    ///   unless the edge already has a fresh record that sorts above the local one. A record
    ///   that sorts highest by version wins; a version tie goes to the more authoritative
    ///   tier. The read returns the first fresh winner it finds; if none is fresh, the
    ///   highest record found, stale.
    /// - **Write-back.** The winner is written to each faster tier that answered, and each
    ///   write re-reads its target first (see the crate docs). A write that fails is reported
    ///   in [`Fetched::skipped`], never dropped.
    /// - **A cloud miss is authoritative.** When the cloud answers "no record" and no tier
    ///   held a record, the result is `Ok(None)`, even if the local or edge tier failed on the
    ///   way. The cloud is the origin, so a record missing there is treated as absent.
    /// - **Tombstones.** A winning tombstone is written back like any record, then `Ok(None)`
    ///   is returned.
    ///
    /// # Errors
    ///
    /// Returns [`CascadeError`] only when no tier answered: the cloud failed and no tier
    /// held a record.
    pub async fn fetch(&self, key: &str) -> Result<Option<Fetched<V>>, CascadeError>
    where
        V: Clone + PartialEq,
    {
        let now = self.clock.now_ms();
        let mut errors = Vec::new();

        let local = settle(Source::Local, self.local.get(key).await, &mut errors);
        let mut best: Option<(Source, Record<V>)> = None;
        if let Some(Some(record)) = &local {
            if !self.is_stale(key, record, now) {
                return Ok(self.answer(key, Source::Local, record.clone(), errors, now));
            }
            consider(&mut best, Source::Local, record);
        }

        let edge = settle(Source::Edge, self.edge.get(key).await, &mut errors);
        if let Some(Some(record)) = &edge {
            consider(&mut best, Source::Edge, record);
        }

        let fresh_so_far = best
            .as_ref()
            .is_some_and(|(_, record)| !self.is_stale(key, record, now));
        let mut cloud: Read<V> = None;
        if !fresh_so_far {
            cloud = settle(Source::Cloud, self.cloud.get(key).await, &mut errors);
        }
        if let Some(Some(record)) = &cloud {
            consider(&mut best, Source::Cloud, record);
        }

        let Some((winner_source, winner)) = best else {
            // Nothing was found. A cloud miss is authoritative; a failed cloud leaves the read
            // unknown.
            return match cloud {
                Some(None) => Ok(None),
                _ => Err(CascadeError { errors }),
            };
        };

        let mut skipped = errors;
        let answered = |source: Source| match source {
            Source::Local => local.is_some(),
            Source::Edge => edge.is_some(),
            Source::Cloud => cloud.is_some(),
        };
        for target in faster_tiers(winner_source) {
            if !answered(*target) {
                continue;
            }
            if let Err(error) = self.write_back(*target, key, &winner, winner_source).await {
                skipped.push((*target, error));
            }
        }

        Ok(self.answer(key, winner_source, winner, skipped, now))
    }

    /// Brings all three tiers to the winning record for `key`.
    ///
    /// The winner is the record that sorts highest by the order `fetch` uses: a confirmed
    /// record beats a pending one, then the higher version wins, then the more authoritative
    /// tier. So a pending record is chosen only when no confirmed record exists anywhere.
    ///
    /// - A tier that does not hold the whole winning record, `updated_at` included, is
    ///   written through the same helper write-back uses. A tier that cannot be read is
    ///   skipped and reported, and is never written blind.
    /// - A tombstone is a record like any other, so a newer delete wins and is propagated.
    /// - When the winner is pending and every tier now holds it, every tier is rewritten as
    ///   confirmed. That is how an optimistic write that reached every tier loses its pending
    ///   flag. A tier whose copy changed meanwhile is left alone.
    ///
    /// The crate does not spawn this. The host schedules it, for example on a timer, when it
    /// comes online, or after a write.
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
        for (source, read) in [
            (Source::Local, &local),
            (Source::Edge, &edge),
            (Source::Cloud, &cloud),
        ] {
            if let Some(Some(record)) = read {
                consider(&mut best, source, record);
            }
        }
        let Some((winner_source, winner)) = best else {
            return report;
        };
        report.winner = Some((winner_source, winner.version));

        for (target, read) in [
            (Source::Local, &local),
            (Source::Edge, &edge),
            (Source::Cloud, &cloud),
        ] {
            let Some(current) = read else {
                continue;
            };
            if current.as_ref() == Some(&winner) {
                continue;
            }
            match self.write_back(target, key, &winner, winner_source).await {
                Ok(true) => report.written.push(target),
                Ok(false) => {}
                Err(error) => report.errors.push((target, error)),
            }
        }

        let all_readable = local.is_some() && edge.is_some() && cloud.is_some();
        if winner.pending && all_readable && report.errors.is_empty() {
            let confirmed = Record::from_parts(
                winner.value.clone(),
                winner.version,
                winner.updated_at,
                false,
            );
            for source in [Source::Local, Source::Edge, Source::Cloud] {
                match self.confirm_one(source, key, &winner, &confirmed).await {
                    Ok(true) => report.written.push(source),
                    Ok(false) => {}
                    Err(error) => report.errors.push((source, error)),
                }
            }
        }
        report
    }

    /// Confirms one tier, but only if it still holds exactly the pending winner.
    async fn confirm_one(
        &self,
        source: Source,
        key: &str,
        pending: &Record<V>,
        confirmed: &Record<V>,
    ) -> Result<bool, LayerError>
    where
        V: Clone + PartialEq,
    {
        let current = match source {
            Source::Local => self.local.get(key).await?,
            Source::Edge => self.edge.get(key).await?,
            Source::Cloud => self.cloud.get(key).await?,
        };
        if current.as_ref() != Some(pending) {
            return Ok(false);
        }
        self.put_one(source, key, confirmed.clone()).await?;
        Ok(true)
    }

    /// Writes `value` as a new version on every tier, local first. See
    /// [`Cascade::apply_optimistic`].
    pub async fn apply_optimistic(
        &self,
        key: &str,
        value: V,
    ) -> Result<WriteOutcome<V>, OptimisticError>
    where
        V: Clone,
    {
        self.write(key, Some(value)).await
    }

    /// Deletes `key`: writes a tombstone as a new version on every tier, local first.
    ///
    /// A tombstone keeps the key's version history, so a newer delete beats an older live
    /// copy on every tier, and a stale live copy cannot bring the record back. Tombstones are
    /// retained; this crate has no garbage collection for them.
    ///
    /// # Errors
    ///
    /// The same as [`Cascade::apply_optimistic`].
    pub async fn delete(&self, key: &str) -> Result<WriteOutcome<V>, OptimisticError>
    where
        V: Clone,
    {
        self.write(key, None).await
    }

    /// Reads every tier, then writes a new version on each, local first.
    ///
    /// The new version is one above the highest version any readable tier holds, so a
    /// reconciliation keeps this write instead of overwriting it, and a dirty pending copy
    /// from an earlier failed write is superseded rather than reused.
    ///
    /// Each tier is written pending. The write is rolled back if a tier fails: every tier
    /// that was attempted (including the one that failed, whose write may still have been
    /// applied) is restored to its own previous record, exactly, with a delete where it had
    /// none. Once every tier accepts the pending copy, each is rewritten as confirmed; a
    /// tier whose confirmation fails is reported in [`WriteOutcome::unconfirmed`].
    async fn write(&self, key: &str, value: Option<V>) -> Result<WriteOutcome<V>, OptimisticError>
    where
        V: Clone,
    {
        let snaps = [
            (Source::Local, self.local.get(key).await),
            (Source::Edge, self.edge.get(key).await),
            (Source::Cloud, self.cloud.get(key).await),
        ];
        let mut max_version: Option<u64> = None;
        let mut any_readable = false;
        let mut first_error: Option<(Source, LayerError)> = None;
        for (source, snap) in &snaps {
            match snap {
                Ok(Some(record)) => {
                    any_readable = true;
                    max_version =
                        Some(max_version.map_or(record.version, |m| m.max(record.version)));
                }
                Ok(None) => any_readable = true,
                Err(error) => {
                    if first_error.is_none() {
                        first_error = Some((*source, error.clone()));
                    }
                }
            }
        }
        if !any_readable {
            if let Some((layer, cause)) = first_error {
                return Err(OptimisticError::Tier {
                    layer,
                    cause,
                    reverted: true,
                });
            }
        }
        let version = match max_version {
            None => 1,
            Some(highest) => highest
                .checked_add(1)
                .ok_or(OptimisticError::VersionOverflow)?,
        };

        let now = self.clock.now_ms();
        let pending = Record::from_parts(value.clone(), version, now, true);
        let confirmed = Record::from_parts(value, version, now, false);

        let snap = |source: Source| {
            snaps
                .iter()
                .find(|(s, _)| *s == source)
                .map(|(_, snap)| snap)
                .cloned()
                .unwrap_or(Ok(None))
        };

        let mut attempted = Vec::new();
        for source in [Source::Local, Source::Edge, Source::Cloud] {
            attempted.push(source);
            if let Err(cause) = self.put_one(source, key, pending.clone()).await {
                let reverted = self.restore(key, &snap, &attempted).await;
                return Err(OptimisticError::Tier {
                    layer: source,
                    cause,
                    reverted,
                });
            }
        }

        let mut unconfirmed = Vec::new();
        for source in [Source::Local, Source::Edge, Source::Cloud] {
            if let Err(cause) = self.put_one(source, key, confirmed.clone()).await {
                unconfirmed.push((source, cause));
            }
        }
        Ok(WriteOutcome {
            record: confirmed,
            unconfirmed,
        })
    }

    /// Restores each attempted tier to the record it held before the write. Returns `false`
    /// when any tier could not be restored, including a tier that was never read.
    async fn restore(
        &self,
        key: &str,
        snap: &impl Fn(Source) -> Snap<V>,
        attempted: &[Source],
    ) -> bool
    where
        V: Clone,
    {
        let mut all = true;
        for source in attempted.iter().rev() {
            let restored = match snap(*source) {
                Err(_) => false,
                Ok(prev) => match source {
                    Source::Local => restore_tier(&self.local, key, &prev).await,
                    Source::Edge => restore_tier(&self.edge, key, &prev).await,
                    Source::Cloud => restore_tier(&self.cloud, key, &prev).await,
                },
            };
            if !restored {
                all = false;
            }
        }
        all
    }
}
