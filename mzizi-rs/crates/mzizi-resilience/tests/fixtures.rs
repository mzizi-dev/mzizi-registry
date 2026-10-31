//! Runs the shared vectors in `__tests__/fixtures/resilience/`. The TypeScript and
//! Python builds run the same files, so all builds behave identically (#472).

use std::collections::HashMap;
use std::path::PathBuf;

use mzizi_resilience::breaker::{Admission, Breaker, Config as BreakerConfig, Permit, State};
use mzizi_resilience::rate_limit::{Config as RateConfig, Decision, RateLimiter};
use mzizi_resilience::retry::{Backoff, Jitter};
use serde_json::Value;

fn fixture(name: &str) -> Value {
    let path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("../../../__tests__/fixtures/resilience")
        .join(name);
    let text = std::fs::read_to_string(&path).unwrap_or_else(|e| panic!("{}: {e}", path.display()));
    serde_json::from_str(&text).expect("fixture is JSON")
}

fn u64_of(v: &Value, key: &str) -> u64 {
    v[key]
        .as_u64()
        .unwrap_or_else(|| panic!("missing number {key}"))
}

#[test]
fn breaker_script() {
    let f = fixture("breaker.json");
    let c = &f["config"];
    let mut b = Breaker::new(BreakerConfig {
        failure_threshold: u64_of(c, "failure_threshold") as u32,
        window_ms: u64_of(c, "window_ms"),
        cooldown_ms: u64_of(c, "cooldown_ms"),
    })
    .unwrap();
    let mut permits: HashMap<String, Permit> = HashMap::new();
    for (i, s) in f["steps"].as_array().unwrap().iter().enumerate() {
        let at = u64_of(s, "at");
        let ctx = format!("step {i}: {s}");
        match s["do"].as_str().unwrap() {
            "acquire" => {
                let got = b.acquire(at);
                match (s["expect"].as_str().unwrap(), got) {
                    ("allowed", Admission::Allowed(p)) => {
                        if let Some(probe) = s.get("probe") {
                            assert_eq!(p.is_probe(), probe.as_bool().unwrap(), "{ctx}");
                        }
                        if let Some(name) = s["as"].as_str() {
                            permits.insert(name.to_string(), p);
                        }
                    }
                    ("open", Admission::Open { retry_after_ms }) => {
                        assert_eq!(retry_after_ms, u64_of(s, "retry_after_ms"), "{ctx}");
                    }
                    ("probe_in_flight", Admission::ProbeInFlight) => {}
                    (want, got) => panic!("{ctx}: wanted {want}, got {got:?}"),
                }
            }
            outcome @ ("success" | "failure") => {
                let p = permits[s["permit"].as_str().unwrap()];
                if outcome == "success" {
                    b.success(p);
                } else {
                    b.failure(at, p);
                }
                let want = match s["state"].as_str().unwrap() {
                    "closed" => State::Closed,
                    "open" => State::Open,
                    "half_open" => State::HalfOpen,
                    other => panic!("{ctx}: unknown state {other}"),
                };
                assert_eq!(b.state(at), want, "{ctx}");
            }
            other => panic!("{ctx}: unknown step {other}"),
        }
    }
}

#[test]
fn rate_limit_script() {
    let f = fixture("rate-limit.json");
    let c = &f["config"];
    let mut l = RateLimiter::new(
        RateConfig {
            limit: u64_of(c, "limit") as u32,
            window_ms: u64_of(c, "window_ms"),
            burst: u64_of(c, "burst") as u32,
        },
        u64_of(&f, "start"),
    )
    .unwrap();
    for (i, s) in f["steps"].as_array().unwrap().iter().enumerate() {
        let ctx = format!("step {i}: {s}");
        let got = l.try_acquire(u64_of(s, "at"), u64_of(s, "take") as u32);
        match (s["expect"].as_str().unwrap(), got) {
            ("allowed", Decision::Allowed) | ("impossible", Decision::Impossible) => {}
            ("denied", Decision::Denied { retry_after_ms }) => {
                assert_eq!(retry_after_ms, u64_of(s, "retry_after_ms"), "{ctx}");
            }
            (want, got) => panic!("{ctx}: wanted {want}, got {got:?}"),
        }
    }
}

#[test]
fn backoff_cases() {
    let f = fixture("backoff.json");
    let c = &f["config"];
    for case in f["cases"].as_array().unwrap() {
        let jitter = match case["jitter"].as_str().unwrap() {
            "none" => Jitter::None,
            "full" => Jitter::Full,
            "equal" => Jitter::Equal,
            other => panic!("unknown jitter {other}"),
        };
        let b = Backoff::new(
            u64_of(c, "base_ms"),
            u64_of(c, "factor") as u32,
            u64_of(c, "max_ms"),
            jitter,
        )
        .unwrap();
        let got = b.delay_ms(u64_of(case, "retry") as u32, case["unit"].as_f64().unwrap());
        assert_eq!(got, u64_of(case, "delay_ms"), "{case}");
    }
}
