// GENERATED — DO NOT EDIT.
//
// Copied verbatim from components/registry/n5-resilience/mzizi-resilience.rs by scripts/generate-rust-components.mjs.
// That file is the one a human edits; this is the copy `cargo package` can ship,
// because a tarball only carries files under the crate root.
//
// Regenerate with `pnpm rust:generate`. CI runs `pnpm rust:generate:check`,
// which fails if this copy and its source have drifted.

//! Mzizi resilience (N5): the primitives composed into one pipeline, a health monitor, and
//! the fault hook the N8 chaos engine plugs into.
//!
//! The order, outermost first (documented, tested and the same in every build):
//!
//! ```text
//! FallbackChain( Retry( CircuitBreaker( RateLimiter( Timeout( Bulkhead( Fault( operation )))))))
//! ```
//!
//! - The primary stage is the whole inner pipeline; fallback stages run plain, each with its
//!   own optional timeout.
//! - Retry sees rejections (circuit open, rate limited, bulkhead full) as non-retryable, so
//!   an open circuit goes straight to the fallback.
//! - A `validate` hook, when set, runs on the operation's value inside the pipeline: a value
//!   that fails it is [`Error::Malformed`] (code `malformed`), counted by the breaker and
//!   retried.
//! - [`Fault`] is the chaos hook: a [`FaultInjector`] (the N8 chaos engine, or a fixed
//!   [`FaultSchedule`] in tests) decides a fault per invocation and [`apply_fault`] applies it.
//!
//! Every call reports to a [`HealthMonitor`] under the pipeline's name: `healthy` (the
//! primary served and the circuit is closed), `degraded` (a fallback served, or the circuit
//! is not closed), `error` (nothing served). Codes only: never a message, a URL or a payload.
//!
//! The TypeScript build is `mzizi-resilience.ts`; both are held to
//! `contracts/lib/mzizi-resilience.contract.json`.

use std::cell::{Cell, RefCell};
use std::collections::BTreeMap;
use std::fmt;
use std::future::Future;
use std::rc::Rc;

use crate::bulkhead::{Bulkhead, BulkheadConfig};
use crate::circuit_breaker::{CircuitBreaker, CircuitBreakerConfig, CircuitState};
use crate::fallback_chain::Stage;
use crate::rate_limiter::{RateLimiter, RateLimiterConfig};
use crate::resilience_core::{
    ConfigError, Error, ErrorCode, Runtime, StageError, check_min, check_name,
};
use crate::retry::{RetryPolicy, with_retry};
use crate::rng::{Mulberry32, Random};
use crate::timeout::with_timeout;

// ─── The fault hook (implemented by the N8 chaos engine) ───────────────────────

/// One injected fault.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Fault {
    /// Fail without running the operation.
    Error,
    /// Wait `ms`, then run it.
    Latency {
        /// In ms.
        ms: u64,
    },
    /// Hang until the Timeout layer's deadline cancels it.
    Timeout,
    /// The connection dropped: fail without running it.
    Drop,
    /// Run it and cut the value in half.
    Truncate,
    /// Run it and replace the value with a malformed one.
    Malformed,
}

/// A fault's kind, as [`Error::Chaos`] carries it.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum FaultKind {
    /// [`Fault::Error`].
    Error,
    /// [`Fault::Latency`].
    Latency,
    /// [`Fault::Timeout`].
    Timeout,
    /// [`Fault::Drop`].
    Drop,
    /// [`Fault::Truncate`].
    Truncate,
    /// [`Fault::Malformed`].
    Malformed,
}

impl FaultKind {
    /// `error`, `latency`, `timeout`, `drop`, `truncate` or `malformed`.
    pub const fn as_str(self) -> &'static str {
        match self {
            FaultKind::Error => "error",
            FaultKind::Latency => "latency",
            FaultKind::Timeout => "timeout",
            FaultKind::Drop => "drop",
            FaultKind::Truncate => "truncate",
            FaultKind::Malformed => "malformed",
        }
    }
}

impl Fault {
    /// The fault's kind.
    pub const fn kind(&self) -> FaultKind {
        match self {
            Fault::Error => FaultKind::Error,
            Fault::Latency { .. } => FaultKind::Latency,
            Fault::Timeout => FaultKind::Timeout,
            Fault::Drop => FaultKind::Drop,
            Fault::Truncate => FaultKind::Truncate,
            Fault::Malformed => FaultKind::Malformed,
        }
    }
}

/// Decides the fault for each invocation (`None`: none). The N8 chaos engine implements it.
pub trait FaultInjector {
    /// The fault for the next invocation.
    fn decide(&mut self) -> Option<Fault>;
}

/// A fixed schedule: entry i is the fault for invocation i; past the end, none. For
/// deterministic tests; seeded random chaos is the N8 engine's.
#[derive(Debug, Clone, Default)]
pub struct FaultSchedule {
    schedule: Vec<Option<Fault>>,
    index: usize,
}

impl FaultSchedule {
    /// A schedule.
    pub fn new(schedule: Vec<Option<Fault>>) -> Self {
        FaultSchedule { schedule, index: 0 }
    }
}

impl FaultInjector for FaultSchedule {
    fn decide(&mut self) -> Option<Fault> {
        let fault = self.schedule.get(self.index).copied().flatten();
        self.index += 1;
        fault
    }
}

/// Which mutation a `mutate` hook is asked for.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum MutateKind {
    /// Cut the value.
    Truncate,
    /// Make the value malformed.
    Malformed,
}

/// The malformed marker the TypeScript build returns for a `malformed` fault with no hook.
pub const MALFORMED_MARKER: &str = "{\"mzizi-chaos\":";

/// The first `floor(n / 2)` characters of a string of `n` characters.
pub fn truncate_str(s: &str) -> String {
    let half = s.chars().count() / 2;
    s.chars().take(half).collect()
}

/// The first `floor(len / 2)` items.
pub fn truncate_vec<T>(mut v: Vec<T>) -> Vec<T> {
    let half = v.len() / 2;
    v.truncate(half);
    v
}

/// Apply one fault to one invocation of `op`.
///
/// - `None`: run `op`.
/// - `Error` / `Drop`: [`Error::Chaos`] without running `op`.
/// - `Latency`: sleep `ms`, then run `op`.
/// - `Timeout`: never complete (the Timeout layer's deadline drops it).
/// - `Truncate` / `Malformed`: run `op`, then pass the value through `mutate`. With no hook,
///   `Truncate` is [`Error::Chaos`] and `Malformed` is [`Error::Malformed`] (Rust has no
///   generic marker for `T`; [`truncate_str`], [`truncate_vec`] and [`MALFORMED_MARKER`]
///   build the TypeScript defaults).
pub async fn apply_fault<R, T, E, F, Fut>(
    rt: &R,
    fault: Option<Fault>,
    op: F,
    mutate: Option<&dyn Fn(T, MutateKind) -> T>,
) -> Result<T, Error<E>>
where
    R: Runtime + ?Sized,
    F: FnOnce() -> Fut,
    Fut: Future<Output = Result<T, Error<E>>>,
{
    let Some(fault) = fault else {
        return op().await;
    };
    match fault {
        Fault::Error | Fault::Drop => Err(Error::Chaos { kind: fault.kind() }),
        Fault::Latency { ms } => {
            rt.sleep(ms).await;
            op().await
        }
        Fault::Timeout => std::future::pending().await,
        Fault::Truncate => {
            let value = op().await?;
            match mutate {
                Some(m) => Ok(m(value, MutateKind::Truncate)),
                None => Err(Error::Chaos {
                    kind: FaultKind::Truncate,
                }),
            }
        }
        Fault::Malformed => {
            let value = op().await?;
            match mutate {
                Some(m) => Ok(m(value, MutateKind::Malformed)),
                None => Err(Error::Malformed),
            }
        }
    }
}

// ─── Health ───────────────────────────────────────────────────────────────────

/// A section's or dependency's health.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum HealthStatus {
    /// The primary served and the circuit is closed.
    Healthy,
    /// A fallback served, or the circuit is not closed.
    Degraded,
    /// Nothing served.
    Error,
    /// Not reported yet.
    Loading,
}

impl HealthStatus {
    /// `healthy`, `degraded`, `error` or `loading`.
    pub const fn as_str(self) -> &'static str {
        match self {
            HealthStatus::Healthy => "healthy",
            HealthStatus::Degraded => "degraded",
            HealthStatus::Error => "error",
            HealthStatus::Loading => "loading",
        }
    }

    const fn severity(self) -> u8 {
        match self {
            HealthStatus::Healthy => 0,
            HealthStatus::Loading => 1,
            HealthStatus::Degraded => 2,
            HealthStatus::Error => 3,
        }
    }
}

/// The worst of a set of statuses: error > degraded > loading > healthy; none → loading.
pub fn worst_health(statuses: impl IntoIterator<Item = HealthStatus>) -> HealthStatus {
    statuses
        .into_iter()
        .max_by_key(|s| s.severity())
        .unwrap_or(HealthStatus::Loading)
}

/// One report. Codes only: no messages, URLs or payloads.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct HealthReport {
    /// The section or dependency.
    pub name: String,
    /// Its status.
    pub status: HealthStatus,
    /// Calls whose primary path failed.
    pub error_count: u64,
    /// The last failure's code.
    pub last_error_code: Option<String>,
    /// The breaker's state, if it has one.
    pub circuit_state: Option<CircuitState>,
    /// `primary`, a fallback stage's name, or `none`.
    pub source: String,
    /// When last updated, in ms.
    pub updated_at: u64,
}

/// A partial update for [`HealthMonitor::report`]; `None` keeps the current value.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct HealthUpdate {
    /// New status.
    pub status: Option<HealthStatus>,
    /// New error count.
    pub error_count: Option<u64>,
    /// New last error code (`Some(None)` clears it).
    pub last_error_code: Option<Option<String>>,
    /// New circuit state (`Some(None)` clears it).
    pub circuit_state: Option<Option<CircuitState>>,
    /// New source.
    pub source: Option<String>,
}

/// Aggregates health reports by name.
#[derive(Debug, Clone, Default)]
pub struct HealthMonitor {
    reports: BTreeMap<String, HealthReport>,
}

impl HealthMonitor {
    /// An empty monitor.
    pub fn new() -> Self {
        Self::default()
    }

    /// Merge `update` into `name`'s report at `now`.
    pub fn report(&mut self, name: &str, update: HealthUpdate, now: u64) -> &HealthReport {
        let r = self
            .reports
            .entry(name.to_owned())
            .or_insert_with(|| HealthReport {
                name: name.to_owned(),
                status: HealthStatus::Loading,
                error_count: 0,
                last_error_code: None,
                circuit_state: None,
                source: "none".to_owned(),
                updated_at: 0,
            });
        if let Some(s) = update.status {
            r.status = s;
        }
        if let Some(c) = update.error_count {
            r.error_count = c;
        }
        if let Some(c) = update.last_error_code {
            r.last_error_code = c;
        }
        if let Some(c) = update.circuit_state {
            r.circuit_state = c;
        }
        if let Some(s) = update.source {
            r.source = s;
        }
        r.updated_at = now;
        r
    }

    /// `name` failed with `code`: status `error`, one more error.
    pub fn record_error(&mut self, name: &str, code: &str, now: u64) -> &HealthReport {
        let count = self.get(name).map_or(0, |r| r.error_count) + 1;
        self.report(
            name,
            HealthUpdate {
                status: Some(HealthStatus::Error),
                error_count: Some(count),
                last_error_code: Some(Some(crate::resilience_core::safe_code(code).into_owned())),
                source: Some("none".to_owned()),
                ..HealthUpdate::default()
            },
            now,
        )
    }

    /// `name` recovered: status `healthy`.
    pub fn record_recovery(&mut self, name: &str, now: u64) -> &HealthReport {
        self.report(
            name,
            HealthUpdate {
                status: Some(HealthStatus::Healthy),
                source: Some("primary".to_owned()),
                ..HealthUpdate::default()
            },
            now,
        )
    }

    /// Stop tracking `name`.
    pub fn remove(&mut self, name: &str) {
        self.reports.remove(name);
    }

    /// `name`'s report.
    pub fn get(&self, name: &str) -> Option<&HealthReport> {
        self.reports.get(name)
    }

    /// Every report, by name.
    pub fn reports(&self) -> impl Iterator<Item = &HealthReport> {
        self.reports.values()
    }

    /// The worst status across every report (none → loading).
    pub fn system_health(&self) -> HealthStatus {
        worst_health(self.reports.values().map(|r| r.status))
    }
}

// ─── The composed pipeline ─────────────────────────────────────────────────────

/// Which layers a pipeline has, and their numbers.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ResilienceConfig {
    /// The pipeline's name: the health report's name.
    pub name: String,
    /// Timeout layer, in ms (default `Some(10000)`).
    pub timeout_ms: Option<u64>,
    /// Retry layer (default on, with the retry defaults).
    pub retry: Option<RetryPolicy>,
    /// Circuit breaker layer (default on, with the breaker defaults).
    pub circuit_breaker: Option<CircuitBreakerConfig>,
    /// Rate limiter layer (default off).
    pub rate_limiter: Option<RateLimiterConfig>,
    /// Bulkhead layer (default off).
    pub bulkhead: Option<BulkheadConfig>,
}

impl ResilienceConfig {
    /// The defaults, named `name`.
    pub fn new(name: impl Into<String>) -> Self {
        let name = name.into();
        ResilienceConfig {
            circuit_breaker: Some(CircuitBreakerConfig::new(name.clone())),
            name,
            timeout_ms: Some(10_000),
            retry: Some(RetryPolicy::default()),
            rate_limiter: None,
            bulkhead: None,
        }
    }
}

/// What one call returned, and how.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Outcome<T> {
    /// The value.
    pub value: T,
    /// `primary` or the fallback stage that served.
    pub source: String,
    /// Attempts the primary made.
    pub attempts: u32,
    /// The breaker's state after the call.
    pub circuit_state: Option<CircuitState>,
}

/// A summary of the most recent call, served or not (see [`Resilience::last_call`]).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CallSummary {
    /// `primary`, a stage name, or `None` when nothing served.
    pub source: Option<String>,
    /// Attempts the primary made.
    pub attempts: u32,
    /// The returned error's code, when nothing served.
    pub code: Option<String>,
}

struct SharedRandom<'r, 'a>(&'r RefCell<Box<dyn Random + 'a>>);

impl Random for SharedRandom<'_, '_> {
    fn next_u32(&mut self) -> u32 {
        self.0.borrow_mut().next_u32()
    }
}

/// The `validate` hook.
type Validator<'a, T> = Box<dyn Fn(&T) -> bool + 'a>;
/// The `mutate` hook.
type Mutator<'a, T> = Box<dyn Fn(T, MutateKind) -> T + 'a>;

/// A composed pipeline. Its breaker, limiter and bulkhead keep their state across calls.
/// Single-threaded: interior `RefCell`s, never held across an await.
pub struct Resilience<'a, T, E> {
    name: String,
    timeout_ms: Option<u64>,
    retry: Option<RetryPolicy>,
    breaker: Option<CircuitBreaker>,
    limiter: Option<RateLimiter>,
    bulkhead: Option<Bulkhead>,
    fallbacks: Vec<Stage<'a, T, E>>,
    validate: Option<Validator<'a, T>>,
    mutate: Option<Mutator<'a, T>>,
    faults: Option<RefCell<Box<dyn FaultInjector + 'a>>>,
    random: RefCell<Box<dyn Random + 'a>>,
    health: Rc<RefCell<HealthMonitor>>,
    last: RefCell<Option<CallSummary>>,
}

impl<T, E> fmt::Debug for Resilience<'_, T, E> {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_struct("Resilience")
            .field("name", &self.name)
            .field("timeout_ms", &self.timeout_ms)
            .field("retry", &self.retry)
            .field("fallbacks", &self.fallbacks)
            .finish_non_exhaustive()
    }
}

const RESERVED_STAGES: [&str; 2] = ["primary", "none"];

impl<'a, T, E> Resilience<'a, T, E> {
    /// A pipeline, or the config error. Retry jitter draws from `Mulberry32::new(0)` until
    /// [`Resilience::with_random`] gives it a seeded-from-entropy generator.
    pub fn new(config: ResilienceConfig) -> Result<Self, ConfigError> {
        check_name("name", &config.name)?;
        if let Some(ms) = config.timeout_ms {
            check_min("timeout_ms", ms, 1)?;
        }
        if let Some(r) = &config.retry {
            r.validate()?;
        }
        Ok(Resilience {
            name: config.name,
            timeout_ms: config.timeout_ms,
            retry: config.retry,
            breaker: config
                .circuit_breaker
                .map(CircuitBreaker::new)
                .transpose()?,
            limiter: config.rate_limiter.map(RateLimiter::new).transpose()?,
            bulkhead: config.bulkhead.map(Bulkhead::new).transpose()?,
            fallbacks: Vec::new(),
            validate: None,
            mutate: None,
            faults: None,
            random: RefCell::new(Box::new(Mulberry32::new(0))),
            health: Rc::new(RefCell::new(HealthMonitor::new())),
            last: RefCell::new(None),
        })
    }

    /// Add a fallback stage after the primary (names `primary` and `none` are reserved).
    pub fn with_fallback(mut self, stage: Stage<'a, T, E>) -> Result<Self, ConfigError> {
        stage.validate()?;
        if RESERVED_STAGES.contains(&stage.name.as_str()) {
            return Err(ConfigError::new(
                "fallbacks[].name",
                format!("may not be \"{}\" (reserved)", stage.name),
            ));
        }
        self.fallbacks.push(stage);
        Ok(self)
    }

    /// Check each value; `false` is [`Error::Malformed`].
    #[must_use]
    pub fn with_validate(mut self, validate: impl Fn(&T) -> bool + 'a) -> Self {
        self.validate = Some(Box::new(validate));
        self
    }

    /// Apply `truncate` and `malformed` faults to a value.
    #[must_use]
    pub fn with_mutate(mut self, mutate: impl Fn(T, MutateKind) -> T + 'a) -> Self {
        self.mutate = Some(Box::new(mutate));
        self
    }

    /// The chaos hook.
    #[must_use]
    pub fn with_faults(mut self, faults: impl FaultInjector + 'a) -> Self {
        self.faults = Some(RefCell::new(Box::new(faults)));
        self
    }

    /// Randomness for retry jitter.
    #[must_use]
    pub fn with_random(mut self, random: impl Random + 'a) -> Self {
        self.random = RefCell::new(Box::new(random));
        self
    }

    /// Report to a shared monitor (default: the pipeline's own).
    #[must_use]
    pub fn with_health(mut self, health: Rc<RefCell<HealthMonitor>>) -> Self {
        self.health = health;
        self
    }

    /// The pipeline's name.
    pub fn name(&self) -> &str {
        &self.name
    }

    /// The monitor it reports to.
    pub fn health(&self) -> Rc<RefCell<HealthMonitor>> {
        Rc::clone(&self.health)
    }

    /// The breaker, if it has one.
    pub fn breaker(&self) -> Option<&CircuitBreaker> {
        self.breaker.as_ref()
    }

    /// The rate limiter, if it has one.
    pub fn limiter(&self) -> Option<&RateLimiter> {
        self.limiter.as_ref()
    }

    /// The bulkhead, if it has one.
    pub fn bulkhead(&self) -> Option<&Bulkhead> {
        self.bulkhead.as_ref()
    }

    /// The most recent completed call.
    pub fn last_call(&self) -> Option<CallSummary> {
        self.last.borrow().clone()
    }
}

impl<T, E: ErrorCode> Resilience<'_, T, E> {
    /// Run `op` through the pipeline: the value and how it was served, or the error.
    pub async fn execute<R, F, Fut>(&self, rt: &R, op: F) -> Result<Outcome<T>, Error<E>>
    where
        R: Runtime + ?Sized,
        F: Fn() -> Fut,
        Fut: Future<Output = Result<T, Error<E>>>,
    {
        let attempts = Cell::new(0u32);
        let primary = self.primary(rt, &op, &attempts).await;

        let (served, primary_code) = match primary {
            Ok(v) => (Ok((v, "primary".to_owned())), None),
            Err(e) if self.fallbacks.is_empty() => {
                let code = e.code().into_owned();
                (Err(e), Some(code))
            }
            Err(e) => {
                let code = e.code().into_owned();
                let mut stage_errors = vec![StageError {
                    stage: "primary".to_owned(),
                    code: code.clone(),
                }];
                let mut served = None;
                for stage in &self.fallbacks {
                    match stage.run(rt).await {
                        Ok(v) => {
                            served = Some((v, stage.name.clone()));
                            break;
                        }
                        Err(se) => stage_errors.push(StageError {
                            stage: stage.name.clone(),
                            code: se.code().into_owned(),
                        }),
                    }
                }
                match served {
                    Some(s) => (Ok(s), Some(code)),
                    None => (Err(Error::AllStagesFailed { stage_errors }), Some(code)),
                }
            }
        };

        let now = rt.now_ms();
        let circuit_state = self.breaker.as_ref().map(|b| b.state(now));
        let mut health = self.health.borrow_mut();
        let existing = health.get(&self.name).cloned();
        let errors = existing.as_ref().map_or(0, |r| r.error_count);
        let attempts = attempts.get();
        match served {
            Ok((value, source)) => {
                let primary_served = source == "primary";
                let status = if primary_served
                    && matches!(circuit_state, None | Some(CircuitState::Closed))
                {
                    HealthStatus::Healthy
                } else {
                    HealthStatus::Degraded
                };
                health.report(
                    &self.name,
                    HealthUpdate {
                        status: Some(status),
                        error_count: Some(errors + u64::from(!primary_served)),
                        last_error_code: if primary_served {
                            None
                        } else {
                            Some(primary_code)
                        },
                        circuit_state: Some(circuit_state),
                        source: Some(source.clone()),
                    },
                    now,
                );
                *self.last.borrow_mut() = Some(CallSummary {
                    source: Some(source.clone()),
                    attempts,
                    code: None,
                });
                Ok(Outcome {
                    value,
                    source,
                    attempts,
                    circuit_state,
                })
            }
            Err(e) => {
                health.report(
                    &self.name,
                    HealthUpdate {
                        status: Some(HealthStatus::Error),
                        error_count: Some(errors + 1),
                        last_error_code: Some(primary_code),
                        circuit_state: Some(circuit_state),
                        source: Some("none".to_owned()),
                    },
                    now,
                );
                *self.last.borrow_mut() = Some(CallSummary {
                    source: None,
                    attempts,
                    code: Some(e.code().into_owned()),
                });
                Err(e)
            }
        }
    }

    /// Run `op` through the pipeline: the value, or the error.
    pub async fn run<R, F, Fut>(&self, rt: &R, op: F) -> Result<T, Error<E>>
    where
        R: Runtime + ?Sized,
        F: Fn() -> Fut,
        Fut: Future<Output = Result<T, Error<E>>>,
    {
        self.execute(rt, op).await.map(|o| o.value)
    }

    async fn primary<R, F, Fut>(&self, rt: &R, op: &F, attempts: &Cell<u32>) -> Result<T, Error<E>>
    where
        R: Runtime + ?Sized,
        F: Fn() -> Fut,
        Fut: Future<Output = Result<T, Error<E>>>,
    {
        match &self.retry {
            None => {
                attempts.set(1);
                self.guarded(rt, op).await
            }
            Some(policy) => {
                let mut random = SharedRandom(&self.random);
                with_retry(rt, policy, &mut random, move |attempt| {
                    attempts.set(attempt);
                    self.guarded(rt, op)
                })
                .await
            }
        }
    }

    /// CircuitBreaker( RateLimiter( … ) ).
    async fn guarded<R, F, Fut>(&self, rt: &R, op: &F) -> Result<T, Error<E>>
    where
        R: Runtime + ?Sized,
        F: Fn() -> Fut,
        Fut: Future<Output = Result<T, Error<E>>>,
    {
        let limited = move || self.limited(rt, op);
        match &self.breaker {
            Some(b) => b.execute(rt, limited).await,
            None => limited().await,
        }
    }

    /// RateLimiter( Timeout( … ) ).
    async fn limited<R, F, Fut>(&self, rt: &R, op: &F) -> Result<T, Error<E>>
    where
        R: Runtime + ?Sized,
        F: Fn() -> Fut,
        Fut: Future<Output = Result<T, Error<E>>>,
    {
        let timed = move || self.timed(rt, op);
        match &self.limiter {
            Some(l) => l.execute(rt, timed).await,
            None => timed().await,
        }
    }

    /// Timeout( Bulkhead( … ) ).
    async fn timed<R, F, Fut>(&self, rt: &R, op: &F) -> Result<T, Error<E>>
    where
        R: Runtime + ?Sized,
        F: Fn() -> Fut,
        Fut: Future<Output = Result<T, Error<E>>>,
    {
        let inner = self.bulkheaded(rt, op);
        match self.timeout_ms {
            Some(ms) => with_timeout(rt, ms, inner).await,
            None => inner.await,
        }
    }

    /// Bulkhead( Fault( operation ) ), then validate.
    async fn bulkheaded<R, F, Fut>(&self, rt: &R, op: &F) -> Result<T, Error<E>>
    where
        R: Runtime + ?Sized,
        F: Fn() -> Fut,
        Fut: Future<Output = Result<T, Error<E>>>,
    {
        let faulted = move || self.faulted(rt, op);
        match &self.bulkhead {
            Some(b) => b.execute(rt, faulted).await,
            None => faulted().await,
        }
    }

    async fn faulted<R, F, Fut>(&self, rt: &R, op: &F) -> Result<T, Error<E>>
    where
        R: Runtime + ?Sized,
        F: Fn() -> Fut,
        Fut: Future<Output = Result<T, Error<E>>>,
    {
        let fault = self.faults.as_ref().and_then(|f| f.borrow_mut().decide());
        let mutate: Option<&dyn Fn(T, MutateKind) -> T> = match &self.mutate {
            Some(m) => Some(m.as_ref()),
            None => None,
        };
        let value = apply_fault(rt, fault, op, mutate).await?;
        if let Some(validate) = &self.validate {
            if !validate(&value) {
                return Err(Error::Malformed);
            }
        }
        Ok(value)
    }
}
