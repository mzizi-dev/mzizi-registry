//! The shared resilience fixtures (`__tests__/fixtures/resilience/*.cases.json`), run against
//! the Rust build. `__tests__/lib/resilience-fixtures.test.ts` runs the same files against the
//! TypeScript build; both must produce identical results (mzizi-registry#472).
//!
//! A few config cases use values a Rust type cannot hold (a negative or fractional number of
//! milliseconds, for `u64`): the type system rejects those before any code runs, so they are
//! skipped here and noted as such.

mod support;

use std::cell::RefCell;
use std::fs;
use std::path::PathBuf;
use std::rc::Rc;

use mzizi_resilience::bulkhead::{Bulkhead, BulkheadConfig, BulkheadCore, Entry};
use mzizi_resilience::circuit_breaker::{
    Acquire, CircuitBreakerConfig, CircuitBreakerCore, CircuitState,
};
use mzizi_resilience::fallback_chain::{Stage, with_fallback_result};
use mzizi_resilience::mzizi_resilience::{
    FaultSchedule, MALFORMED_MARKER, MutateKind, truncate_str,
};
use mzizi_resilience::rate_limiter::{RateAcquire, RateLimiterConfig, RateLimiterCore};
use mzizi_resilience::resilience_core::{ConfigError, StageError};
use mzizi_resilience::retry::{Jitter, RetryPolicy, retry_delay, with_retry};
use mzizi_resilience::timeout::with_timeout;
use mzizi_resilience::{
    Error, Fault, HealthMonitor, Mulberry32, Random, Resilience, ResilienceConfig, Runtime,
};
use serde_json::Value;
use support::{Virtual, block_on, join_all};

fn load(name: &str) -> Value {
    let path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("../../../__tests__/fixtures/resilience")
        .join(format!("{name}.cases.json"));
    serde_json::from_str(&fs::read_to_string(&path).unwrap()).unwrap()
}

/// A JSON number as a `u64`, or `None` when Rust's type cannot hold it.
fn u64_of(v: &Value) -> Option<u64> {
    v.as_u64()
}

fn outcome<T>(r: &Result<T, Error<String>>) -> String {
    match r {
        Ok(_) => "ok".to_owned(),
        Err(e) => format!("error:{}", e.code()),
    }
}

fn state_str(s: CircuitState) -> &'static str {
    s.as_str()
}

#[test]
fn prng() {
    let f = load("prng");
    for c in f["cases"].as_array().unwrap() {
        let mut rng = Mulberry32::new(u32::try_from(c["seed"].as_u64().unwrap()).unwrap());
        let got: Vec<u64> = c["outputs"]
            .as_array()
            .unwrap()
            .iter()
            .map(|_| u64::from(rng.next_u32()))
            .collect();
        let want: Vec<u64> = c["outputs"]
            .as_array()
            .unwrap()
            .iter()
            .map(|v| v.as_u64().unwrap())
            .collect();
        assert_eq!(got, want, "seed {}", c["seed"]);
    }
}

#[test]
fn timeout() {
    let f = load("timeout");
    for c in f["cases"].as_array().unwrap() {
        let name = c["name"].as_str().unwrap();
        let Some(t) = u64_of(&c["timeoutMs"]) else {
            continue; // negative or fractional: not a u64
        };
        let rt = Virtual::new();
        let want = c["expect"]["outcome"].as_str().unwrap();
        if c.get("durationMs").is_none() {
            let r: Result<String, Error<String>> =
                block_on(&rt, with_timeout(&rt, t, async { Ok("ok".to_owned()) }));
            assert_eq!(outcome(&r), want, "{name}");
            continue;
        }
        let d = c["durationMs"].as_u64().unwrap();
        let result = c["result"].as_str().unwrap().to_owned();
        let (kind, code) = result.split_once(':').unwrap_or((&result, ""));
        let (kind, code) = (kind.to_owned(), code.to_owned());
        let rt2 = rt.clone();
        let op = async move {
            if kind == "throw-sync" {
                return Err(Error::Op(code));
            }
            rt2.sleep(d).await;
            if kind == "fail" {
                Err(Error::Op(code))
            } else {
                Ok("ok".to_owned())
            }
        };
        let r = block_on(&rt, with_timeout(&rt, t, op));
        assert_eq!(outcome(&r), want, "{name}");
        assert_eq!(rt.now(), c["expect"]["now"].as_u64().unwrap(), "{name}");
        assert_eq!(rt.pending(), 0, "{name}: every timer cleared");
    }
}

fn breaker_config(v: &Value) -> Option<CircuitBreakerConfig> {
    let mut c = CircuitBreakerConfig::new(v["name"].as_str().unwrap());
    if let Some(x) = v.get("failureThreshold") {
        c.failure_threshold = u32::try_from(x.as_u64()?).ok()?;
    }
    if let Some(x) = v.get("windowMs") {
        c.window_ms = x.as_u64()?;
    }
    if let Some(x) = v.get("cooldownMs") {
        c.cooldown_ms = x.as_u64()?;
    }
    if let Some(x) = v.get("halfOpenMaxCalls") {
        c.half_open_max_calls = u32::try_from(x.as_u64()?).ok()?;
    }
    Some(c)
}

#[test]
fn circuit_breaker() {
    let f = load("circuit-breaker");
    for c in f["cases"].as_array().unwrap() {
        let name = c["name"].as_str().unwrap();
        let mut core = CircuitBreakerCore::new(breaker_config(&c["config"]).unwrap()).unwrap();
        for step in c["steps"].as_array().unwrap() {
            let at = step["at"].as_u64().unwrap();
            match step["op"].as_str().unwrap() {
                "acquire" => {
                    let want = if step["expect"]["ok"].as_bool().unwrap() {
                        Acquire::Ok
                    } else {
                        Acquire::Rejected {
                            retry_after_ms: step["expect"]["retryAfterMs"].as_u64().unwrap(),
                        }
                    };
                    assert_eq!(core.try_acquire(at), want, "{name}: acquire@{at}");
                }
                "success" => core.on_success(at),
                "failure" => core.on_failure(at),
                "ignored" => core.on_ignored(at),
                "state" => assert_eq!(
                    state_str(core.state(at)),
                    step["expect"].as_str().unwrap(),
                    "{name}: state@{at}"
                ),
                "failureCount" => assert_eq!(
                    core.failure_count(at) as u64,
                    step["expect"].as_u64().unwrap(),
                    "{name}: failureCount@{at}"
                ),
                "reset" => core.reset(at),
                other => panic!("unknown op {other}"),
            }
        }
        let got: Vec<(String, String, u64)> = core
            .transitions()
            .map(|t| (t.from.as_str().into(), t.to.as_str().into(), t.at))
            .collect();
        let want: Vec<(String, String, u64)> = c["transitions"]
            .as_array()
            .unwrap()
            .iter()
            .map(|t| {
                (
                    t["from"].as_str().unwrap().into(),
                    t["to"].as_str().unwrap().into(),
                    t["at"].as_u64().unwrap(),
                )
            })
            .collect();
        assert_eq!(got, want, "{name}: transitions");
    }
    for c in f["configErrors"].as_array().unwrap() {
        let Some(config) = breaker_config(c) else {
            continue; // not representable in Rust's types
        };
        assert!(CircuitBreakerCore::new(config).is_err(), "config error {c}");
    }
}

fn policy_of(v: &Value) -> Option<RetryPolicy> {
    let mut p = RetryPolicy::default();
    if let Some(x) = v.get("maxAttempts") {
        p.max_attempts = u32::try_from(x.as_u64()?).ok()?;
    }
    if let Some(x) = v.get("baseDelayMs") {
        p.base_delay_ms = x.as_u64()?;
    }
    if let Some(x) = v.get("maxDelayMs") {
        p.max_delay_ms = x.as_u64()?;
    }
    if let Some(x) = v.get("jitter") {
        p.jitter = match x.as_str()? {
            "none" => Jitter::None,
            "half" => Jitter::Half,
            _ => return None,
        };
    }
    Some(p)
}

struct Counting<'a>(&'a mut Mulberry32, u32);

impl Random for Counting<'_> {
    fn next_u32(&mut self) -> u32 {
        self.1 += 1;
        self.0.next_u32()
    }
}

/// A rejection or config error of the fixtures' `reject:<code>`.
fn rejection(code: &str) -> Error<String> {
    match code {
        "circuit-open" => Error::CircuitOpen {
            name: "x".into(),
            retry_after_ms: 0,
            state: CircuitState::Open,
        },
        "rate-limited" => Error::RateLimited {
            name: "x".into(),
            limit: 1,
            window_ms: 1,
            retry_after_ms: 1,
        },
        "bulkhead-full" => Error::BulkheadFull {
            name: "x".into(),
            concurrent: 1,
            queued: 0,
        },
        "config" => Error::Config(ConfigError::new("x", "bad")),
        other => panic!("unknown rejection {other}"),
    }
}

#[test]
fn retry() {
    let f = load("retry");
    for c in f["delays"].as_array().unwrap() {
        let name = c["name"].as_str().unwrap();
        let policy = policy_of(&c["policy"]).unwrap();
        let mut rng = Mulberry32::new(c["seed"].as_u64().map_or(0, |s| s as u32));
        let mut counting = Counting(&mut rng, 0);
        let got: Vec<u64> = c["ks"]
            .as_array()
            .unwrap()
            .iter()
            .map(|k| retry_delay(k.as_u64().unwrap() as u32, &policy, &mut counting))
            .collect();
        let want: Vec<u64> = c["delays"]
            .as_array()
            .unwrap()
            .iter()
            .map(|v| v.as_u64().unwrap())
            .collect();
        assert_eq!(got, want, "{name}");
        let draws = if policy.jitter == Jitter::Half {
            want.len() as u32
        } else {
            0
        };
        assert_eq!(
            counting.1, draws,
            "{name}: one draw per retry, only with jitter"
        );
    }
    for c in f["runs"].as_array().unwrap() {
        let name = c["name"].as_str().unwrap();
        let policy = policy_of(&c["config"]).unwrap();
        let rt = Virtual::new();
        let mut rng = Mulberry32::new(c["seed"].as_u64().unwrap() as u32);
        let outcomes: Vec<String> = c["outcomes"]
            .as_array()
            .unwrap()
            .iter()
            .map(|o| o.as_str().unwrap().to_owned())
            .collect();
        let attempts = RefCell::new(0u32);
        let r: Result<String, Error<String>> = block_on(
            &rt,
            with_retry(&rt, &policy, &mut rng, |attempt| {
                *attempts.borrow_mut() = attempt;
                let o = outcomes
                    .get(attempt as usize - 1)
                    .cloned()
                    .unwrap_or_else(|| "ok".to_owned());
                async move {
                    match o.split_once(':') {
                        None => Ok("ok".to_owned()),
                        Some(("fail", code)) => Err(Error::Op(code.to_owned())),
                        Some((_, code)) => Err(rejection(code)),
                    }
                }
            }),
        );
        assert_eq!(
            outcome(&r),
            c["expect"]["result"].as_str().unwrap(),
            "{name}"
        );
        assert_eq!(
            u64::from(*attempts.borrow()),
            c["expect"]["attempts"].as_u64().unwrap(),
            "{name}"
        );
        assert_eq!(rt.now(), c["expect"]["now"].as_u64().unwrap(), "{name}");
        if let Some(code) = c["expect"]["lastErrorCode"].as_str() {
            match &r {
                Err(Error::RetriesExhausted { attempts, last }) => {
                    assert_eq!(last.code(), code, "{name}");
                    assert_eq!(
                        u64::from(*attempts),
                        c["expect"]["attempts"].as_u64().unwrap()
                    );
                }
                other => panic!("{name}: expected RetriesExhausted, got {other:?}"),
            }
        }
    }
    for c in f["configErrors"].as_array().unwrap() {
        let Some(policy) = policy_of(c) else {
            continue; // not representable (or an unknown jitter name, a parse error in Rust)
        };
        assert!(policy.validate().is_err(), "config error {c}");
    }
}

fn limiter_config(v: &Value) -> Option<RateLimiterConfig> {
    let mut c = RateLimiterConfig::new(v["name"].as_str().unwrap());
    if let Some(x) = v.get("limit") {
        c.limit = x.as_u64()?;
    }
    if let Some(x) = v.get("windowMs") {
        c.window_ms = x.as_u64()?;
    }
    if let Some(x) = v.get("burstAllowance") {
        c.burst_allowance = x.as_u64()?;
    }
    if let Some(x) = v.get("queueExcess") {
        c.queue_excess = x.as_bool()?;
    }
    if let Some(x) = v.get("maxWaitMs") {
        c.max_wait_ms = x.as_u64()?;
    }
    Some(c)
}

#[test]
fn rate_limiter() {
    let f = load("rate-limiter");
    for c in f["cases"].as_array().unwrap() {
        let name = c["name"].as_str().unwrap();
        let mut core = RateLimiterCore::new(
            limiter_config(&c["config"]).unwrap(),
            c["start"].as_u64().unwrap(),
        )
        .unwrap();
        for step in c["steps"].as_array().unwrap() {
            let at = step["at"].as_u64().unwrap();
            for _ in 0..step.get("repeat").and_then(Value::as_u64).unwrap_or(1) {
                match step["op"].as_str().unwrap() {
                    "acquire" => {
                        let want = if step["expect"]["ok"].as_bool().unwrap() {
                            RateAcquire::Ok {
                                wait_ms: step["expect"]["waitMs"].as_u64().unwrap(),
                            }
                        } else {
                            RateAcquire::Rejected {
                                retry_after_ms: step["expect"]["retryAfterMs"].as_u64().unwrap(),
                            }
                        };
                        assert_eq!(core.try_acquire(at), want, "{name}: acquire@{at}");
                    }
                    "remaining" => assert_eq!(
                        core.remaining(at),
                        step["expect"].as_u64().unwrap(),
                        "{name}: remaining@{at}"
                    ),
                    "retryAfter" => assert_eq!(
                        core.retry_after_ms(at),
                        step["expect"].as_u64().unwrap(),
                        "{name}: retryAfter@{at}"
                    ),
                    "reset" => core.reset(at),
                    other => panic!("unknown op {other}"),
                }
            }
        }
    }
    for c in f["configErrors"].as_array().unwrap() {
        let Some(config) = limiter_config(c) else {
            continue;
        };
        assert!(RateLimiterCore::new(config, 0).is_err(), "config error {c}");
    }
}

fn bulkhead_config(v: &Value) -> Option<BulkheadConfig> {
    let mut c = BulkheadConfig::new(v["name"].as_str().unwrap());
    if let Some(x) = v.get("maxConcurrent") {
        c.max_concurrent = usize::try_from(x.as_u64()?).ok()?;
    }
    if let Some(x) = v.get("maxQueue") {
        c.max_queue = usize::try_from(x.as_u64()?).ok()?;
    }
    if let Some(x) = v.get("maxQueueWaitMs") {
        c.max_queue_wait_ms = x.as_u64()?;
    }
    Some(c)
}

#[test]
fn bulkhead() {
    let f = load("bulkhead");
    for c in f["cases"].as_array().unwrap() {
        let name = c["name"].as_str().unwrap();
        let mut core = BulkheadCore::new(bulkhead_config(&c["config"]).unwrap()).unwrap();
        for step in c["steps"].as_array().unwrap() {
            match step["op"].as_str().unwrap() {
                "enter" => {
                    let got = match core.try_enter() {
                        Entry::Admitted => Value::from("admitted"),
                        Entry::Rejected => Value::from("rejected"),
                        Entry::Queued(t) => serde_json::json!({ "queued": t }),
                    };
                    assert_eq!(got, step["expect"], "{name}: enter");
                }
                "release" => assert_eq!(core.release(), step["expect"].as_u64(), "{name}: release"),
                "expire" => assert_eq!(
                    core.expire(step["ticket"].as_u64().unwrap()),
                    step["expect"].as_bool().unwrap(),
                    "{name}: expire"
                ),
                "metrics" => {
                    let m = core.metrics();
                    let got = serde_json::json!({
                        "concurrent": m.concurrent, "queued": m.queued,
                        "maxConcurrent": m.max_concurrent, "maxQueue": m.max_queue,
                    });
                    assert_eq!(got, step["expect"], "{name}: metrics");
                }
                other => panic!("unknown op {other}"),
            }
        }
    }
    for c in f["runs"].as_array().unwrap() {
        let name = c["name"].as_str().unwrap();
        let rt = Virtual::new();
        let bulkhead = Bulkhead::new(bulkhead_config(&c["config"]).unwrap()).unwrap();
        let calls: Vec<_> = c["calls"]
            .as_array()
            .unwrap()
            .iter()
            .map(|call| {
                let d = call["durationMs"].as_u64().unwrap();
                let (rt, bulkhead) = (&rt, &bulkhead);
                async move {
                    let r: Result<String, Error<String>> = bulkhead
                        .execute(rt, || async move {
                            rt.sleep(d).await;
                            Ok("ok".to_owned())
                        })
                        .await;
                    serde_json::json!({ "outcome": outcome(&r), "end": rt.now() })
                }
            })
            .collect();
        let got = block_on(&rt, join_all(calls));
        assert_eq!(Value::from(got), c["expect"], "{name}");
        assert_eq!(rt.pending(), 0, "{name}");
    }
    for c in f["configErrors"].as_array().unwrap() {
        let Some(config) = bulkhead_config(c) else {
            continue;
        };
        assert!(BulkheadCore::new(config).is_err(), "config error {c}");
    }
}

fn timed_stage<'a>(
    rt: &'a Virtual,
    name: &str,
    duration: u64,
    outcome: &str,
) -> Stage<'a, String, String> {
    let (kind, rest) = outcome.split_once(':').unwrap();
    let (kind, rest) = (kind.to_owned(), rest.to_owned());
    Stage::new(name, move || {
        let (kind, rest) = (kind.clone(), rest.clone());
        async move {
            rt.sleep(duration).await;
            if kind == "fail" {
                Err(Error::Op(rest))
            } else {
                Ok(rest)
            }
        }
    })
}

#[test]
fn fallback_chain() {
    let f = load("fallback-chain");
    for c in f["cases"].as_array().unwrap() {
        let name = c["name"].as_str().unwrap();
        let rt = Virtual::new();
        let stages: Vec<Stage<'_, String, String>> = c["stages"]
            .as_array()
            .unwrap()
            .iter()
            .map(|s| {
                let stage = timed_stage(
                    &rt,
                    s["name"].as_str().unwrap(),
                    s["durationMs"].as_u64().unwrap(),
                    s["outcome"].as_str().unwrap(),
                );
                match s.get("timeoutMs").and_then(Value::as_u64) {
                    Some(ms) => stage.with_timeout(ms),
                    None => stage,
                }
            })
            .collect();
        let r = block_on(&rt, with_fallback_result(&rt, &stages));
        let e = &c["expect"];
        match (e.get("error").and_then(Value::as_str), r) {
            (Some(code), Err(err)) => {
                assert_eq!(err.code(), code, "{name}");
                if let Error::AllStagesFailed { stage_errors } = err {
                    let want: Vec<StageError> = e["stageErrors"]
                        .as_array()
                        .unwrap()
                        .iter()
                        .map(|s| StageError {
                            stage: s["stage"].as_str().unwrap().into(),
                            code: s["code"].as_str().unwrap().into(),
                        })
                        .collect();
                    assert_eq!(stage_errors, want, "{name}");
                }
            }
            (None, Ok(served)) => {
                assert_eq!(served.value, e["value"].as_str().unwrap(), "{name}");
                assert_eq!(served.stage, e["stage"].as_str().unwrap(), "{name}");
                assert_eq!(served.index as u64, e["index"].as_u64().unwrap(), "{name}");
            }
            (want, got) => panic!("{name}: expected {want:?}, got {got:?}"),
        }
        if let Some(now) = e.get("now").and_then(Value::as_u64) {
            assert_eq!(rt.now(), now, "{name}");
        }
        assert_eq!(rt.pending(), 0, "{name}");
    }
}

fn fault_of(v: &Value) -> Option<Fault> {
    if v.is_null() {
        return None;
    }
    Some(match v["kind"].as_str().unwrap() {
        "error" => Fault::Error,
        "latency" => Fault::Latency {
            ms: v["ms"].as_u64().unwrap(),
        },
        "timeout" => Fault::Timeout,
        "drop" => Fault::Drop,
        "truncate" => Fault::Truncate,
        "malformed" => Fault::Malformed,
        other => panic!("unknown fault {other}"),
    })
}

fn resilience_config(v: &Value) -> Option<ResilienceConfig> {
    let mut c = ResilienceConfig::new(v["name"].as_str().unwrap());
    if let Some(x) = v.get("timeoutMs") {
        c.timeout_ms = Some(x.as_u64()?);
    }
    if let Some(x) = v.get("retry") {
        c.retry = Some(policy_of(x)?);
    }
    if let Some(x) = v.get("circuitBreaker") {
        let mut b = x.clone();
        b["name"] = v["name"].clone();
        c.circuit_breaker = Some(breaker_config(&b)?);
    }
    if let Some(x) = v.get("rateLimiter") {
        let mut l = x.clone();
        l["name"] = v["name"].clone();
        c.rate_limiter = Some(limiter_config(&l)?);
    }
    Some(c)
}

/// The TypeScript defaults for a string: truncate halves it, malformed is the marker.
fn ts_mutate(value: String, kind: MutateKind) -> String {
    match kind {
        MutateKind::Truncate => truncate_str(&value),
        MutateKind::Malformed => MALFORMED_MARKER.to_owned(),
    }
}

#[test]
fn mzizi_resilience_composed() {
    let f = load("mzizi-resilience");
    for s in f["scenarios"].as_array().unwrap() {
        let name = s["name"].as_str().unwrap();
        let rt = Virtual::new();
        let config = resilience_config(&s["config"]).unwrap();
        let health = Rc::new(RefCell::new(HealthMonitor::new()));
        let schedule: Vec<Option<Fault>> = s["schedule"]
            .as_array()
            .unwrap()
            .iter()
            .map(fault_of)
            .collect();
        let mut pipeline: Resilience<'_, String, String> = Resilience::new(config)
            .unwrap()
            .with_faults(FaultSchedule::new(schedule))
            .with_mutate(ts_mutate)
            .with_health(Rc::clone(&health))
            .with_random(Mulberry32::new(0));
        for fb in s["config"]["fallbacks"].as_array().unwrap() {
            let value = format!("ok:{}", fb["value"].as_str().unwrap());
            pipeline = pipeline
                .with_fallback(timed_stage(
                    &rt,
                    fb["name"].as_str().unwrap(),
                    fb["durationMs"].as_u64().unwrap(),
                    &value,
                ))
                .unwrap();
        }
        if let Some(equals) = s["config"]["validate"]["equals"].as_str() {
            let equals = equals.to_owned();
            pipeline = pipeline.with_validate(move |v: &String| *v == equals);
        }
        let op_ms = s["operation"]["durationMs"].as_u64().unwrap();
        let op_value = s["operation"]["value"].as_str().unwrap().to_owned();

        for (i, call) in s["calls"].as_array().unwrap().iter().enumerate() {
            rt.advance_to(call["at"].as_u64().unwrap());
            let rt_ref = &rt;
            let op_value = &op_value;
            let r = block_on(
                &rt,
                pipeline.execute(&rt, || async move {
                    rt_ref.sleep(op_ms).await;
                    Ok(op_value.clone())
                }),
            );
            let summary = pipeline.last_call().unwrap();
            let report = health.borrow().get(pipeline.name()).cloned().unwrap();
            let now = rt.now();
            let mut got = serde_json::json!({
                "served": match &r { Ok(o) => o.source.clone(), Err(e) => format!("error:{}", e.code()) },
                "attempts": summary.attempts,
                "circuitState": pipeline.breaker().map(|b| b.state(now).as_str()),
                "health": health.borrow().system_health().as_str(),
                "errorCount": report.error_count,
                "lastErrorCode": report.last_error_code,
                "now": now,
            });
            if let Ok(o) = &r {
                got["value"] = Value::from(o.value.clone());
            }
            assert_eq!(got, call["expect"], "{name}: call {i}");
            assert_eq!(
                report.status.as_str(),
                call["expect"]["health"].as_str().unwrap()
            );
            assert_eq!(
                report.circuit_state.map(CircuitState::as_str),
                call["expect"]["circuitState"].as_str()
            );
            assert_eq!(rt.pending(), 0, "{name}: call {i}: no timer left armed");
        }
    }
    for c in f["configErrors"].as_array().unwrap() {
        let Some(config) = resilience_config(c) else {
            continue;
        };
        let rt = Virtual::new();
        let built = Resilience::<'_, String, String>::new(config).and_then(|p| {
            c.get("fallbacks")
                .and_then(Value::as_array)
                .into_iter()
                .flatten()
                .try_fold(p, |p, fb| {
                    p.with_fallback(timed_stage(&rt, fb["name"].as_str().unwrap(), 0, "ok:v"))
                })
        });
        assert!(built.is_err(), "config error {c}");
    }
}
