//! Mzizi N8 assurance — seeded, scheduled fault injection that cannot run in
//! production.
//!
//! The Rust build of `chaos`, held to the same contract
//! (`contracts/lib/chaos.contract.json`) and the same fixture
//! (`__tests__/fixtures/resilience/chaos.cases.json`) as the `.ts` sibling: the
//! same options give the same sequence of decisions in both.
//!
//! [`ChaosEngine`] decides, per invocation, whether an operation gets a fault and
//! which. It is sans-IO: it never sleeps, never reads a clock and never reads
//! ambient randomness. The host applies the decision (waits for
//! [`Fault::Latency`], drops the future for [`Fault::Timeout`], and so on), or
//! hands the engine to the N5 resilience pipeline as its [`FaultInjector`].
//!
//! # The production guard
//!
//! Hard, with no override. [`ChaosEngine::new`] refuses an enabled configuration
//! with [`ChaosBuildError::Forbidden`] when [`is_production_environment`] says
//! production: the host passed [`Environment::Production`], or it passed no
//! environment at all and this is a release build (`cfg!(not(debug_assertions))`).
//! A host that runs chaos in an optimised staging build says so explicitly with a
//! non-production [`Environment`]. [`ChaosEngine::decide`] checks again on every
//! call.

use std::fmt;

/// One injected fault, as the N5 resilience pipeline applies it.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Fault {
    /// Fail with a chaos error, without running the operation.
    Error,
    /// Wait this many milliseconds, then run the operation.
    Latency {
        /// How long to wait.
        ms: u64,
    },
    /// Hang until cancelled.
    Timeout,
    /// The connection dropped: fail with a chaos error.
    Drop,
    /// Cut the result to half its length.
    Truncate,
    /// Replace the result with [`MALFORMED_MARKER`].
    Malformed,
}

impl Fault {
    /// The wire spelling of the fault's kind.
    #[must_use]
    pub const fn kind(self) -> FaultKind {
        match self {
            Self::Error => FaultKind::Error,
            Self::Latency { .. } => FaultKind::Latency,
            Self::Timeout => FaultKind::Timeout,
            Self::Drop => FaultKind::Drop,
            Self::Truncate => FaultKind::Truncate,
            Self::Malformed => FaultKind::Malformed,
        }
    }
}

/// Anything that decides, per invocation, whether to inject a fault.
pub trait FaultInjector {
    /// The fault for the next invocation, or `None`.
    fn decide(&mut self) -> Option<Fault>;
}

/// The mulberry32 generator, exactly as the resilience spec pins it.
#[derive(Debug, Clone)]
pub struct Mulberry32 {
    state: u32,
}

impl Mulberry32 {
    /// A generator seeded with `seed`.
    #[must_use]
    pub const fn new(seed: u32) -> Self {
        Self { state: seed }
    }

    /// The next unsigned 32-bit output.
    pub fn next_u32(&mut self) -> u32 {
        self.state = self.state.wrapping_add(0x6D2B_79F5);
        let mut t = self.state;
        t = (t ^ (t >> 15)).wrapping_mul(t | 1);
        t = (t.wrapping_add((t ^ (t >> 7)).wrapping_mul(t | 61))) ^ t;
        t ^ (t >> 14)
    }
}

/// The kind of a fault, without its parameters.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum FaultKind {
    /// See [`Fault::Error`].
    Error,
    /// See [`Fault::Latency`].
    Latency,
    /// See [`Fault::Timeout`].
    Timeout,
    /// See [`Fault::Drop`].
    Drop,
    /// See [`Fault::Truncate`].
    Truncate,
    /// See [`Fault::Malformed`].
    Malformed,
}

impl FaultKind {
    /// The wire spelling, matching the `.ts` string union.
    #[must_use]
    pub const fn as_str(self) -> &'static str {
        match self {
            Self::Error => "error",
            Self::Latency => "latency",
            Self::Timeout => "timeout",
            Self::Drop => "drop",
            Self::Truncate => "truncate",
            Self::Malformed => "malformed",
        }
    }

    /// Parse the wire spelling.
    #[must_use]
    pub fn parse(s: &str) -> Option<Self> {
        Some(match s {
            "error" => Self::Error,
            "latency" => Self::Latency,
            "timeout" => Self::Timeout,
            "drop" => Self::Drop,
            "truncate" => Self::Truncate,
            "malformed" => Self::Malformed,
            _ => return None,
        })
    }
}

/// Where the host is running. Only [`Environment::Production`] forbids chaos.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Environment {
    /// Production. Chaos is forbidden.
    Production,
    /// Staging, preview, beta.
    Staging,
    /// A developer's machine.
    Development,
    /// A test run.
    Test,
}

impl Environment {
    /// Parse a host's environment name. `production`/`prod` (any case) are
    /// production; `staging`, `development`/`dev`, `test` are the others.
    #[must_use]
    pub fn parse(name: &str) -> Option<Self> {
        Some(match name.trim().to_ascii_lowercase().as_str() {
            "production" | "prod" => Self::Production,
            "staging" | "preview" | "beta" => Self::Staging,
            "development" | "dev" => Self::Development,
            "test" => Self::Test,
            _ => return None,
        })
    }
}

/// Whether chaos must treat this as production.
///
/// The host's word when it gives one; otherwise a release build is production.
/// `Some(Environment::Production)` is production even in a debug build.
#[must_use]
pub const fn is_production_environment(environment: Option<Environment>) -> bool {
    match environment {
        Some(Environment::Production) => true,
        Some(_) => false,
        None => cfg!(not(debug_assertions)),
    }
}

/// A fault and how often it fires.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct FaultSpec {
    /// Which fault.
    pub kind: FaultKind,
    /// Chance per invocation, in `[0, 1]`.
    pub rate: f64,
    /// Lower latency bound, ms (latency only).
    pub min_ms: u64,
    /// Upper latency bound, ms, inclusive (latency only).
    pub max_ms: u64,
}

impl FaultSpec {
    /// A fault with no parameters.
    #[must_use]
    pub const fn new(kind: FaultKind, rate: f64) -> Self {
        Self {
            kind,
            rate,
            min_ms: 0,
            max_ms: 0,
        }
    }

    /// A latency fault drawing `min_ms..=max_ms`.
    #[must_use]
    pub const fn latency(rate: f64, min_ms: u64, max_ms: u64) -> Self {
        Self {
            kind: FaultKind::Latency,
            rate,
            min_ms,
            max_ms,
        }
    }
}

/// How chaos is configured.
#[derive(Debug, Clone, PartialEq, Default)]
pub struct ChaosConfig {
    /// Master switch. Off, nothing is injected.
    pub enabled: bool,
    /// mulberry32 seed.
    pub seed: u32,
    /// Faults in order; rates sum to at most 1.
    pub faults: Vec<FaultSpec>,
    /// Explicit decisions: entry i is invocation i's fault. Used up first.
    pub schedule: Vec<Option<Fault>>,
    /// The host's environment. `None` means "production if a release build".
    pub environment: Option<Environment>,
}

/// The n2 defaults: a 30% error rate, latency 100..=500 ms otherwise.
pub const LEGACY_ERROR_RATE: f64 = 0.3;
/// The n2 default latency range.
pub const LEGACY_LATENCY_MS: (u64, u64) = (100, 500);

impl ChaosConfig {
    /// The n2 `{ enabled, errorRate, latencyMs }` configuration:
    /// `[error @ error_rate, latency @ 1 - error_rate within latency_ms]`.
    #[must_use]
    pub fn legacy(enabled: bool, error_rate: f64, latency_ms: (u64, u64)) -> Self {
        Self {
            enabled,
            faults: vec![
                FaultSpec::new(FaultKind::Error, error_rate),
                FaultSpec::latency(1.0 - error_rate, latency_ms.0, latency_ms.1),
            ],
            ..Self::default()
        }
    }

    /// Check the configuration.
    ///
    /// # Errors
    ///
    /// [`ConfigError`] naming the first problem: a rate outside `[0, 1]` (or not
    /// finite), rates summing above 1, or a latency range with `min_ms > max_ms`.
    pub fn validate(&self) -> Result<(), ConfigError> {
        let mut sum = 0.0;
        for (i, fault) in self.faults.iter().enumerate() {
            if !(fault.rate.is_finite() && (0.0..=1.0).contains(&fault.rate)) {
                return Err(ConfigError(format!("faults[{i}]: rate must be in [0, 1]")));
            }
            if fault.kind == FaultKind::Latency && fault.min_ms > fault.max_ms {
                return Err(ConfigError(format!("faults[{i}]: minMs is above maxMs")));
            }
            sum += fault.rate;
        }
        if sum > 1.0 + 1e-9 {
            return Err(ConfigError("fault rates sum to more than 1".to_owned()));
        }
        Ok(())
    }
}

/// The configuration is invalid. Code `config`.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ConfigError(pub String);

impl ConfigError {
    /// The stable code.
    pub const CODE: &'static str = "config";
}

impl fmt::Display for ConfigError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(&self.0)
    }
}

impl std::error::Error for ConfigError {}

/// Chaos was enabled in production. Code `chaos-forbidden`.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct ChaosForbiddenError;

impl ChaosForbiddenError {
    /// The stable code.
    pub const CODE: &'static str = "chaos-forbidden";
}

impl fmt::Display for ChaosForbiddenError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str("Chaos is forbidden in production; there is no override")
    }
}

impl std::error::Error for ChaosForbiddenError {}

/// Why an engine could not be built.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ChaosBuildError {
    /// Enabled in production.
    Forbidden(ChaosForbiddenError),
    /// The configuration is invalid.
    Config(ConfigError),
}

impl ChaosBuildError {
    /// The stable code: `chaos-forbidden` or `config`.
    #[must_use]
    pub const fn code(&self) -> &'static str {
        match self {
            Self::Forbidden(_) => ChaosForbiddenError::CODE,
            Self::Config(_) => ConfigError::CODE,
        }
    }
}

impl fmt::Display for ChaosBuildError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Forbidden(e) => e.fmt(f),
            Self::Config(e) => e.fmt(f),
        }
    }
}

impl std::error::Error for ChaosBuildError {}

/// An injected failure. Code `chaos`; `kind` says which fault.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct ChaosError {
    /// Which fault produced it.
    pub kind: FaultKind,
}

impl ChaosError {
    /// The stable code.
    pub const CODE: &'static str = "chaos";
}

impl fmt::Display for ChaosError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "Chaos {} injected", self.kind.as_str())
    }
}

impl std::error::Error for ChaosError {}

/// `floor(p * 2^32)`, capped at 2^32 so p = 1 means always.
fn threshold(p: f64) -> u64 {
    const TWO_POW_32: f64 = 4_294_967_296.0;
    let t = (p * TWO_POW_32).floor();
    if t >= TWO_POW_32 {
        1 << 32
    } else if t <= 0.0 {
        0
    } else {
        // In range by the checks above.
        t as u64
    }
}

/// Decides faults, one invocation at a time.
///
/// Per invocation: a remaining schedule entry wins. Otherwise draw
/// `u = next_u32()` and walk the faults in order with cumulative thresholds
/// `floor(cum_rate * 2^32)`; the first with `u < threshold` fires. A latency
/// fault draws once more: `ms = min_ms + next_u32() % (max_ms - min_ms + 1)`. No
/// fault, no second draw. A disabled engine decides `None` without drawing.
#[derive(Debug, Clone)]
pub struct ChaosEngine {
    config: ChaosConfig,
    thresholds: Vec<u64>,
    rng: Mulberry32,
    position: usize,
}

impl ChaosEngine {
    /// Build an engine.
    ///
    /// # Errors
    ///
    /// [`ChaosBuildError::Forbidden`] when `enabled` and
    /// [`is_production_environment`]; [`ChaosBuildError::Config`] when the
    /// configuration is invalid.
    pub fn new(config: ChaosConfig) -> Result<Self, ChaosBuildError> {
        if config.enabled && is_production_environment(config.environment) {
            return Err(ChaosBuildError::Forbidden(ChaosForbiddenError));
        }
        config.validate().map_err(ChaosBuildError::Config)?;
        let mut cum = 0.0;
        let thresholds = config
            .faults
            .iter()
            .map(|f| {
                cum += f.rate;
                threshold(cum)
            })
            .collect();
        let rng = Mulberry32::new(config.seed);
        Ok(Self {
            config,
            thresholds,
            rng,
            position: 0,
        })
    }

    /// How many decisions this engine has made.
    #[must_use]
    pub const fn invocations(&self) -> usize {
        self.position
    }

    /// The configuration it was built from.
    #[must_use]
    pub const fn config(&self) -> &ChaosConfig {
        &self.config
    }

    /// The fault for the next invocation.
    pub fn decide(&mut self) -> Option<Fault> {
        if !self.config.enabled || is_production_environment(self.config.environment) {
            return None;
        }
        let i = self.position;
        self.position += 1;
        if let Some(entry) = self.config.schedule.get(i) {
            return *entry;
        }
        if self.config.faults.is_empty() {
            return None;
        }
        let u = u64::from(self.rng.next_u32());
        for (fault, limit) in self.config.faults.iter().zip(&self.thresholds) {
            if u >= *limit {
                continue;
            }
            return Some(match fault.kind {
                FaultKind::Latency => {
                    let span = fault.max_ms - fault.min_ms + 1;
                    Fault::Latency {
                        ms: fault.min_ms + u64::from(self.rng.next_u32()) % span,
                    }
                }
                FaultKind::Error => Fault::Error,
                FaultKind::Timeout => Fault::Timeout,
                FaultKind::Drop => Fault::Drop,
                FaultKind::Truncate => Fault::Truncate,
                FaultKind::Malformed => Fault::Malformed,
            });
        }
        None
    }
}

impl FaultInjector for ChaosEngine {
    fn decide(&mut self) -> Option<Fault> {
        Self::decide(self)
    }
}

/// The marker a malformed fault puts in place of the result.
pub const MALFORMED_MARKER: &str = "{\"mzizi-chaos\":";

/// Half a string, by code point (`floor(n / 2)` of `n` chars).
#[must_use]
pub fn truncate_str(value: &str) -> &str {
    let keep = value.chars().count() / 2;
    match value.char_indices().nth(keep) {
        Some((at, _)) => &value[..at],
        None => value,
    }
}

/// Half a slice (`floor(n / 2)` of `n` items).
#[must_use]
pub fn truncate_slice<T>(value: &[T]) -> &[T] {
    &value[..value.len() / 2]
}
