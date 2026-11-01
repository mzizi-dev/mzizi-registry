//! Circuit breaker: closed, open, half-open.
//!
//! * **Closed** admits every call. Failures inside the sliding `window_ms` are
//!   counted; reaching `failure_threshold` opens the circuit *at once* (the state
//!   changes on the failing call, not on the next one).
//! * **Open** turns calls away until `cooldown_ms` has passed, then becomes half-open.
//! * **Half-open** admits exactly **one** probe. Its success closes the circuit; its
//!   failure reopens it. Other calls are turned away while the probe is out.
//!
//! A [`Permit`] remembers the epoch it was granted in. An outcome that arrives after
//! the circuit has moved on (a slow call admitted before it opened) is ignored, so a
//! late result can never close or reopen a circuit it does not belong to.
//!
//! What counts as a failure is the host's decision: call [`Breaker::failure`] for the
//! errors that should count, and [`Breaker::release`] for those that should not (a
//! cancelled call, a 4xx that is the caller's fault).

use std::collections::VecDeque;

use crate::ConfigError;

/// The circuit's state.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum State {
    /// Calls go through.
    Closed,
    /// Calls are turned away.
    Open,
    /// One probe is allowed through.
    HalfOpen,
}

/// Breaker settings.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Config {
    /// Failures inside `window_ms` that open the circuit. At least 1.
    pub failure_threshold: u32,
    /// Failures older than this are forgotten. At least 1.
    pub window_ms: u64,
    /// How long the circuit stays open before one probe. At least 1.
    pub cooldown_ms: u64,
}

/// Proof that a call was admitted. Hand it back with the outcome.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Permit {
    epoch: u64,
    probe: bool,
}

impl Permit {
    /// Whether this is the half-open probe.
    pub fn is_probe(&self) -> bool {
        self.probe
    }
}

/// The answer to [`Breaker::acquire`].
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Admission {
    /// Go ahead.
    Allowed(Permit),
    /// Open: try again after this many milliseconds.
    Open {
        /// Time left of the cooldown.
        retry_after_ms: u64,
    },
    /// Half-open and the one probe is already out.
    ProbeInFlight,
}

/// A circuit breaker for one dependency.
#[derive(Debug, Clone)]
pub struct Breaker {
    cfg: Config,
    state: State,
    failures: VecDeque<u64>,
    opened_at: u64,
    epoch: u64,
    probe_out: bool,
}

impl Breaker {
    /// A closed breaker, or the reason the settings are invalid.
    pub fn new(cfg: Config) -> Result<Self, ConfigError> {
        if cfg.failure_threshold == 0 {
            return Err(ConfigError("failure_threshold must be at least 1"));
        }
        if cfg.window_ms == 0 {
            return Err(ConfigError("window_ms must be at least 1"));
        }
        if cfg.cooldown_ms == 0 {
            return Err(ConfigError("cooldown_ms must be at least 1"));
        }
        Ok(Self {
            cfg,
            state: State::Closed,
            failures: VecDeque::new(),
            opened_at: 0,
            epoch: 0,
            probe_out: false,
        })
    }

    /// The state at `now`. An open circuit whose cooldown has passed reports
    /// half-open.
    pub fn state(&self, now: u64) -> State {
        match self.state {
            State::Open if self.cooldown_left(now) == 0 => State::HalfOpen,
            s => s,
        }
    }

    fn cooldown_left(&self, now: u64) -> u64 {
        self.cfg
            .cooldown_ms
            .saturating_sub(now.saturating_sub(self.opened_at))
    }

    /// Ask to make a call.
    pub fn acquire(&mut self, now: u64) -> Admission {
        if self.state == State::Open {
            let left = self.cooldown_left(now);
            if left > 0 {
                return Admission::Open {
                    retry_after_ms: left,
                };
            }
            self.state = State::HalfOpen;
            self.probe_out = false;
        }
        match self.state {
            State::Closed => Admission::Allowed(Permit {
                epoch: self.epoch,
                probe: false,
            }),
            State::HalfOpen if self.probe_out => Admission::ProbeInFlight,
            State::HalfOpen => {
                self.probe_out = true;
                Admission::Allowed(Permit {
                    epoch: self.epoch,
                    probe: true,
                })
            }
            State::Open => unreachable!("open was handled above"),
        }
    }

    /// The call succeeded.
    pub fn success(&mut self, permit: Permit) {
        if permit.epoch != self.epoch {
            return; // a late outcome from an earlier life of the circuit
        }
        if permit.probe && self.state == State::HalfOpen {
            self.state = State::Closed;
            self.failures.clear();
            self.probe_out = false;
            self.epoch += 1;
        }
    }

    /// The call failed in a way that counts.
    pub fn failure(&mut self, now: u64, permit: Permit) {
        if permit.epoch != self.epoch {
            return;
        }
        if permit.probe {
            if self.state == State::HalfOpen {
                self.open(now);
            }
            return;
        }
        if self.state != State::Closed {
            return;
        }
        let window = self.cfg.window_ms;
        while self
            .failures
            .front()
            .is_some_and(|&t| now.saturating_sub(t) >= window)
        {
            self.failures.pop_front();
        }
        self.failures.push_back(now);
        if self.failures.len() as u64 >= u64::from(self.cfg.failure_threshold) {
            self.open(now);
        }
    }

    /// The call ended in a way that says nothing about the dependency (cancelled,
    /// or a caller error). It is neither a success nor a failure.
    pub fn release(&mut self, permit: Permit) {
        if permit.epoch == self.epoch && permit.probe && self.state == State::HalfOpen {
            self.probe_out = false;
        }
    }

    fn open(&mut self, now: u64) {
        self.state = State::Open;
        self.opened_at = now;
        self.failures.clear();
        self.probe_out = false;
        self.epoch += 1;
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn cfg() -> Config {
        Config {
            failure_threshold: 3,
            window_ms: 1_000,
            cooldown_ms: 500,
        }
    }

    fn allowed(a: Admission) -> Permit {
        match a {
            Admission::Allowed(p) => p,
            other => panic!("expected Allowed, got {other:?}"),
        }
    }

    #[test]
    fn rejects_invalid_settings() {
        for bad in [
            Config {
                failure_threshold: 0,
                ..cfg()
            },
            Config {
                window_ms: 0,
                ..cfg()
            },
            Config {
                cooldown_ms: 0,
                ..cfg()
            },
        ] {
            assert!(Breaker::new(bad).is_err());
        }
    }

    #[test]
    fn opens_on_the_failing_call_not_the_next() {
        let mut b = Breaker::new(cfg()).unwrap();
        for t in [0, 10, 20] {
            let p = allowed(b.acquire(t));
            b.failure(t, p);
        }
        assert_eq!(b.state(20), State::Open);
        assert_eq!(
            b.acquire(21),
            Admission::Open {
                retry_after_ms: 499
            }
        );
    }

    #[test]
    fn old_failures_leave_the_window() {
        let mut b = Breaker::new(cfg()).unwrap();
        for t in [0, 10, 2_000] {
            let p = allowed(b.acquire(t));
            b.failure(t, p);
        }
        assert_eq!(b.state(2_000), State::Closed);
    }

    #[test]
    fn half_open_admits_exactly_one_probe() {
        let mut b = Breaker::new(cfg()).unwrap();
        for t in [0, 1, 2] {
            let p = allowed(b.acquire(t));
            b.failure(t, p);
        }
        assert_eq!(b.state(600), State::HalfOpen);
        let probe = allowed(b.acquire(600));
        assert!(probe.is_probe());
        assert_eq!(b.acquire(600), Admission::ProbeInFlight);
        assert_eq!(b.acquire(601), Admission::ProbeInFlight);
        b.success(probe);
        assert_eq!(b.state(602), State::Closed);
    }

    #[test]
    fn a_failed_probe_reopens_for_a_full_cooldown() {
        let mut b = Breaker::new(cfg()).unwrap();
        for t in [0, 1, 2] {
            let p = allowed(b.acquire(t));
            b.failure(t, p);
        }
        let probe = allowed(b.acquire(600));
        b.failure(600, probe);
        assert_eq!(
            b.acquire(601),
            Admission::Open {
                retry_after_ms: 499
            }
        );
    }

    #[test]
    fn a_released_probe_frees_the_slot_without_judging_the_dependency() {
        let mut b = Breaker::new(cfg()).unwrap();
        for t in [0, 1, 2] {
            let p = allowed(b.acquire(t));
            b.failure(t, p);
        }
        let probe = allowed(b.acquire(600));
        b.release(probe);
        assert_eq!(b.state(600), State::HalfOpen);
        assert!(allowed(b.acquire(601)).is_probe());
    }

    #[test]
    fn a_late_outcome_from_before_opening_changes_nothing() {
        let mut b = Breaker::new(cfg()).unwrap();
        let slow = allowed(b.acquire(0));
        for t in [1, 2, 3] {
            let p = allowed(b.acquire(t));
            b.failure(t, p);
        }
        assert_eq!(b.state(4), State::Open);
        b.success(slow); // would have closed nothing, and must not touch the state
        b.failure(5, slow);
        assert_eq!(b.state(5), State::Open);
        // After the cooldown the probe is still the first call through.
        assert!(allowed(b.acquire(600)).is_probe());
    }

    #[test]
    fn a_clock_that_steps_back_does_not_panic() {
        let mut b = Breaker::new(cfg()).unwrap();
        for t in [100, 101, 102] {
            let p = allowed(b.acquire(t));
            b.failure(t, p);
        }
        assert_eq!(
            b.acquire(0),
            Admission::Open {
                retry_after_ms: 500
            }
        );
    }
}
