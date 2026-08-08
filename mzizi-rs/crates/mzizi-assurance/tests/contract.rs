//! Contract tests — the N8 Rust core against its TypeScript sibling.
//!
//! `cargo check` proves `mzizi-otel.rs` compiles. It cannot prove the thing that
//! matters: that `mzizi-otel.rs` and `mzizi-otel.ts` produce the SAME OTLP.
//!
//! That failure mode is worse here than in N2. A Dioxus button that disagrees
//! with its React sibling renders visibly wrong. A malformed or drifted OTLP body
//! fails **silently** — the collector returns 200 and drops the span, or accepts
//! it under a different attribute name, and the first anyone knows is a dashboard
//! that is empty or a query that matches nothing. Nobody debugs a graph that is
//! merely thinner than it should be.
//!
//! So two things are asserted:
//!
//! 1. **The wire shape**, against the OTLP spec — hex id lengths, integer
//!    nanosecond strings, one type tag per attribute, the status enum.
//! 2. **Agreement with the `.ts`**, by reading it on disk. Every attribute key
//!    and every literal the two must share has to appear in both. The TypeScript
//!    is the incumbent that consumers install today, so where they disagree the
//!    Rust is wrong until somebody decides otherwise.
//!
//! What is deliberately NOT asserted: `telemetry.sdk.language`. It reads `rust`
//! here and `webjs` there, correctly — that field names the emitter, and a test
//! demanding they match would be demanding a lie.

use std::collections::BTreeMap;
use std::fs;
use std::path::PathBuf;

use mzizi_assurance::mzizi_otel::{
    AttributeValue, NotExported, OtelConfig, ProbeResult, ProbeStatus, ProbeStep, SpanId, SpanKind,
    StatusCode, StepStatus, TraceId, build_trace_body, build_trace_request, probe_result_to_spans,
    resolve_traces_url,
};

/// Read the TypeScript sibling that this core has to agree with.
fn ts_sibling() -> String {
    let path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("../../../components/registry/n8-assurance/mzizi-otel.ts");
    fs::read_to_string(&path)
        .unwrap_or_else(|e| panic!("cannot read the TypeScript sibling at {path:?}: {e}"))
}

fn trace_id() -> TraceId {
    TraceId::new([
        0x0a, 0x1b, 0x2c, 0x3d, 0x4e, 0x5f, 0x60, 0x71, 0x82, 0x93, 0xa4, 0xb5, 0xc6, 0xd7, 0xe8,
        0xf9,
    ])
}

fn span_ids() -> Vec<SpanId> {
    vec![
        SpanId::new([1, 2, 3, 4, 5, 6, 7, 8]),
        SpanId::new([9, 10, 11, 12, 13, 14, 15, 16]),
        SpanId::new([17, 18, 19, 20, 21, 22, 23, 24]),
    ]
}

fn config() -> OtelConfig {
    OtelConfig {
        endpoint: Some("https://collector.test".to_owned()),
        service_name: "test-service".to_owned(),
        ..OtelConfig::default()
    }
}

/// Fixed timestamp — 2026-08-08T03:00:00.000Z, matching the vitest fixture.
const STARTED_AT_MS: f64 = 1_786_158_000_000.0;

fn passing() -> ProbeResult {
    ProbeResult {
        journey_id: "mzizi-browser-render".to_owned(),
        started_at_ms: STARTED_AT_MS,
        region: "cloudflare-edge".to_owned(),
        status: ProbeStatus::Pass,
        duration_ms: 1200.0,
        steps: vec![
            ProbeStep {
                description: "/tokens".to_owned(),
                status: StepStatus::Pass,
                duration_ms: 500.0,
                error: None,
            },
            ProbeStep {
                description: "/architecture".to_owned(),
                status: StepStatus::Pass,
                duration_ms: 700.0,
                error: None,
            },
        ],
    }
}

fn failing() -> ProbeResult {
    ProbeResult {
        status: ProbeStatus::Fail,
        steps: vec![
            ProbeStep {
                description: "/tokens".to_owned(),
                status: StepStatus::Pass,
                duration_ms: 500.0,
                error: None,
            },
            ProbeStep {
                description: "/changelog/button".to_owned(),
                status: StepStatus::Fail,
                duration_ms: 700.0,
                error: Some("missing body".to_owned()),
            },
        ],
        ..passing()
    }
}

// ── ids ────────────────────────────────────────────────────────────────────

#[test]
fn ids_render_at_the_lengths_a_collector_accepts() {
    // Any other length is rejected by dropping the span, not by an error the
    // caller sees — so the type enforces it rather than a check at the edge.
    assert_eq!(trace_id().to_string().len(), 32);
    assert_eq!(span_ids()[0].to_string().len(), 16);
    assert!(
        trace_id()
            .to_string()
            .chars()
            .all(|c| c.is_ascii_hexdigit() && !c.is_ascii_uppercase())
    );
}

// ── the wire shape ─────────────────────────────────────────────────────────

#[test]
fn timestamps_are_quoted_integer_nanoseconds() {
    let body = build_trace_body(
        &probe_result_to_spans(&passing(), &span_ids(), &BTreeMap::new()),
        &config(),
        trace_id(),
    );
    // Quoted, because JSON has no int64 and a float64 loses precision above
    // 2^53 — exactly where a nanosecond timestamp sits.
    let nanos = STARTED_AT_MS as u128 * 1_000_000;
    assert!(
        body.contains(&format!("\"startTimeUnixNano\":\"{nanos}\"")),
        "expected a quoted nanosecond string; body was:\n{body}"
    );
    // Milliseconds where nanoseconds belong puts the span in 1970, where nobody
    // looks for it.
    assert!(nanos > 1_700_000_000_000_000_000);
}

#[test]
fn every_attribute_carries_exactly_one_type_tag() {
    let body = build_trace_body(
        &probe_result_to_spans(&passing(), &span_ids(), &BTreeMap::new()),
        &config(),
        trace_id(),
    );
    for fragment in body.split("{\"key\":").skip(1) {
        let tags = ["stringValue", "intValue", "doubleValue", "boolValue"]
            .iter()
            .filter(|t| fragment.split("}}").next().is_some_and(|f| f.contains(**t)))
            .count();
        assert_eq!(tags, 1, "attribute has {tags} type tags in:\n{fragment}");
    }
}

#[test]
fn integers_are_quoted_and_floats_are_not() {
    let spans = probe_result_to_spans(&passing(), &span_ids(), &BTreeMap::new());
    let body = build_trace_body(&spans, &config(), trace_id());
    assert!(
        body.contains("\"intValue\":\"8\""),
        "mzizi.node should be a quoted int"
    );

    let mut attrs = BTreeMap::new();
    attrs.insert("ratio".to_owned(), AttributeValue::Double(0.5));
    attrs.insert("on".to_owned(), AttributeValue::Bool(true));
    let body = build_trace_body(
        &probe_result_to_spans(&passing(), &span_ids(), &attrs),
        &config(),
        trace_id(),
    );
    assert!(body.contains("\"doubleValue\":0.5"));
    assert!(body.contains("\"boolValue\":true"));
}

#[test]
fn strings_that_break_json_are_escaped() {
    // A failure reason is prose written by whatever failed, so it can contain
    // anything. An unescaped quote or newline produces a body the collector
    // rejects wholesale — losing the span that mattered most.
    let mut result = failing();
    result.steps[1].error = Some("missing \"malachite\"\n\tand a \\ backslash".to_owned());
    let body = build_trace_body(
        &probe_result_to_spans(&result, &span_ids(), &BTreeMap::new()),
        &config(),
        trace_id(),
    );
    assert!(body.contains("missing \\\"malachite\\\"\\n\\tand a \\\\ backslash"));
    assert!(
        !body.contains("malachite\"\n"),
        "a raw newline survived into the body"
    );
}

#[test]
fn one_run_puts_every_span_under_one_trace_id() {
    let body = build_trace_body(
        &probe_result_to_spans(&passing(), &span_ids(), &BTreeMap::new()),
        &config(),
        trace_id(),
    );
    assert_eq!(body.matches(&trace_id().to_string()).count(), 3);
}

// ── the probe mapping ──────────────────────────────────────────────────────

#[test]
fn a_run_span_parents_one_child_per_step() {
    let spans = probe_result_to_spans(&passing(), &span_ids(), &BTreeMap::new());
    assert_eq!(spans.len(), 3);
    assert!(spans[0].parent_span_id.is_none());
    for step in &spans[1..] {
        assert_eq!(step.parent_span_id, Some(spans[0].span_id));
    }
}

#[test]
fn the_run_is_internal_and_each_step_is_client() {
    // A step calls something external, the run calls nothing. Reversing these
    // makes a collector draw service-dependency edges that do not exist.
    let spans = probe_result_to_spans(&passing(), &span_ids(), &BTreeMap::new());
    assert_eq!(spans[0].kind, SpanKind::Internal);
    assert!(spans[1..].iter().all(|s| s.kind == SpanKind::Client));
}

#[test]
fn a_failure_marks_the_run_and_the_failing_step_only() {
    // This is the case fundi acts on, so it must not come through as UNSET.
    let spans = probe_result_to_spans(&failing(), &span_ids(), &BTreeMap::new());
    assert_eq!(spans[0].status, StatusCode::Error);
    assert_eq!(spans[1].status, StatusCode::Ok);
    assert_eq!(spans[2].status, StatusCode::Error);
    assert_eq!(spans[2].status_message.as_deref(), Some("missing body"));
}

#[test]
fn the_failure_reason_travels_as_error_message() {
    // So a consumer does not have to parse prose to tell an auth wall from a
    // page that rendered empty.
    let spans = probe_result_to_spans(&failing(), &span_ids(), &BTreeMap::new());
    assert_eq!(
        spans[2].attributes.get("error.message"),
        Some(&AttributeValue::Str("missing body".to_owned()))
    );
}

#[test]
fn a_passing_run_is_ok_throughout() {
    for span in probe_result_to_spans(&passing(), &span_ids(), &BTreeMap::new()) {
        assert_eq!(span.status, StatusCode::Ok);
        assert!(span.status_message.is_none());
    }
}

#[test]
fn step_counts_land_on_the_run_span() {
    let spans = probe_result_to_spans(&failing(), &span_ids(), &BTreeMap::new());
    assert_eq!(
        spans[0].attributes.get("mzizi.probe.steps"),
        Some(&AttributeValue::Int(2))
    );
    assert_eq!(
        spans[0].attributes.get("mzizi.probe.steps_failed"),
        Some(&AttributeValue::Int(1))
    );
}

#[test]
fn too_few_ids_truncates_rather_than_reusing_one() {
    // A duplicated span id corrupts the trace a collector assembles, which is
    // worse than a short one.
    let spans = probe_result_to_spans(&passing(), &span_ids()[..2], &BTreeMap::new());
    assert_eq!(spans.len(), 2, "one run + one step, not a reused id");
    assert!(probe_result_to_spans(&passing(), &[], &BTreeMap::new()).is_empty());
}

#[test]
fn steps_are_laid_end_to_end_from_the_run_start() {
    // The durations are measured; the offsets are reconstructed, because
    // ProbeResult carries no per-step timestamp.
    let spans = probe_result_to_spans(&passing(), &span_ids(), &BTreeMap::new());
    assert_eq!(spans[1].start_time_ms, STARTED_AT_MS);
    assert_eq!(spans[1].end_time_ms, STARTED_AT_MS + 500.0);
    assert_eq!(spans[2].start_time_ms, STARTED_AT_MS + 500.0);
    assert_eq!(spans[2].end_time_ms, STARTED_AT_MS + 1200.0);
}

// ── endpoint resolution ────────────────────────────────────────────────────

#[test]
fn a_base_endpoint_gains_the_signal_path() {
    assert_eq!(
        resolve_traces_url(&config()).as_deref(),
        Some("https://collector.test/v1/traces")
    );
}

#[test]
fn a_trailing_slash_does_not_double_up() {
    let cfg = OtelConfig {
        endpoint: Some("https://collector.test/".to_owned()),
        ..config()
    };
    assert_eq!(
        resolve_traces_url(&cfg).as_deref(),
        Some("https://collector.test/v1/traces")
    );
}

#[test]
fn a_traces_endpoint_is_used_verbatim() {
    // The asymmetry is the OTLP spec's. Appending here yields
    // /v1/traces/v1/traces — a 404 that reads like a broken collector.
    let cfg = OtelConfig {
        traces_endpoint: Some("https://collector.test/custom".to_owned()),
        ..config()
    };
    assert_eq!(
        resolve_traces_url(&cfg).as_deref(),
        Some("https://collector.test/custom")
    );
}

#[test]
fn no_endpoint_is_inert_rather_than_an_error() {
    // Most consumers run no collector. Inert must mean inert — never a request
    // to a guessed address, which is the /api/rum defect this node already paid
    // for once.
    let cfg = OtelConfig {
        service_name: "s".to_owned(),
        ..OtelConfig::default()
    };
    assert!(resolve_traces_url(&cfg).is_none());
    let spans = probe_result_to_spans(&passing(), &span_ids(), &BTreeMap::new());
    assert_eq!(
        build_trace_request(&spans, &cfg, trace_id()),
        Err(NotExported::NoEndpoint)
    );
}

#[test]
fn nothing_to_send_says_so() {
    assert_eq!(
        build_trace_request(&[], &config(), trace_id()),
        Err(NotExported::NoSpans)
    );
}

#[test]
fn a_request_carries_the_json_content_type() {
    let spans = probe_result_to_spans(&passing(), &span_ids(), &BTreeMap::new());
    let req = build_trace_request(&spans, &config(), trace_id()).expect("configured");
    assert_eq!(
        req.headers.get("Content-Type").map(String::as_str),
        Some("application/json")
    );
    assert!(req.body.starts_with("{\"resourceSpans\":["));
}

// ── agreement with the TypeScript sibling ──────────────────────────────────

#[test]
fn every_shared_literal_appears_in_both_implementations() {
    // The drift this catches is silent: an attribute renamed on one side lands
    // in the collector under a key nobody queries, and the graph is merely
    // thinner than it should be.
    let ts = ts_sibling();
    let shared = [
        // attribute keys
        "mzizi.node",
        "mzizi.probe.journey",
        "mzizi.probe.status",
        "mzizi.probe.region",
        "mzizi.probe.steps",
        "mzizi.probe.steps_failed",
        "error.message",
        "service.name",
        "service.version",
        "deployment.environment.name",
        "telemetry.sdk.name",
        // payload structure
        "resourceSpans",
        "scopeSpans",
        "mzizi.n8.assurance",
        "startTimeUnixNano",
        "endTimeUnixNano",
        "parentSpanId",
        "stringValue",
        "intValue",
        "doubleValue",
        "boolValue",
        // endpoint contract
        "OTEL_EXPORTER_OTLP_ENDPOINT",
        "OTEL_EXPORTER_OTLP_TRACES_ENDPOINT",
        "/v1/traces",
        // the emitter name, which IS shared even though the language is not
        "mzizi-otel",
    ];
    for literal in shared {
        assert!(
            ts.contains(literal),
            "the Rust core uses `{literal}`, which does not appear in mzizi-otel.ts. \
             The two implementations have drifted — one of them is wrong, and a \
             collector will not tell you which."
        );
    }
}

#[test]
fn the_status_and_kind_enums_match_the_typescript() {
    let ts = ts_sibling();
    // Transposing OK and ERROR is the easiest possible mistake here and the
    // hardest to notice: every span still arrives, just labelled backwards.
    assert!(ts.contains("STATUS_UNSET = 0"));
    assert!(ts.contains("STATUS_OK = 1"));
    assert!(ts.contains("STATUS_ERROR = 2"));
    assert!(ts.contains("SPAN_KIND_INTERNAL = 1"));
    assert!(ts.contains("SPAN_KIND_CLIENT = 3"));
    assert_eq!(StatusCode::Unset as u8, 0);
    assert_eq!(StatusCode::Ok as u8, 1);
    assert_eq!(StatusCode::Error as u8, 2);
    assert_eq!(SpanKind::Internal as u8, 1);
    assert_eq!(SpanKind::Client as u8, 3);
}

#[test]
fn the_typescript_still_declares_no_default_endpoint() {
    // If a default ever reappears there, the two implementations disagree about
    // the single rule this component exists to enforce.
    //
    // This asserts on CODE, not on a mention. The first version banned the
    // string "mzizi.dev/api/rum" and failed immediately — because that URL
    // appears in the file's own prose, explaining the defect it exists not to
    // repeat. A check that cannot tell a bug from its post-mortem forces you to
    // delete the explanation to make the test pass, which is exactly backwards.
    //
    // The repo already solved this shape once: the llms.txt doctrine test
    // asserts that any paragraph mentioning axes also marks them retired,
    // instead of banning the word.
    //
    // What is actually forbidden is a fallback from an unset endpoint to a URL
    // literal — `?? "http…"` — which is the behaviour, not the vocabulary.
    let ts = ts_sibling();
    let code_only: String = ts
        .lines()
        .filter(|l| {
            let t = l.trim_start();
            !(t.starts_with("//") || t.starts_with('*') || t.starts_with("/*"))
        })
        .collect::<Vec<_>>()
        .join("\n");

    for forbidden in ["?? \"http", "?? `http", "|| \"http"] {
        assert!(
            !code_only.contains(forbidden),
            "mzizi-otel.ts falls back to a URL literal ({forbidden}…). Unset must \
             mean inert: sending a consumer's telemetry to an address they never \
             chose is the /api/rum defect restated."
        );
    }
}
