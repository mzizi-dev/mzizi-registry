//! Mzizi N8 chaos engine: a seeded, deterministic fault schedule.
//!
//! "What breaks is seen before users feel it": chaos tests break things on purpose,
//! in test, so the N5 resilience paths (`mzizi-resilience`) are exercised before a
//! release instead of by an outage. The engine only *decides* which fault the next
//! call gets; the host injects it (sleeps, returns a 503, drops the connection). So
//! it is sans-IO, has no dependencies, and runs unchanged on Workers, in containers
//! and on bare metal.
//!
//! Three rules, each held by a test:
//!
//! * **Deterministic.** The same [`Plan`] (its seed included) gives the same faults,
//!   in Rust, TypeScript and Python. The generator is SplitMix64 and a unit draw is
//!   its top 53 bits over 2^53, specified exactly so every build can reproduce the
//!   shared vectors in `__tests__/fixtures/chaos/`. A failing chaos run is therefore
//!   replayable from its seed.
//! * **Never in production.** [`Engine::new`] refuses any environment that is not
//!   plainly a test one, and an unknown or empty name counts as production. There is
//!   no flag to override it.
//! * **Validated.** Rates outside `[0, 1]`, rates that sum past 1, a latency range
//!   that is backwards and an empty or non-5xx status list are refused at
//!   construction, not discovered as a surprising run.

use core::fmt;

/// What chaos does to one call.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Fault {
    /// Leave the call alone.
    None,
    /// Delay the call by this many milliseconds, then let it through.
    Latency {
        /// How long.
        ms: u64,
    },
    /// Fail the call with this HTTP status (5xx).
    Error {
        /// The status.
        status: u16,
    },
    /// Never answer, so the caller's own timeout fires.
    Timeout,
    /// Refuse the connection, as if the dependency were down.
    Unreachable,
}

/// A fault plan. Rates are probabilities per call and their sum is at most 1; what is
/// left over is "no fault".
#[derive(Debug, Clone, PartialEq)]
pub struct Plan {
    /// The seed: same seed, same faults.
    pub seed: u64,
    /// Probability of [`Fault::Unreachable`].
    pub unreachable_rate: f64,
    /// Probability of [`Fault::Timeout`].
    pub timeout_rate: f64,
    /// Probability of [`Fault::Error`].
    pub error_rate: f64,
    /// Probability of [`Fault::Latency`].
    pub latency_rate: f64,
    /// Shortest injected delay, ms.
    pub latency_min_ms: u64,
    /// Longest injected delay, ms.
    pub latency_max_ms: u64,
    /// The statuses an injected error picks from (each 500 to 599).
    pub error_statuses: Vec<u16>,
}

impl Default for Plan {
    /// No faults: a plan that does nothing until it is given rates.
    fn default() -> Self {
        Self {
            seed: 0,
            unreachable_rate: 0.0,
            timeout_rate: 0.0,
            error_rate: 0.0,
            latency_rate: 0.0,
            latency_min_ms: 0,
            latency_max_ms: 0,
            error_statuses: vec![500, 502, 503],
        }
    }
}

/// Why an [`Engine`] was not built.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ChaosError {
    /// The environment is production, or not recognisably a test one.
    Production,
    /// The plan is invalid; the text says which part.
    InvalidPlan(&'static str),
}

impl fmt::Display for ChaosError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Production => write!(f, "chaos refuses to run in production"),
            Self::InvalidPlan(why) => write!(f, "invalid chaos plan: {why}"),
        }
    }
}

impl std::error::Error for ChaosError {}

/// Environments chaos may run in. Anything else is treated as production.
const TEST_ENVIRONMENTS: [&str; 5] = ["test", "ci", "development", "dev", "staging"];

/// SplitMix64, the generator every build implements.
#[derive(Debug, Clone)]
struct SplitMix64(u64);

impl SplitMix64 {
    fn next_u64(&mut self) -> u64 {
        self.0 = self.0.wrapping_add(0x9E37_79B9_7F4A_7C15);
        let mut z = self.0;
        z = (z ^ (z >> 30)).wrapping_mul(0xBF58_476D_1CE4_E5B9);
        z = (z ^ (z >> 27)).wrapping_mul(0x94D0_49BB_1331_11EB);
        z ^ (z >> 31)
    }

    /// A draw in `[0, 1)`: the top 53 bits over 2^53.
    fn unit(&mut self) -> f64 {
        (self.next_u64() >> 11) as f64 / 9_007_199_254_740_992.0
    }
}

/// The fault scheduler.
#[derive(Debug, Clone)]
pub struct Engine {
    plan: Plan,
    rng: SplitMix64,
}

impl Engine {
    /// An engine for `plan`, or why it cannot run. `environment` is the host's
    /// environment name (`ENVIRONMENT`, `NODE_ENV`, ...).
    pub fn new(plan: Plan, environment: &str) -> Result<Self, ChaosError> {
        let env = environment.trim().to_ascii_lowercase();
        if !TEST_ENVIRONMENTS.contains(&env.as_str()) {
            return Err(ChaosError::Production);
        }
        validate(&plan)?;
        let rng = SplitMix64(plan.seed);
        Ok(Self { plan, rng })
    }

    /// The fault for the next call. One unit draw picks the kind (unreachable,
    /// timeout, error, latency, in that order); an error draws one more unit to pick
    /// its status, a latency one more to pick its delay. Other kinds draw nothing
    /// further, so the sequence is the same in every build.
    pub fn next_fault(&mut self) -> Fault {
        let u = self.rng.unit();
        let p = &self.plan;
        let mut edge = p.unreachable_rate;
        if u < edge {
            return Fault::Unreachable;
        }
        edge += p.timeout_rate;
        if u < edge {
            return Fault::Timeout;
        }
        edge += p.error_rate;
        if u < edge {
            let i = (self.rng.unit() * p.error_statuses.len() as f64) as usize;
            return Fault::Error {
                status: p.error_statuses[i.min(p.error_statuses.len() - 1)],
            };
        }
        edge += p.latency_rate;
        if u < edge {
            let span = p.latency_max_ms - p.latency_min_ms + 1;
            let ms = p.latency_min_ms + (self.rng.unit() * span as f64) as u64;
            return Fault::Latency {
                ms: ms.min(p.latency_max_ms),
            };
        }
        Fault::None
    }

    /// The next `n` faults.
    pub fn schedule(&mut self, n: usize) -> Vec<Fault> {
        (0..n).map(|_| self.next_fault()).collect()
    }
}

fn validate(p: &Plan) -> Result<(), ChaosError> {
    let rates = [
        p.unreachable_rate,
        p.timeout_rate,
        p.error_rate,
        p.latency_rate,
    ];
    if rates
        .iter()
        .any(|r| !r.is_finite() || !(0.0..=1.0).contains(r))
    {
        return Err(ChaosError::InvalidPlan(
            "every rate must be between 0 and 1",
        ));
    }
    if rates.iter().sum::<f64>() > 1.0 + 1e-12 {
        return Err(ChaosError::InvalidPlan(
            "the rates must add up to at most 1",
        ));
    }
    if p.latency_min_ms > p.latency_max_ms {
        return Err(ChaosError::InvalidPlan(
            "latency_min_ms must not exceed latency_max_ms",
        ));
    }
    if p.error_statuses.is_empty() || p.error_statuses.iter().any(|s| !(500..=599).contains(s)) {
        return Err(ChaosError::InvalidPlan(
            "error_statuses must be a non-empty list of 5xx codes",
        ));
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn plan() -> Plan {
        Plan {
            seed: 42,
            unreachable_rate: 0.05,
            timeout_rate: 0.05,
            error_rate: 0.2,
            latency_rate: 0.2,
            latency_min_ms: 100,
            latency_max_ms: 900,
            ..Plan::default()
        }
    }

    #[test]
    fn the_same_seed_gives_the_same_faults() {
        let a = Engine::new(plan(), "test").unwrap().schedule(200);
        let b = Engine::new(plan(), "ci").unwrap().schedule(200);
        assert_eq!(a, b);
        let other = Engine::new(Plan { seed: 43, ..plan() }, "test")
            .unwrap()
            .schedule(200);
        assert_ne!(a, other);
    }

    #[test]
    fn production_and_unknown_environments_are_refused() {
        for env in [
            "production",
            "prod",
            "PRODUCTION",
            " Production ",
            "",
            "live",
            "main",
            "eu-1",
        ] {
            assert_eq!(
                Engine::new(plan(), env).unwrap_err(),
                ChaosError::Production,
                "{env:?}"
            );
        }
        for env in ["test", "TEST", "ci", "development", "dev", "staging"] {
            assert!(Engine::new(plan(), env).is_ok(), "{env}");
        }
    }

    #[test]
    fn invalid_plans_are_refused() {
        let bad = [
            Plan {
                error_rate: -0.1,
                ..plan()
            },
            Plan {
                error_rate: 1.5,
                ..plan()
            },
            Plan {
                error_rate: f64::NAN,
                ..plan()
            },
            Plan {
                error_rate: 0.9,
                latency_rate: 0.9,
                ..plan()
            },
            Plan {
                latency_min_ms: 10,
                latency_max_ms: 5,
                ..plan()
            },
            Plan {
                error_statuses: vec![],
                ..plan()
            },
            Plan {
                error_statuses: vec![404],
                ..plan()
            },
        ];
        for p in bad {
            assert!(matches!(
                Engine::new(p, "test"),
                Err(ChaosError::InvalidPlan(_))
            ));
        }
    }

    #[test]
    fn the_empty_plan_never_injects_anything() {
        let faults = Engine::new(Plan::default(), "test")
            .unwrap()
            .schedule(1_000);
        assert!(faults.iter().all(|f| *f == Fault::None));
    }

    #[test]
    fn a_full_rate_always_injects_that_fault() {
        let p = Plan {
            error_rate: 1.0,
            ..Plan::default()
        };
        let faults = Engine::new(p, "test").unwrap().schedule(100);
        assert!(
            faults
                .iter()
                .all(|f| matches!(f, Fault::Error { status } if [500, 502, 503].contains(status)))
        );
    }

    #[test]
    fn injected_latency_stays_inside_the_range_and_rates_are_roughly_honoured() {
        let faults = Engine::new(plan(), "test").unwrap().schedule(20_000);
        let mut counts = [0usize; 5];
        for f in &faults {
            match f {
                Fault::Latency { ms } => {
                    assert!((100..=900).contains(ms));
                    counts[0] += 1;
                }
                Fault::Error { .. } => counts[1] += 1,
                Fault::Timeout => counts[2] += 1,
                Fault::Unreachable => counts[3] += 1,
                Fault::None => counts[4] += 1,
            }
        }
        let share = |n: usize| n as f64 / 20_000.0;
        assert!(
            (share(counts[0]) - 0.2).abs() < 0.02,
            "latency {}",
            share(counts[0])
        );
        assert!(
            (share(counts[1]) - 0.2).abs() < 0.02,
            "error {}",
            share(counts[1])
        );
        assert!(
            (share(counts[2]) - 0.05).abs() < 0.01,
            "timeout {}",
            share(counts[2])
        );
        assert!(
            (share(counts[3]) - 0.05).abs() < 0.01,
            "unreachable {}",
            share(counts[3])
        );
    }

    #[test]
    fn splitmix64_matches_its_reference_values() {
        // The published SplitMix64 outputs for seed 0 (and the draw is the top 53 bits).
        let mut r = SplitMix64(0);
        assert_eq!(r.next_u64(), 0xE220_A839_7B1D_CDAF);
        assert_eq!(r.next_u64(), 0x6E78_9E6A_A1B9_65F4);
        let mut u = SplitMix64(0);
        assert!((u.unit() - 0.883_4).abs() < 0.001);
    }
}
