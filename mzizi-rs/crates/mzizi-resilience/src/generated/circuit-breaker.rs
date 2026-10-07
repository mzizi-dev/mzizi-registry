// GENERATED — DO NOT EDIT.
//
// Copied verbatim from components/registry/n5-resilience/circuit-breaker.rs by scripts/generate-rust-components.mjs.
// That file is the one a human edits; this is the copy `cargo package` can ship,
// because a tarball only carries files under the crate root.
//
// Regenerate with `pnpm rust:generate`. CI runs `pnpm rust:generate:check`,
// which fails if this copy and its source have drifted.

//! Circuit breaker for the Mzizi resilience node (N5), Resilience4j-style.
//!
//! Harvested from mukoko-weather's production breaker (`weather-core/src/breaker.rs`): a
//! pure sliding-window core with the time passed in. [`CircuitBreakerCore`] is that core;
//! [`CircuitBreaker`] runs async calls through it on a [`Runtime`].
//!
//! - CLOSED: calls go through. A failure is recorded at `now`; failures older than
//!   `window_ms` are dropped; at `failure_threshold` failures the circuit opens.
//! - OPEN: calls are rejected ([`Error::CircuitOpen`], code `circuit-open`) with a
//!   `retry_after_ms`, until `cooldown_ms` has passed since it opened.
//! - HALF_OPEN: at most `half_open_max_calls` probes at once; a success closes the circuit,
//!   a failure opens it again.
//! - An outcome reported while OPEN (a call admitted before it opened) is ignored.
//! - Rejections from inner guards are not dependency failures: they release a half-open
//!   probe slot ([`CircuitBreakerCore::on_ignored`]) and change nothing else.
//!
//! Per-provider configuration is a pattern, not a preset list. mukoko-weather's, for example:
//!
//! ```
//! use mzizi_resilience::circuit_breaker::CircuitBreakerConfig;
//!
//! // Tomorrow.io: 3 failures in 5 min open it for 2 min.
//! let tomorrow = CircuitBreakerConfig { failure_threshold: 3, window_ms: 300_000, cooldown_ms: 120_000, ..CircuitBreakerConfig::new("tomorrow-io") };
//! // Open-Meteo: 5 failures in 5 min open it for 5 min.
//! let open_meteo = CircuitBreakerConfig { failure_threshold: 5, window_ms: 300_000, cooldown_ms: 300_000, ..CircuitBreakerConfig::new("open-meteo") };
//! # let _ = (tomorrow, open_meteo);
//! ```
//!
//! The TypeScript build is `circuit-breaker.ts`; both are held to
//! `contracts/lib/circuit-breaker.contract.json`.

use std::cell::RefCell;
use std::collections::VecDeque;
use std::future::Future;

use crate::resilience_core::{ConfigError, Error, Runtime, check_min, check_name};

/// The breaker's state; serialises as `closed`, `open`, `half_open`.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum CircuitState {
    /// Calls go through.
    Closed,
    /// Calls are rejected.
    Open,
    /// Probes are admitted.
    HalfOpen,
}

impl CircuitState {
    /// `closed`, `open` or `half_open`.
    pub const fn as_str(self) -> &'static str {
        match self {
            CircuitState::Closed => "closed",
            CircuitState::Open => "open",
            CircuitState::HalfOpen => "half_open",
        }
    }
}

/// A state change, recorded when it is first observed.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Transition {
    /// From.
    pub from: CircuitState,
    /// To.
    pub to: CircuitState,
    /// The `now` at which it was observed, in ms.
    pub at: u64,
}

/// How many transitions a breaker remembers (the most recent).
pub const TRANSITION_HISTORY: usize = 64;

/// A breaker's numbers.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CircuitBreakerConfig {
    /// Identifier, e.g. the dependency it protects.
    pub name: String,
    /// Failures within `window_ms` that open the circuit (>= 1, default 3).
    pub failure_threshold: u32,
    /// Sliding window for counting failures, in ms (>= 1, default 60000).
    pub window_ms: u64,
    /// How long the circuit stays OPEN before admitting probes, in ms (default 30000).
    pub cooldown_ms: u64,
    /// Probes admitted at once while HALF_OPEN (>= 1, default 1).
    pub half_open_max_calls: u32,
}

impl CircuitBreakerConfig {
    /// The defaults, named `name`.
    pub fn new(name: impl Into<String>) -> Self {
        CircuitBreakerConfig {
            name: name.into(),
            failure_threshold: 3,
            window_ms: 60_000,
            cooldown_ms: 30_000,
            half_open_max_calls: 1,
        }
    }

    /// Check every value.
    pub fn validate(&self) -> Result<(), ConfigError> {
        check_name("name", &self.name)?;
        check_min("failure_threshold", u64::from(self.failure_threshold), 1)?;
        check_min("window_ms", self.window_ms, 1)?;
        check_min(
            "half_open_max_calls",
            u64::from(self.half_open_max_calls),
            1,
        )?;
        Ok(())
    }
}

/// The answer to [`CircuitBreakerCore::try_acquire`].
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Acquire {
    /// Make the call.
    Ok,
    /// Do not; a call may be admitted in `retry_after_ms`.
    Rejected {
        /// In ms (0: a probe slot may free up any time).
        retry_after_ms: u64,
    },
}

/// The sans-IO breaker. Every method takes `now` (integer ms); nothing reads a clock.
#[derive(Debug, Clone)]
pub struct CircuitBreakerCore {
    config: CircuitBreakerConfig,
    state: CircuitState,
    failures: Vec<u64>,
    opened_at: u64,
    probes: u32,
    transitions: VecDeque<Transition>,
}

impl CircuitBreakerCore {
    /// A closed breaker, or the config error.
    pub fn new(config: CircuitBreakerConfig) -> Result<Self, ConfigError> {
        config.validate()?;
        Ok(CircuitBreakerCore {
            config,
            state: CircuitState::Closed,
            failures: Vec::new(),
            opened_at: 0,
            probes: 0,
            transitions: VecDeque::new(),
        })
    }

    /// The config.
    pub fn config(&self) -> &CircuitBreakerConfig {
        &self.config
    }

    /// The state at `now`. An open circuit whose cooldown has passed is observed as HALF_OPEN.
    pub fn state(&mut self, now: u64) -> CircuitState {
        if self.state == CircuitState::Open
            && now.saturating_sub(self.opened_at) >= self.config.cooldown_ms
        {
            self.probes = 0;
            self.go(CircuitState::HalfOpen, now);
        }
        self.state
    }

    /// Ask to make a call at `now`.
    pub fn try_acquire(&mut self, now: u64) -> Acquire {
        match self.state(now) {
            CircuitState::Closed => Acquire::Ok,
            CircuitState::Open => Acquire::Rejected {
                retry_after_ms: self
                    .config
                    .cooldown_ms
                    .saturating_sub(now.saturating_sub(self.opened_at)),
            },
            CircuitState::HalfOpen => {
                if self.probes < self.config.half_open_max_calls {
                    self.probes += 1;
                    Acquire::Ok
                } else {
                    Acquire::Rejected { retry_after_ms: 0 }
                }
            }
        }
    }

    /// An admitted call succeeded.
    pub fn on_success(&mut self, now: u64) {
        if self.state(now) == CircuitState::HalfOpen {
            self.failures.clear();
            self.probes = 0;
            self.go(CircuitState::Closed, now);
        }
    }

    /// An admitted call failed.
    pub fn on_failure(&mut self, now: u64) {
        match self.state(now) {
            CircuitState::Closed => {
                let window = self.config.window_ms;
                self.failures.retain(|t| now.saturating_sub(*t) < window);
                self.failures.push(now);
                if self.failures.len() >= self.config.failure_threshold as usize {
                    self.open(now);
                }
            }
            CircuitState::HalfOpen => self.open(now),
            // A call admitted before the circuit opened reports late; ignored.
            CircuitState::Open => {}
        }
    }

    /// An admitted call ended in a way that says nothing about the dependency (an inner
    /// rejection, or an error the caller does not count): a half-open probe slot is released.
    pub fn on_ignored(&mut self, now: u64) {
        if self.state(now) == CircuitState::HalfOpen && self.probes > 0 {
            self.probes -= 1;
        }
    }

    /// Back to CLOSED with no failures.
    pub fn reset(&mut self, now: u64) {
        self.failures.clear();
        self.probes = 0;
        self.opened_at = 0;
        self.go(CircuitState::Closed, now);
    }

    /// Failures inside the window at `now`.
    pub fn failure_count(&self, now: u64) -> usize {
        self.failures
            .iter()
            .filter(|t| now.saturating_sub(**t) < self.config.window_ms)
            .count()
    }

    /// Probes admitted and not yet reported while HALF_OPEN.
    pub fn probes_in_flight(&self) -> u32 {
        self.probes
    }

    /// The most recent transitions (up to [`TRANSITION_HISTORY`]), oldest first.
    pub fn transitions(&self) -> impl Iterator<Item = &Transition> {
        self.transitions.iter()
    }

    /// Take the recorded transitions, leaving none.
    pub fn take_transitions(&mut self) -> Vec<Transition> {
        self.transitions.drain(..).collect()
    }

    fn open(&mut self, now: u64) {
        self.opened_at = now;
        self.failures.clear();
        self.probes = 0;
        self.go(CircuitState::Open, now);
    }

    fn go(&mut self, to: CircuitState, at: u64) {
        if self.state == to {
            return;
        }
        self.transitions.push_back(Transition {
            from: self.state,
            to,
            at,
        });
        if self.transitions.len() > TRANSITION_HISTORY {
            self.transitions.pop_front();
        }
        self.state = to;
    }
}

/// A circuit breaker for async calls. Single-threaded (interior `RefCell`, never held across
/// an await): share it within one thread or Worker isolate; on a multi-threaded host, put a
/// [`CircuitBreakerCore`] behind your own lock.
#[derive(Debug)]
pub struct CircuitBreaker {
    core: RefCell<CircuitBreakerCore>,
}

impl CircuitBreaker {
    /// A closed breaker, or the config error.
    pub fn new(config: CircuitBreakerConfig) -> Result<Self, ConfigError> {
        Ok(CircuitBreaker {
            core: RefCell::new(CircuitBreakerCore::new(config)?),
        })
    }

    /// The breaker's name.
    pub fn name(&self) -> String {
        self.core.borrow().config.name.clone()
    }

    /// The state at `now`.
    pub fn state(&self, now: u64) -> CircuitState {
        self.core.borrow_mut().state(now)
    }

    /// Failures in the window at `now`.
    pub fn failure_count(&self, now: u64) -> usize {
        self.core.borrow().failure_count(now)
    }

    /// Run `f` on the core (for reading transitions, resetting, …).
    pub fn with_core<O>(&self, f: impl FnOnce(&mut CircuitBreakerCore) -> O) -> O {
        f(&mut self.core.borrow_mut())
    }

    /// Run `op` through the breaker; every error but a rejection counts as a failure.
    pub async fn execute<R, T, E, F, Fut>(&self, rt: &R, op: F) -> Result<T, Error<E>>
    where
        R: Runtime + ?Sized,
        F: FnOnce() -> Fut,
        Fut: Future<Output = Result<T, Error<E>>>,
    {
        self.execute_with(rt, |e: &Error<E>| !e.is_rejection(), op)
            .await
    }

    /// Run `op` through the breaker; `is_failure` decides which errors count (a rejection
    /// it declines, like any declined error, releases a half-open probe slot).
    pub async fn execute_with<R, T, E, F, Fut, P>(
        &self,
        rt: &R,
        is_failure: P,
        op: F,
    ) -> Result<T, Error<E>>
    where
        R: Runtime + ?Sized,
        F: FnOnce() -> Fut,
        Fut: Future<Output = Result<T, Error<E>>>,
        P: FnOnce(&Error<E>) -> bool,
    {
        let now = rt.now_ms();
        let acquired = self.core.borrow_mut().try_acquire(now);
        if let Acquire::Rejected { retry_after_ms } = acquired {
            let mut core = self.core.borrow_mut();
            return Err(Error::CircuitOpen {
                name: core.config.name.clone(),
                retry_after_ms,
                state: core.state(now),
            });
        }
        // If the call is cancelled (its future dropped), release the probe slot it holds.
        let mut guard = ProbeGuard {
            breaker: self,
            now: rt.now_ms(),
            armed: true,
        };
        let result = op().await;
        guard.armed = false;
        let now = rt.now_ms();
        let mut core = self.core.borrow_mut();
        match &result {
            Ok(_) => core.on_success(now),
            Err(e) if is_failure(e) => core.on_failure(now),
            Err(_) => core.on_ignored(now),
        }
        result
    }
}

struct ProbeGuard<'a> {
    breaker: &'a CircuitBreaker,
    now: u64,
    armed: bool,
}

impl Drop for ProbeGuard<'_> {
    fn drop(&mut self) {
        if self.armed {
            self.breaker.core.borrow_mut().on_ignored(self.now);
        }
    }
}
