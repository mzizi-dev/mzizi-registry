//! The shared resilience fixtures for N8 (mzizi-registry#472).
//!
//! `__tests__/fixtures/resilience/chaos.cases.json` and
//! `observability.cases.json` are the arbiters. The TypeScript builds run the
//! same files under vitest (`__tests__/lib/chaos.test.ts`,
//! `__tests__/lib/observability.test.ts`); every case must come out identical.

use std::fs;
use std::path::PathBuf;

use serde_json::Value as Json;

use mzizi_assurance::chaos::{
    ChaosBuildError, ChaosConfig, ChaosEngine, Environment, Fault, FaultInjector, FaultKind,
    FaultSpec, LEGACY_ERROR_RATE, LEGACY_LATENCY_MS, MALFORMED_MARKER, truncate_slice,
    truncate_str,
};
use mzizi_assurance::observability::{
    ErrorSummary, Level, LogContext, LogEvent, Logger, MemorySink, Value, is_sensitive_key, redact,
};

fn fixture(name: &str) -> Json {
    let path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("../../../__tests__/fixtures/resilience")
        .join(name);
    let text = fs::read_to_string(&path).unwrap_or_else(|e| panic!("read {}: {e}", path.display()));
    serde_json::from_str(&text).expect("fixture is JSON")
}

// ── chaos ────────────────────────────────────────────────────────────────

/// A u64 millisecond value, or why it is not one (the `.ts` rejects the same).
fn ms(v: &Json) -> Result<u64, String> {
    v.as_u64()
        .ok_or_else(|| format!("{v} is not a non-negative integer"))
}

fn fault_from_json(v: &Json) -> Result<Option<Fault>, String> {
    if v.is_null() {
        return Ok(None);
    }
    let kind = v["kind"]
        .as_str()
        .and_then(FaultKind::parse)
        .ok_or("unknown fault kind")?;
    Ok(Some(match kind {
        FaultKind::Error => Fault::Error,
        FaultKind::Latency => Fault::Latency { ms: ms(&v["ms"])? },
        FaultKind::Timeout => Fault::Timeout,
        FaultKind::Drop => Fault::Drop,
        FaultKind::Truncate => Fault::Truncate,
        FaultKind::Malformed => Fault::Malformed,
    }))
}

fn fault_to_json(f: Option<Fault>) -> Json {
    match f {
        None => Json::Null,
        Some(Fault::Latency { ms }) => serde_json::json!({ "kind": "latency", "ms": ms }),
        Some(other) => serde_json::json!({ "kind": other.kind().as_str() }),
    }
}

fn rate(v: &Json) -> Result<f64, String> {
    v.as_f64().ok_or_else(|| "rate is not a number".to_owned())
}

/// The host's side of the contract: turn the fixture's JSON config into a
/// [`ChaosConfig`]. A value the Rust types cannot hold (a negative or
/// fractional millisecond, a seed outside u32, an unknown kind) is the same
/// `config` error the `.ts` raises for it.
fn config_from_json(c: &Json) -> Result<ChaosConfig, String> {
    let has_faults = !c["faults"].is_null();
    let has_legacy = !c["errorRate"].is_null() || !c["latencyMs"].is_null();
    if has_faults && has_legacy {
        return Err("give faults, or errorRate/latencyMs, not both".to_owned());
    }
    let seed = match &c["seed"] {
        Json::Null => 0,
        v => v
            .as_u64()
            .and_then(|s| u32::try_from(s).ok())
            .ok_or("seed must be an unsigned 32-bit integer")?,
    };
    let enabled = c["enabled"].as_bool().unwrap_or(false);
    let mut config = if has_faults {
        let mut faults = Vec::new();
        for f in c["faults"].as_array().ok_or("faults must be a list")? {
            let kind = f["kind"]
                .as_str()
                .and_then(FaultKind::parse)
                .ok_or("unknown fault kind")?;
            faults.push(if kind == FaultKind::Latency {
                FaultSpec::latency(rate(&f["rate"])?, ms(&f["minMs"])?, ms(&f["maxMs"])?)
            } else {
                FaultSpec::new(kind, rate(&f["rate"])?)
            });
        }
        ChaosConfig {
            enabled,
            faults,
            ..ChaosConfig::default()
        }
    } else {
        let error_rate = match &c["errorRate"] {
            Json::Null => LEGACY_ERROR_RATE,
            v => rate(v)?,
        };
        if !(0.0..=1.0).contains(&error_rate) {
            return Err("errorRate must be in [0, 1]".to_owned());
        }
        let latency = match &c["latencyMs"] {
            Json::Null => LEGACY_LATENCY_MS,
            v => (ms(&v[0])?, ms(&v[1])?),
        };
        ChaosConfig::legacy(enabled, error_rate, latency)
    };
    config.seed = seed;
    if let Some(schedule) = c["schedule"].as_array() {
        config.schedule = schedule
            .iter()
            .map(fault_from_json)
            .collect::<Result<_, _>>()?;
    }
    config.environment = match c["environment"].as_str() {
        None => None,
        Some(name) => Some(Environment::parse(name).ok_or("unknown environment")?),
    };
    Ok(config)
}

/// Build as the `.ts` constructor does: the production guard first, then
/// validation. Returns the error code on failure.
fn build(c: &Json) -> Result<ChaosEngine, &'static str> {
    let enabled = c["enabled"].as_bool().unwrap_or(false);
    let production = c["environment"]
        .as_str()
        .and_then(Environment::parse)
        .is_some_and(|e| e == Environment::Production);
    if enabled && production {
        // The guard runs before the config is even read, as in the `.ts`.
        return ChaosEngine::new(ChaosConfig {
            enabled: true,
            environment: Some(Environment::Production),
            ..ChaosConfig::default()
        })
        .map_err(|e| e.code());
    }
    let config = config_from_json(c).map_err(|_| "config")?;
    ChaosEngine::new(config).map_err(|e| e.code())
}

#[test]
fn chaos_decisions_match_the_fixture() {
    let fx = fixture("chaos.cases.json");
    let cases = fx["decisions"].as_array().unwrap();
    assert!(cases.len() >= 10, "the fixture lost its decision cases");
    for case in cases {
        let name = case["name"].as_str().unwrap();
        let mut engine = build(&case["config"]).unwrap_or_else(|e| panic!("{name}: {e}"));
        let n = case["invocations"].as_u64().unwrap();
        // Through the trait, as the N5 pipeline calls it.
        let injector: &mut dyn FaultInjector = &mut engine;
        let got: Vec<Json> = (0..n).map(|_| fault_to_json(injector.decide())).collect();
        assert_eq!(Json::Array(got), case["expected"], "{name}");
    }
}

#[test]
fn chaos_legacy_mapping_matches_the_fixture() {
    let fx = fixture("chaos.cases.json");
    for case in fx["legacyMapping"].as_array().unwrap() {
        let name = case["name"].as_str().unwrap();
        let config = config_from_json(&case["config"]).unwrap();
        let got: Vec<Json> = config
            .faults
            .iter()
            .map(|f| {
                if f.kind == FaultKind::Latency {
                    serde_json::json!({ "kind": "latency", "rate": f.rate, "minMs": f.min_ms, "maxMs": f.max_ms })
                } else {
                    serde_json::json!({ "kind": f.kind.as_str(), "rate": f.rate })
                }
            })
            .collect();
        // JSON writes 1.0 as 1; compare rates as numbers.
        let expected: Vec<Json> = case["faults"]
            .as_array()
            .unwrap()
            .iter()
            .map(|f| {
                let mut f = f.clone();
                f["rate"] = Json::from(f["rate"].as_f64().unwrap());
                f
            })
            .collect();
        assert_eq!(got, expected, "{name}");
    }
}

#[test]
fn chaos_validation_matches_the_fixture() {
    let fx = fixture("chaos.cases.json");
    for case in fx["validation"].as_array().unwrap() {
        let name = case["name"].as_str().unwrap();
        let got = build(&case["config"]).err();
        assert_eq!(got, case["error"].as_str(), "{name}");
    }
}

#[test]
fn chaos_production_guard_matches_the_fixture() {
    let fx = fixture("chaos.cases.json");
    for case in fx["productionGuard"].as_array().unwrap() {
        let name = case["name"].as_str().unwrap();
        match build(&case["config"]) {
            Ok(mut engine) => {
                assert_eq!(case["error"], "none", "{name}");
                assert_eq!(fault_to_json(engine.decide()), case["first"], "{name}");
            }
            Err(code) => assert_eq!(case["error"], code, "{name}"),
        }
    }
}

#[test]
fn chaos_production_guard_has_no_override() {
    let enabled_in = |environment| ChaosConfig {
        enabled: true,
        environment,
        ..ChaosConfig::default()
    };
    assert!(matches!(
        ChaosEngine::new(enabled_in(Some(Environment::Production))),
        Err(ChaosBuildError::Forbidden(_))
    ));
    // No environment given: production exactly when this is a release build.
    assert_eq!(
        ChaosEngine::new(enabled_in(None)).is_err(),
        cfg!(not(debug_assertions))
    );
    assert!(ChaosEngine::new(enabled_in(Some(Environment::Staging))).is_ok());
    // Disabled is always allowed, and inert.
    let mut off = ChaosEngine::new(ChaosConfig {
        enabled: false,
        environment: Some(Environment::Production),
        faults: vec![FaultSpec::new(FaultKind::Error, 1.0)],
        ..ChaosConfig::default()
    })
    .unwrap();
    assert_eq!(off.decide(), None);
    assert_eq!(off.invocations(), 0);
}

#[test]
fn chaos_truncation_matches_the_fixture() {
    let fx = fixture("chaos.cases.json");
    assert_eq!(fx["malformedMarker"], MALFORMED_MARKER);
    for case in fx["truncate"].as_array().unwrap() {
        match &case["input"] {
            Json::String(s) => assert_eq!(truncate_str(s), case["expected"], "{s:?}"),
            Json::Array(items) => {
                assert_eq!(
                    Json::Array(truncate_slice(items).to_vec()),
                    case["expected"]
                );
            }
            other => panic!("unexpected truncate input {other}"),
        }
    }
}

// ── observability ────────────────────────────────────────────────────────

/// Fixture JSON to a [`Value`]; `{"$error": {...}}` is an error.
fn value_from_json(v: &Json) -> Value {
    match v {
        Json::Null => Value::Null,
        Json::Bool(b) => Value::Bool(*b),
        Json::Number(n) => n
            .as_i64()
            .map_or_else(|| Value::Float(n.as_f64().unwrap()), Value::Int),
        Json::String(s) => Value::Str(s.clone()),
        Json::Array(items) => Value::List(items.iter().map(value_from_json).collect()),
        Json::Object(map) => {
            if let Some(e) = map.get("$error") {
                return Value::Error(error_from_json(e));
            }
            Value::Map(
                map.iter()
                    .map(|(k, v)| (k.clone(), value_from_json(v)))
                    .collect(),
            )
        }
    }
}

fn error_from_json(e: &Json) -> ErrorSummary {
    ErrorSummary::new(e["name"].as_str().unwrap(), e["code"].as_str())
}

fn value_to_json(v: &Value) -> Json {
    match v {
        Value::Null => Json::Null,
        Value::Bool(b) => Json::Bool(*b),
        Value::Int(i) => Json::from(*i),
        Value::Float(f) => Json::from(*f),
        Value::Str(s) => Json::String(s.clone()),
        Value::List(items) => Json::Array(items.iter().map(value_to_json).collect()),
        Value::Map(fields) => Json::Object(
            fields
                .iter()
                .map(|(k, v)| (k.clone(), value_to_json(v)))
                .collect(),
        ),
        Value::Error(e) => value_to_json(&redact(&Value::Error(e.clone()))),
    }
}

fn ctx_from_json(c: &Json) -> LogContext {
    LogContext {
        module: c["module"].as_str().map(str::to_owned),
        data: c["data"].as_object().map(|m| {
            m.iter()
                .map(|(k, v)| (k.clone(), value_from_json(v)))
                .collect()
        }),
        error: c
            .get("error")
            .filter(|e| !e.is_null())
            .map(|e| error_from_json(&e["$error"])),
        trace_id: c["traceId"].as_str().map(str::to_owned),
    }
}

fn event_to_json(e: &LogEvent) -> Json {
    let mut out = serde_json::Map::new();
    out.insert(
        "ts".into(),
        Json::String(mzizi_assurance::observability::iso8601(e.ts_ms)),
    );
    out.insert("level".into(), Json::String(e.level.as_str().into()));
    out.insert("module".into(), Json::String(e.module.clone()));
    out.insert("msg".into(), Json::String(e.msg.clone()));
    if let Some(t) = &e.trace_id {
        out.insert("traceId".into(), Json::String(t.clone()));
    }
    if let Some(d) = &e.data {
        out.insert("data".into(), value_to_json(&Value::Map(d.clone())));
    }
    Json::Object(out)
}

#[test]
fn observability_sensitive_keys_match_the_fixture() {
    let fx = fixture("observability.cases.json");
    for case in fx["sensitiveKeys"].as_array().unwrap() {
        let key = case["key"].as_str().unwrap();
        assert_eq!(
            Json::Bool(is_sensitive_key(key)),
            case["sensitive"],
            "{key}"
        );
    }
}

#[test]
fn observability_redaction_matches_the_fixture() {
    let fx = fixture("observability.cases.json");
    for case in fx["redaction"].as_array().unwrap() {
        let name = case["name"].as_str().unwrap();
        let got = value_to_json(&redact(&value_from_json(&case["input"])));
        assert_eq!(got, case["expected"], "{name}");
    }
}

#[test]
fn observability_events_match_the_fixture() {
    let fx = fixture("observability.cases.json");
    for case in fx["events"].as_array().unwrap() {
        let name = case["name"].as_str().unwrap();
        let level = Level::parse(case["level"].as_str().unwrap()).unwrap();
        let ctx = ctx_from_json(&case["ctx"]);
        let event = LogEvent::build(
            level,
            case["msg"].as_str().unwrap(),
            &ctx,
            case["at"].as_i64().unwrap(),
        );
        assert_eq!(event_to_json(&event), case["expected"], "{name}");
        assert_eq!(
            event.to_json(),
            case["json"].as_str().unwrap(),
            "{name}: JSON line"
        );
        assert_eq!(
            event.line(),
            case["line"].as_str().unwrap(),
            "{name}: console line"
        );
    }
}

#[test]
fn logger_sends_redacted_events_to_every_sink() {
    use std::cell::Cell;
    use std::rc::Rc;
    let sink = Rc::new(MemorySink::new());
    let t = Rc::new(Cell::new(1_000_i64));
    let clock = Rc::clone(&t);
    let logger = Logger::new("checkout", move || {
        clock.set(clock.get() + 50);
        clock.get()
    })
    .with_sink(Rc::clone(&sink))
    .with_min_level(Level::Info);

    assert!(logger.debug("dropped", LogContext::default()).is_none());
    logger.track_error(
        ErrorSummary::new("LookupError", Some("not-found")),
        LogContext {
            data: Some(vec![("email".into(), Value::Str("a@b.zw".into()))]),
            ..LogContext::default()
        },
    );
    let r: Result<u8, &str> = logger.measure(
        "fetch",
        || Err("boom"),
        |_| ErrorSummary::new("TypeError", None),
    );
    assert!(r.is_err());

    let events = sink.events();
    assert_eq!(events.len(), 2);
    assert_eq!(events[0].msg, "LookupError (not-found)");
    assert_eq!(
        events[0].to_json(),
        r#"{"ts":"1970-01-01T00:00:01.050Z","level":"error","module":"checkout","msg":"LookupError (not-found)","data":{"email":"[redacted]","error":{"name":"LookupError","code":"not-found"}}}"#
    );
    assert_eq!(events[1].msg, "fetch failed after 50ms");
    assert_eq!(
        events[1].line(),
        "[mzizi:checkout] ERROR fetch failed after 50ms"
    );
    assert!(!format!("{events:?}").contains("a@b.zw"));
}
