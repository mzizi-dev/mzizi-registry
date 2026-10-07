//! Unit tests for the Rust build beyond the shared fixtures: cancellation (a dropped future
//! gives back what it held), validation errors, the fault hook without a mutate hook, the
//! health monitor, and that no error text carries the operation's message.

mod support;

use std::cell::Cell;
use std::future::Future;
use std::pin::Pin;
use std::rc::Rc;
use std::task::{Context, Poll};

use mzizi_resilience::bulkhead::{Bulkhead, BulkheadConfig};
use mzizi_resilience::circuit_breaker::{CircuitBreaker, CircuitBreakerConfig, CircuitState};
use mzizi_resilience::mzizi_resilience::{
    HealthUpdate, MutateKind, truncate_str, truncate_vec, worst_health,
};
use mzizi_resilience::rate_limiter::{RateLimiter, RateLimiterConfig};
use mzizi_resilience::resilience_core::{ErrorCode, safe_code};
use mzizi_resilience::rng::{hits, probability_threshold};
use mzizi_resilience::timeout::{timeout_outcome, with_timeout};
use mzizi_resilience::{
    Error, Fault, HealthMonitor, HealthStatus, Resilience, ResilienceConfig, Runtime, apply_fault,
};
use support::{Virtual, block_on, join_all};

/// Sets its flag when dropped.
struct DropFlag(Rc<Cell<bool>>);

impl Drop for DropFlag {
    fn drop(&mut self) {
        self.0.set(true);
    }
}

/// Never completes; holds a DropFlag.
struct Forever(#[allow(dead_code)] DropFlag);

impl Future for Forever {
    type Output = Result<u32, Error<String>>;
    fn poll(self: Pin<&mut Self>, _cx: &mut Context<'_>) -> Poll<Self::Output> {
        Poll::Pending
    }
}

#[test]
fn a_timeout_drops_the_operation() {
    let rt = Virtual::new();
    let dropped = Rc::new(Cell::new(false));
    let r = block_on(
        &rt,
        with_timeout(&rt, 50, Forever(DropFlag(Rc::clone(&dropped)))),
    );
    assert_eq!(r, Err(Error::Timeout { duration_ms: 50 }));
    assert!(
        dropped.get(),
        "the operation's future was dropped (cancelled)"
    );
    assert_eq!(rt.now(), 50);
    assert!(timeout_outcome(5, 5).unwrap().timed_out);
    assert!(timeout_outcome(5, 0).is_err());
}

#[test]
fn a_cancelled_half_open_probe_frees_its_slot() {
    let rt = Virtual::new();
    let breaker = CircuitBreaker::new(CircuitBreakerConfig {
        failure_threshold: 1,
        cooldown_ms: 10,
        ..CircuitBreakerConfig::new("dep")
    })
    .unwrap();
    let r: Result<u32, Error<String>> = block_on(
        &rt,
        breaker.execute(&rt, || async { Err(Error::Op("boom".into())) }),
    );
    assert!(r.is_err());
    rt.advance_to(10);
    // The probe times out (its future is dropped) before it reports.
    let r: Result<u32, Error<String>> = block_on(
        &rt,
        with_timeout(
            &rt,
            5,
            breaker.execute(&rt, || async { std::future::pending().await }),
        ),
    );
    assert_eq!(r.unwrap_err().code(), "timeout");
    assert_eq!(breaker.with_core(|c| c.probes_in_flight()), 0);
    // So the next probe is admitted and can close the circuit.
    let r: Result<u32, Error<String>> = block_on(&rt, breaker.execute(&rt, || async { Ok(1) }));
    assert_eq!(r, Ok(1));
    assert_eq!(breaker.state(rt.now()), CircuitState::Closed);
}

#[test]
fn a_cancelled_call_gives_its_bulkhead_slot_and_queue_place_back() {
    let rt = Virtual::new();
    let b = Bulkhead::new(BulkheadConfig {
        max_concurrent: 1,
        max_queue: 1,
        max_queue_wait_ms: 1_000,
        ..BulkheadConfig::new("db")
    })
    .unwrap();
    // One running call (cancelled at 10 ms) and one queued call (cancelled at 5 ms, while
    // it still waits).
    type Call<'a> = Pin<Box<dyn Future<Output = Result<u32, Error<String>>> + 'a>>;
    let calls: Vec<Call<'_>> = vec![
        Box::pin(with_timeout(
            &rt,
            10,
            b.execute(&rt, || async { std::future::pending().await }),
        )),
        Box::pin(with_timeout(&rt, 5, b.execute(&rt, || async { Ok(2) }))),
    ];
    let results = block_on(&rt, join_all(calls));
    assert!(
        results
            .iter()
            .all(|r| r.as_ref().unwrap_err().code() == "timeout")
    );
    let m = b.metrics();
    assert_eq!((m.concurrent, m.queued), (0, 0));
    let r: Result<u32, Error<String>> = block_on(&rt, b.execute(&rt, || async { Ok(3) }));
    assert_eq!(r, Ok(3));
}

#[test]
fn a_queued_rate_limited_call_sleeps_its_wait() {
    let rt = Virtual::new();
    let l = RateLimiter::new(RateLimiterConfig {
        limit: 1,
        window_ms: 100,
        queue_excess: true,
        max_wait_ms: 500,
        ..RateLimiterConfig::new("api")
    })
    .unwrap();
    let rt_ref = &rt;
    let calls: Vec<_> = (0..3)
        .map(|_| {
            l.execute(&rt, move || async move {
                Ok::<u64, Error<String>>(rt_ref.now())
            })
        })
        .collect();
    let starts: Vec<u64> = block_on(&rt, join_all(calls))
        .into_iter()
        .map(Result::unwrap)
        .collect();
    assert_eq!(starts, vec![0, 100, 200]);
}

#[test]
fn config_errors_are_returned_at_construction() {
    assert!(
        CircuitBreaker::new(CircuitBreakerConfig {
            failure_threshold: 0,
            ..CircuitBreakerConfig::new("x")
        })
        .is_err()
    );
    assert!(
        Bulkhead::new(BulkheadConfig {
            max_concurrent: 0,
            ..BulkheadConfig::new("x")
        })
        .is_err()
    );
    assert!(
        RateLimiter::new(RateLimiterConfig {
            window_ms: 0,
            ..RateLimiterConfig::new("x")
        })
        .is_err()
    );
    let mut c = ResilienceConfig::new("x");
    c.timeout_ms = Some(0);
    assert_eq!(
        Resilience::<'_, u32, String>::new(c).unwrap_err().option,
        "timeout_ms"
    );
    assert!(probability_threshold(1.5).is_err());
    assert!(probability_threshold(f64::NAN).is_err());
    assert_eq!(probability_threshold(0.5).unwrap(), 2_147_483_648);
    assert!(hits(u32::MAX, 1.0).unwrap());
    assert!(!hits(0, 0.0).unwrap());
}

#[test]
fn faults_without_a_mutate_hook() {
    let rt = Virtual::new();
    let run = |fault| {
        block_on(
            &rt,
            apply_fault(
                &rt,
                Some(fault),
                || async { Ok::<String, Error<String>>("abcd".into()) },
                None,
            ),
        )
    };
    assert_eq!(run(Fault::Error).unwrap_err().code(), "chaos");
    assert_eq!(run(Fault::Drop).unwrap_err().code(), "chaos");
    assert_eq!(run(Fault::Truncate).unwrap_err().code(), "chaos");
    assert_eq!(run(Fault::Malformed).unwrap_err().code(), "malformed");
    assert_eq!(run(Fault::Latency { ms: 30 }).unwrap(), "abcd");
    assert_eq!(rt.now(), 30);
    let hung: Result<String, Error<String>> = block_on(
        &rt,
        with_timeout(
            &rt,
            5,
            apply_fault(&rt, Some(Fault::Timeout), || async { Ok("x".into()) }, None),
        ),
    );
    assert_eq!(hung.unwrap_err().code(), "timeout");
    let mutate = |v: String, k: MutateKind| match k {
        MutateKind::Truncate => truncate_str(&v),
        MutateKind::Malformed => String::new(),
    };
    let cut: Result<String, Error<String>> = block_on(
        &rt,
        apply_fault(
            &rt,
            Some(Fault::Truncate),
            || async { Ok("abcdef".into()) },
            Some(&mutate),
        ),
    );
    assert_eq!(cut.unwrap(), "abc");
    assert_eq!(truncate_vec(vec![1, 2, 3]), vec![1]);
    assert_eq!(truncate_str("héllo"), "hé");
}

#[test]
fn errors_carry_codes_not_messages() {
    let e: Error<String> = Error::Op("contains a secret value".into());
    assert_eq!(e.code(), "error");
    assert!(!e.to_string().contains("secret"));
    let e: Error<String> = Error::RetriesExhausted {
        attempts: 2,
        last: Box::new(Error::Op("db-down".into())),
    };
    assert_eq!(e.to_string(), "all 2 attempts failed (last: db-down)");
    assert_eq!(safe_code("http-503"), "http-503");
    assert_eq!(safe_code("-bad"), "error");
    assert_eq!(().error_code(), "error");
    assert!(
        Error::<()>::RateLimited {
            name: "x".into(),
            limit: 1,
            window_ms: 1,
            retry_after_ms: 0
        }
        .is_rejection()
    );
}

#[test]
fn health_monitor() {
    assert_eq!(worst_health([]), HealthStatus::Loading);
    assert_eq!(
        worst_health([
            HealthStatus::Healthy,
            HealthStatus::Degraded,
            HealthStatus::Loading
        ]),
        HealthStatus::Degraded
    );
    let mut m = HealthMonitor::new();
    assert_eq!(m.system_health(), HealthStatus::Loading);
    m.report(
        "a",
        HealthUpdate {
            status: Some(HealthStatus::Healthy),
            ..HealthUpdate::default()
        },
        5,
    );
    assert_eq!(m.system_health(), HealthStatus::Healthy);
    let r = m.record_error("a", "db down with spaces", 6).clone();
    assert_eq!(r.error_count, 1);
    assert_eq!(r.last_error_code.as_deref(), Some("error"));
    assert_eq!(r.updated_at, 6);
    assert_eq!(m.record_recovery("a", 7).status, HealthStatus::Healthy);
    m.remove("a");
    assert_eq!(m.reports().count(), 0);
}

#[test]
fn the_pipeline_without_fallbacks_returns_the_primary_error() {
    let rt = Virtual::new();
    let mut config = ResilienceConfig::new("x");
    config.retry = None;
    let p: Resilience<'_, u32, String> = Resilience::new(config).unwrap();
    let r = block_on(
        &rt,
        p.execute(&rt, || async { Err(Error::Op("boom".into())) }),
    );
    assert_eq!(r.unwrap_err().code(), "boom");
    let summary = p.last_call().unwrap();
    assert_eq!(
        (summary.source, summary.attempts, summary.code.as_deref()),
        (None, 1, Some("boom"))
    );
    assert_eq!(
        p.health().borrow().get("x").unwrap().status,
        HealthStatus::Error
    );
    let ok = block_on(&rt, p.run(&rt, || async { Ok(7) }));
    assert_eq!(ok, Ok(7));
    assert_eq!(rt.now_ms(), 0);
}
