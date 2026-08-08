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
    AttributeValue, NotExported, OtelConfig, SpanId, SpanKind, StatusCode, TraceId,
    build_trace_body, build_trace_request, probe_result_to_spans, resolve_traces_url,
};
// The probe contract has ONE home, and it is not the exporter.
use mzizi_assurance::mzizi_synthetic_probe::{
    ProbeResult, ProbeStatus, StepResult, StepStatus, auth_flow, should_alert, wallet_flow,
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
            StepResult {
                description: "/tokens".to_owned(),
                status: StepStatus::Pass,
                duration_ms: 500.0,
                error: None,
            },
            StepResult {
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
            StepResult {
                description: "/tokens".to_owned(),
                status: StepStatus::Pass,
                duration_ms: 500.0,
                error: None,
            },
            StepResult {
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

// ── the probe contract ─────────────────────────────────────────────────────

#[test]
fn a_run_status_is_derived_from_its_steps_not_asserted_by_the_runner() {
    // A runner reporting a passing run that contains a failed step would be
    // believed, and this constructor is the one place that can prevent it. The
    // invariant lives in the type rather than in a rule somebody remembers.
    let steps = vec![
        StepResult {
            description: "/ok".to_owned(),
            status: StepStatus::Pass,
            duration_ms: 10.0,
            error: None,
        },
        StepResult {
            description: "/bad".to_owned(),
            status: StepStatus::Fail,
            duration_ms: 20.0,
            error: Some("boom".to_owned()),
        },
    ];
    let result = ProbeResult::from_steps("j", "local", STARTED_AT_MS, 30.0, steps);
    assert_eq!(result.status, ProbeStatus::Fail);
    assert_eq!(result.failed_step_count(), 1);
    assert_eq!(
        result.first_failure().and_then(|s| s.error.as_deref()),
        Some("boom")
    );
}

#[test]
fn an_all_passing_run_derives_pass() {
    let result = ProbeResult::from_steps(
        "j",
        "local",
        STARTED_AT_MS,
        10.0,
        vec![StepResult {
            description: "/ok".to_owned(),
            status: StepStatus::Pass,
            duration_ms: 10.0,
            error: None,
        }],
    );
    assert_eq!(result.status, ProbeStatus::Pass);
    assert!(!result.status.is_failure());
    assert!(result.first_failure().is_none());
}

#[test]
fn timeout_and_error_are_failures_but_not_the_same_failure() {
    // A journey that failed and a runner that could not complete warrant
    // different responses, so they stay distinct on the wire.
    assert!(ProbeStatus::Timeout.is_failure());
    assert!(ProbeStatus::Error.is_failure());
    assert_ne!(ProbeStatus::Timeout.as_str(), ProbeStatus::Error.as_str());
}

#[test]
fn alerting_is_a_separate_decision_from_failing() {
    // "Did it fail" and "should somebody be woken" are different questions.
    let mut journey = wallet_flow();
    assert!(should_alert(&journey, &failing()));
    assert!(!should_alert(&journey, &passing()));
    journey.alert_on_failure = false;
    assert!(!should_alert(&journey, &failing()));
}

#[test]
fn journey_templates_match_the_typescript() {
    let ts = fs::read_to_string(
        PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("../../../components/registry/n8-assurance/mzizi-synthetic-probe.ts"),
    )
    .expect("the synthetic-probe TypeScript sibling");

    let auth = auth_flow("wallet");
    assert_eq!(auth.id, "auth-wallet");
    assert_eq!(auth.nodes, vec![6, 4, 7]);
    let wallet = wallet_flow();
    assert_eq!(wallet.id, "wallet-balance");
    assert_eq!(wallet.nodes, vec![6, 4, 3, 2]);

    // Every selector the Rust templates drive must exist in the TypeScript, or
    // the two implementations probe different pages while reporting the same
    // journey id — which a collector would happily graph as one series.
    for journey in [&auth, &wallet] {
        for step in &journey.steps {
            if let Some(target) = &step.target {
                assert!(
                    ts.contains(target.as_str()),
                    "journey `{}` drives `{target}`, absent from the TypeScript sibling",
                    journey.id
                );
            }
            assert!(ts.contains(step.description.as_str()));
        }
    }
}

#[test]
fn every_step_type_keeps_its_typescript_spelling() {
    let ts = fs::read_to_string(
        PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("../../../components/registry/n8-assurance/mzizi-synthetic-probe.ts"),
    )
    .expect("the synthetic-probe TypeScript sibling");
    for spelling in ["navigate", "click", "input", "assert", "wait", "screenshot"] {
        assert!(
            ts.contains(&format!("\"{spelling}\"")),
            "step type `{spelling}` is not in the TypeScript union"
        );
    }
}

#[test]
fn the_node_list_on_a_journey_is_uncapped() {
    // Node numbers are labels, not a sequence. Any upper bound here would be the
    // defect rather than its current value — a cap of 10 hid N11 once already.
    let mut journey = wallet_flow();
    journey.nodes.push(97);
    assert!(journey.nodes.contains(&97));
}

// ── the alert engine ───────────────────────────────────────────────────────

use mzizi_assurance::mzizi_alert_engine::{
    Alert, AlertLog, AlertSeverity, AlertState, Escalation, SloDefinition, SloMetric, burn_rate,
    escalate_to, evaluate_slo,
};

fn ladder() -> Vec<Escalation> {
    vec![
        Escalation {
            burn_rate: 1.0,
            severity: AlertSeverity::Warning,
        },
        Escalation {
            burn_rate: 2.0,
            severity: AlertSeverity::Critical,
        },
        Escalation {
            burn_rate: 5.0,
            severity: AlertSeverity::Page,
        },
    ]
}

fn slo() -> SloDefinition {
    SloDefinition {
        id: "api-availability".to_owned(),
        name: "API availability".to_owned(),
        target: 99.9,
        window_hours: 720,
        metric: SloMetric::Availability,
        mini_apps: vec!["wallet".to_owned()],
        escalation: ladder(),
    }
}

#[test]
fn meeting_the_objective_burns_nothing() {
    assert_eq!(burn_rate(99.95, 99.9), 0.0);
    assert_eq!(burn_rate(99.9, 99.9), 0.0);
}

#[test]
fn burn_rate_counts_error_budget_consumed() {
    // Target 99.9 leaves a 0.1 budget; observing 99.8 consumes exactly one.
    assert!((burn_rate(99.8, 99.9) - 1.0).abs() < 1e-9);
    assert!((burn_rate(99.7, 99.9) - 2.0).abs() < 1e-9);
}

#[test]
fn an_unmeetable_objective_says_so_rather_than_dividing_by_zero() {
    // A 100% target leaves no budget. The .ts divides straight through and gets
    // Infinity by accident; here it is deliberate, so a caller can notice the
    // objective was probably a mistake.
    assert_eq!(burn_rate(99.9, 100.0), f64::INFINITY);
    assert_eq!(burn_rate(100.0, 100.0), 0.0);
}

#[test]
fn one_breach_reaches_exactly_one_rung() {
    // THE BUG THIS PORT FIXES. The .ts fires once per matching tier, so a burn
    // rate of 6 against this ladder produced three alerts — and one of them
    // pages a human, three times, for a single breach.
    assert_eq!(
        escalate_to(&ladder(), 6.0).map(|e| e.severity),
        Some(AlertSeverity::Page)
    );
    assert_eq!(
        escalate_to(&ladder(), 2.5).map(|e| e.severity),
        Some(AlertSeverity::Critical)
    );
    assert_eq!(
        escalate_to(&ladder(), 1.0).map(|e| e.severity),
        Some(AlertSeverity::Warning)
    );
    assert_eq!(escalate_to(&ladder(), 0.5), None);
}

#[test]
fn rung_order_in_the_ladder_does_not_change_the_answer() {
    // A caller should not have to sort their config for it to behave.
    let mut reversed = ladder();
    reversed.reverse();
    assert_eq!(
        escalate_to(&reversed, 6.0).map(|e| e.severity),
        escalate_to(&ladder(), 6.0).map(|e| e.severity)
    );
}

#[test]
fn a_tie_breaks_toward_the_louder_severity() {
    // Under-alerting a breach is the worse error.
    let tied = vec![
        Escalation {
            burn_rate: 2.0,
            severity: AlertSeverity::Warning,
        },
        Escalation {
            burn_rate: 2.0,
            severity: AlertSeverity::Page,
        },
    ];
    assert_eq!(
        escalate_to(&tied, 3.0).map(|e| e.severity),
        Some(AlertSeverity::Page)
    );
}

#[test]
fn evaluating_an_slo_yields_at_most_one_alert() {
    assert!(evaluate_slo(&slo(), 99.95, "a1", 1000.0).is_none());
    let alert = evaluate_slo(&slo(), 99.4, "a1", 1000.0).expect("breached");
    assert_eq!(alert.severity, AlertSeverity::Page);
    assert_eq!(alert.state, AlertState::Firing);
    assert_eq!(alert.slo_id.as_deref(), Some("api-availability"));
    assert_eq!(alert.affected_mini_apps, vec!["wallet".to_owned()]);
    assert!(
        alert
            .runbook_url
            .as_deref()
            .is_some_and(|u| u.ends_with("api-availability"))
    );
}

#[test]
fn a_displaced_alert_is_returned_rather_than_silently_destroyed() {
    // With the .ts's colliding `alert-${Date.now()}` ids this quietly dropped
    // alerts. A caller that ignores the return value at least had the chance not
    // to.
    let mut log = AlertLog::new();
    let first = evaluate_slo(&slo(), 99.4, "same-id", 1000.0).expect("breached");
    let second = evaluate_slo(&slo(), 99.0, "same-id", 2000.0).expect("breached");
    assert!(log.fire(first.clone()).is_none());
    assert_eq!(
        log.fire(second).as_ref().map(|a| a.fired_at_ms),
        Some(1000.0)
    );
    assert_eq!(log.len(), 1);
}

#[test]
fn resolving_moves_an_alert_out_of_active() {
    let mut log = AlertLog::new();
    log.fire(evaluate_slo(&slo(), 99.4, "a1", 1000.0).expect("breached"));
    assert_eq!(log.active().len(), 1);
    assert!(log.resolve("a1", 5000.0));
    assert!(log.active().is_empty());
    assert_eq!(log.all().len(), 1, "resolved alerts stay in the record");
    assert!(!log.resolve("nope", 1.0), "an unknown id reports failure");
}

#[test]
fn severity_and_state_keep_their_typescript_spellings() {
    let ts = fs::read_to_string(
        PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("../../../components/registry/n8-assurance/mzizi-alert-engine.ts"),
    )
    .expect("the alert-engine TypeScript sibling");
    for s in [
        AlertSeverity::Info,
        AlertSeverity::Warning,
        AlertSeverity::Critical,
        AlertSeverity::Page,
    ] {
        assert!(
            ts.contains(&format!("\"{}\"", s.as_str())),
            "severity {} missing",
            s.as_str()
        );
    }
    for s in [
        AlertState::Firing,
        AlertState::Pending,
        AlertState::Resolved,
    ] {
        assert!(
            ts.contains(&format!("\"{}\"", s.as_str())),
            "state {} missing",
            s.as_str()
        );
    }
    for m in [
        SloMetric::Availability,
        SloMetric::LatencyP99,
        SloMetric::ErrorRate,
        SloMetric::SuccessRate,
    ] {
        assert!(
            ts.contains(&format!("\"{}\"", m.as_str())),
            "metric {} missing",
            m.as_str()
        );
    }
    assert!(
        ts.contains("mzizi.dev/runbooks/"),
        "runbook URL shape drifted"
    );
}

#[test]
fn an_alert_is_constructible_without_a_dom() {
    // affectedComponents falls back to document.querySelectorAll in the .ts.
    // A Worker and a native shell have no document, so the core takes the list.
    let alert = Alert {
        affected_components: vec!["button".to_owned()],
        ..evaluate_slo(&slo(), 99.4, "a1", 1000.0).expect("breached")
    };
    assert_eq!(alert.affected_components, vec!["button".to_owned()]);
}

// ── the error tracker ──────────────────────────────────────────────────────

use mzizi_assurance::mzizi_error_tracker::{
    ErrorContext, ErrorLog, ErrorLogConfig, Severity, Tracked, classify_severity,
};

fn ctx(node: Option<u32>, blast: usize) -> ErrorContext {
    ErrorContext {
        component_name: Some("button".to_owned()),
        node,
        mini_app: Some("wallet".to_owned()),
        url: Some("/wallet".to_owned()),
        blast_radius: (0..blast).map(|i| format!("sib-{i}")).collect(),
    }
}

#[test]
fn a_token_or_safety_failure_is_always_critical() {
    // N1 and N4 are core guarantees. If design values or safety gates fail,
    // everything downstream is already wrong, so nothing else can lower this.
    assert_eq!(
        classify_severity("anything", Some(1), 0),
        Severity::Critical
    );
    assert_eq!(
        classify_severity("anything", Some(4), 0),
        Severity::Critical
    );
    assert_eq!(
        classify_severity("Cannot read x", Some(1), 50),
        Severity::Critical
    );
}

#[test]
fn shell_failures_and_wide_blast_radii_are_high() {
    assert_eq!(classify_severity("x", Some(7), 0), Severity::High);
    assert_eq!(classify_severity("x", Some(2), 11), Severity::High);
    assert_eq!(
        classify_severity("x", Some(2), 10),
        Severity::Low,
        "boundary is >10"
    );
}

#[test]
fn the_typeerror_heuristic_is_preserved_including_its_flaw() {
    // "TypeError" is normally the error's NAME, not part of its message, so that
    // branch rarely fires and the neighbouring "Cannot read" test is what
    // actually catches those. Preserved rather than fixed: changing it would
    // silently reclassify live errors, which is a product decision.
    assert_eq!(
        classify_severity("Cannot read properties of undefined", None, 0),
        Severity::Medium
    );
    assert_eq!(
        classify_severity("TypeError: nope", None, 0),
        Severity::Medium
    );
    assert_eq!(classify_severity("something else", None, 0), Severity::Low);
}

#[test]
fn recurrences_group_and_count_rather_than_multiply() {
    let mut log = ErrorLog::new(ErrorLogConfig::default());
    let (first, _) = log.track("boom", None, &ctx(Some(2), 0), "id-1", 1_000.0);
    assert_eq!(first, Tracked::New);
    let (again, error) = log.track("boom", None, &ctx(Some(2), 0), "id-2", 2_000.0);
    assert_eq!(again, Tracked::Recurrence);
    assert_eq!(error.count, 2);
    assert_eq!(error.first_seen_ms, 1_000.0);
    assert_eq!(error.last_seen_ms, 2_000.0);
    assert_eq!(log.len(), 1);
}

#[test]
fn a_recurrence_unresolves_because_it_was_not_settled() {
    let mut log = ErrorLog::new(ErrorLogConfig::default());
    log.track("boom", None, &ctx(None, 0), "id-1", 1_000.0);
    let key = ErrorLog::dedup_key("boom", Some("button"));
    assert!(log.resolve(&key));
    assert!(log.unresolved().is_empty());
    log.track("boom", None, &ctx(None, 0), "id-2", 2_000.0);
    assert_eq!(log.unresolved().len(), 1);
}

#[test]
fn auto_resolve_actually_exists() {
    // THE DEFECT THIS PORT FIXES. The .ts declares autoResolveMinutes, defaults
    // it to 60 via Required<>, and never reads it — so every error stayed
    // unresolved forever while a dashboard counted them. A config option that
    // does nothing is worse than an absent one, because it is believed.
    let mut log = ErrorLog::new(ErrorLogConfig {
        auto_resolve_minutes: 60.0,
        ..ErrorLogConfig::default()
    });
    log.track("boom", None, &ctx(None, 0), "id-1", 0.0);
    assert_eq!(
        log.auto_resolve(59.0 * 60_000.0),
        0,
        "still inside the window"
    );
    assert_eq!(log.auto_resolve(60.0 * 60_000.0), 1, "the window elapsed");
    assert!(log.unresolved().is_empty());
    assert_eq!(
        log.auto_resolve(120.0 * 60_000.0),
        0,
        "already resolved, not recounted"
    );
}

#[test]
fn eviction_drops_the_least_recently_seen_and_never_the_new_one() {
    // Evicting what you were just asked to record is not eviction, it is a
    // silent drop — and with max_errors of 1 that is exactly what a naive
    // implementation does.
    let mut log = ErrorLog::new(ErrorLogConfig {
        max_errors: 2,
        dedup: true,
        auto_resolve_minutes: 60.0,
    });
    let mut c = ctx(None, 0);
    for (i, t) in [("a", 1_000.0), ("b", 2_000.0), ("c", 3_000.0)] {
        c.component_name = Some(i.to_owned());
        log.track("boom", None, &c, i, t);
    }
    assert_eq!(log.len(), 2);
    let held: Vec<_> = log
        .all()
        .iter()
        .map(|e| e.component_name.clone().unwrap())
        .collect();
    assert!(
        !held.contains(&"a".to_owned()),
        "the oldest should have gone"
    );
    assert!(held.contains(&"c".to_owned()), "the newest must survive");
}

#[test]
fn dedup_off_uses_the_supplied_id_rather_than_a_clock() {
    // The .ts uses Date.now().toString() here, which collides for two errors in
    // the same millisecond — which an error storm produces by construction, and
    // an error storm is exactly when dedup gets turned off.
    let mut log = ErrorLog::new(ErrorLogConfig {
        dedup: false,
        ..ErrorLogConfig::default()
    });
    log.track("boom", None, &ctx(None, 0), "id-1", 1_000.0);
    log.track("boom", None, &ctx(None, 0), "id-2", 1_000.0);
    assert_eq!(log.len(), 2, "same millisecond, distinct ids, both kept");
}

#[test]
fn severity_keeps_its_typescript_spelling() {
    let ts = fs::read_to_string(
        PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("../../../components/registry/n8-assurance/mzizi-error-tracker.ts"),
    )
    .expect("the error-tracker TypeScript sibling");
    for s in [
        Severity::Low,
        Severity::Medium,
        Severity::High,
        Severity::Critical,
    ] {
        assert!(
            ts.contains(&format!("\"{}\"", s.as_str())),
            "severity {} missing",
            s.as_str()
        );
    }
    // The classification thresholds are the contract, not implementation detail.
    assert!(
        ts.contains("node === 1 || ctx?.node === 4"),
        "critical-node rule drifted"
    );
    assert!(ts.contains("node === 7"), "shell rule drifted");
    assert!(ts.contains("> 10"), "blast-radius threshold drifted");
}

// ── the api probe ──────────────────────────────────────────────────────────

use mzizi_assurance::mzizi_api_probe::{
    EndpointStatus, Outcome, check, classify, default_endpoints, degraded_threshold_for,
    worst_status,
};

#[test]
fn a_timeout_is_a_reported_fact_not_a_guess_at_prose() {
    // THE BUG THIS PORT FIXES. The .ts writes String(err).includes("abort"), and
    // an abort reads differently per runtime — "The operation was aborted",
    // "This operation was aborted", "signal is aborted without reason". The same
    // timeout therefore classified as `timeout` in one host and `down` in
    // another, and `down` pages people where `timeout` often does not.
    assert_eq!(
        classify(&Outcome::TimedOut, 5000.0, 2000.0),
        EndpointStatus::Timeout
    );
    // Even an error whose text happens to contain "abort" is not a timeout.
    let failed = Outcome::Failed {
        error: "connection aborted by peer".to_owned(),
    };
    assert_eq!(classify(&failed, 10.0, 2000.0), EndpointStatus::Down);
}

#[test]
fn the_degraded_threshold_cannot_contradict_the_timeout() {
    // The .ts hardcodes 2000ms while the timeout is configurable at 5000. Set
    // the timeout below 2000 and Degraded becomes unreachable — the request
    // aborts before it can ever be classified slow.
    assert!(degraded_threshold_for(5000.0) < 5000.0);
    assert!(degraded_threshold_for(1000.0) < 1000.0);
    assert_eq!(degraded_threshold_for(100.0), 250.0, "floored, never zero");
}

#[test]
fn a_slow_success_is_degraded_and_a_slow_failure_is_down() {
    // A slow 500 is an outage, not a slowdown. Calling it degraded would
    // understate it.
    let ok = Outcome::Responded { status_code: 200 };
    assert_eq!(classify(&ok, 100.0, 2000.0), EndpointStatus::Healthy);
    assert_eq!(classify(&ok, 3000.0, 2000.0), EndpointStatus::Degraded);
    let err = Outcome::Responded { status_code: 500 };
    assert_eq!(classify(&err, 3000.0, 2000.0), EndpointStatus::Down);
    assert_eq!(classify(&err, 10.0, 2000.0), EndpointStatus::Down);
}

#[test]
fn redirects_count_as_alive() {
    let redirect = Outcome::Responded { status_code: 308 };
    assert_eq!(classify(&redirect, 10.0, 2000.0), EndpointStatus::Healthy);
    let gone = Outcome::Responded { status_code: 410 };
    assert_eq!(classify(&gone, 10.0, 2000.0), EndpointStatus::Down);
}

#[test]
fn a_check_carries_the_status_code_only_when_there_was_one() {
    let ep = &default_endpoints("https://mzizi.dev")[0];
    let responded = check(
        ep,
        &Outcome::Responded { status_code: 204 },
        10.0,
        1000.0,
        2000.0,
    );
    assert_eq!(responded.status_code, Some(204));
    assert!(responded.error.is_none());

    let timed_out = check(ep, &Outcome::TimedOut, 5000.0, 1000.0, 2000.0);
    assert_eq!(timed_out.status_code, None);
    assert!(
        timed_out
            .error
            .as_deref()
            .is_some_and(|e| e.contains("timed out"))
    );
}

#[test]
fn one_endpoint_down_makes_the_whole_set_down() {
    // Worst, not most common: nine healthy endpoints do not cancel out an
    // outage, and an average would hide the only case worth seeing.
    let ep = default_endpoints("https://mzizi.dev");
    let checks = vec![
        check(
            &ep[0],
            &Outcome::Responded { status_code: 200 },
            10.0,
            0.0,
            2000.0,
        ),
        check(
            &ep[1],
            &Outcome::Responded { status_code: 200 },
            10.0,
            0.0,
            2000.0,
        ),
        check(
            &ep[2],
            &Outcome::Failed {
                error: "refused".to_owned(),
            },
            1.0,
            0.0,
            2000.0,
        ),
    ];
    assert_eq!(worst_status(&checks), EndpointStatus::Down);
    assert_eq!(worst_status(&checks[..2]), EndpointStatus::Healthy);
    assert_eq!(
        worst_status(&[]),
        EndpointStatus::Unknown,
        "nothing probed is not healthy"
    );
}

#[test]
fn default_endpoints_match_the_typescript_and_tolerate_a_trailing_slash() {
    let ts = fs::read_to_string(
        PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("../../../components/registry/n8-assurance/mzizi-api-probe.ts"),
    )
    .expect("the api-probe TypeScript sibling");
    for ep in default_endpoints("https://mzizi.dev") {
        assert!(
            ts.contains(ep.component_name.as_str()),
            "{} missing",
            ep.component_name
        );
        assert!(ts.contains(&format!("node: {}", ep.node)) || ts.contains(&ep.node.to_string()));
    }
    for status in [
        EndpointStatus::Healthy,
        EndpointStatus::Degraded,
        EndpointStatus::Down,
        EndpointStatus::Timeout,
        EndpointStatus::Unknown,
    ] {
        assert!(ts.contains(&format!("\"{}\"", status.as_str())));
    }
    assert_eq!(
        default_endpoints("https://mzizi.dev/")[0].url,
        default_endpoints("https://mzizi.dev")[0].url
    );
}

#[test]
fn unknown_is_never_inferred_only_stated() {
    // A host that has not probed yet needs to say so. A dashboard rendering
    // "unknown" is honest where defaulting to "healthy" is not.
    assert!(!EndpointStatus::Unknown.is_unhealthy());
    assert!(!EndpointStatus::Healthy.is_unhealthy());
    for s in [
        EndpointStatus::Degraded,
        EndpointStatus::Down,
        EndpointStatus::Timeout,
    ] {
        assert!(s.is_unhealthy());
    }
}

// ── rum ────────────────────────────────────────────────────────────────────

use mzizi_assurance::mzizi_rum::{
    Connection, Device, RumBuffer, RumEvent, RumEventType, device_for, path_only, should_sample,
};

fn rum_event(t: RumEventType) -> RumEvent {
    RumEvent {
        event_type: t,
        timestamp_ms: 1000.0,
        url: "/wallet".to_owned(),
        mini_app: Some("wallet".to_owned()),
        device: Device::Mobile,
        connection: Connection::FourG,
        metrics: vec![("ttfb".to_owned(), 120.0)],
    }
}

#[test]
fn an_unsampled_session_discards_rather_than_hoards() {
    // THE BUG THIS PORT FIXES. The .ts returns early from the constructor when
    // unsampled — BEFORE init() — so no flush timer exists, but record() stays
    // public and keeps pushing. Events pile up with nothing to drain them, in
    // nine sessions out of ten at the default 10% rate.
    let mut buffer = RumBuffer::new(false, 100);
    assert!(!buffer.is_sampled());
    for _ in 0..1000 {
        assert!(!buffer.record(rum_event(RumEventType::Interaction)));
    }
    assert!(buffer.is_empty(), "an unsampled buffer must hold nothing");
}

#[test]
fn a_sampled_buffer_is_bounded() {
    // A flush that fails is swallowed by design — RUM must never surface its own
    // network error to the user it measures. Correct, and unbounded without a
    // ceiling: an unreachable endpoint accumulates for the whole session.
    let mut buffer = RumBuffer::new(true, 3);
    for i in 0..10 {
        let mut e = rum_event(RumEventType::Navigation);
        e.timestamp_ms = f64::from(i);
        buffer.record(e);
    }
    assert_eq!(buffer.len(), 3);
    assert_eq!(buffer.drain()[2].timestamp_ms, 9.0, "the newest survives");
}

#[test]
fn draining_empties_the_buffer() {
    let mut buffer = RumBuffer::new(true, 100);
    buffer.record(rum_event(RumEventType::Pageload));
    assert_eq!(buffer.drain().len(), 1);
    assert!(buffer.is_empty());
    assert!(buffer.drain().is_empty(), "draining twice is not an error");
}

#[test]
fn sampling_is_exact_at_both_ends() {
    // A `>=` on the wrong side makes rate 0.0 sample one draw in a billion, or
    // rate 1.0 miss one — and nobody notices either.
    assert!(
        !should_sample(0.0, 0.0),
        "rate 0 samples nothing, including draw 0"
    );
    assert!(should_sample(0.0, 1.0));
    assert!(should_sample(0.999_999, 1.0), "rate 1 samples everything");
    assert!(should_sample(0.09, 0.1));
    assert!(!should_sample(0.1, 0.1), "the boundary is exclusive");
}

#[test]
fn viewport_breakpoints_match_the_typescript() {
    let ts = fs::read_to_string(
        PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("../../../components/registry/n8-assurance/mzizi-rum.ts"),
    )
    .expect("the rum TypeScript sibling");
    assert!(ts.contains("innerWidth < 640"), "mobile breakpoint drifted");
    assert!(
        ts.contains("innerWidth < 1024"),
        "tablet breakpoint drifted"
    );
    assert_eq!(device_for(639), Device::Mobile);
    assert_eq!(device_for(640), Device::Tablet);
    assert_eq!(device_for(1023), Device::Tablet);
    assert_eq!(device_for(1024), Device::Desktop);
}

#[test]
fn a_query_string_can_never_reach_the_wire() {
    // This component's premise is that it collects no PII, and a query string is
    // where session tokens, reset links and search terms live.
    assert_eq!(path_only("/wallet?token=secret"), "/wallet");
    assert_eq!(
        path_only("https://app.test/wallet?token=secret#frag"),
        "/wallet"
    );
    assert_eq!(path_only("https://app.test"), "/");
    assert_eq!(path_only("/wallet"), "/wallet");
    assert_eq!(path_only("/reset#token=secret"), "/reset");
}

#[test]
fn rum_unions_keep_their_typescript_spellings() {
    let ts = fs::read_to_string(
        PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("../../../components/registry/n8-assurance/mzizi-rum.ts"),
    )
    .expect("the rum TypeScript sibling");
    for t in [
        RumEventType::Pageload,
        RumEventType::Interaction,
        RumEventType::Navigation,
        RumEventType::Network,
        RumEventType::Error,
    ] {
        assert!(
            ts.contains(&format!("\"{}\"", t.as_str())),
            "event type {}",
            t.as_str()
        );
    }
    for d in [Device::Mobile, Device::Tablet, Device::Desktop] {
        assert!(
            ts.contains(&format!("\"{}\"", d.as_str())),
            "device {}",
            d.as_str()
        );
    }
    for c in [
        Connection::FourG,
        Connection::ThreeG,
        Connection::TwoG,
        Connection::SlowTwoG,
        Connection::Wifi,
        Connection::Unknown,
    ] {
        assert!(
            ts.contains(&format!("\"{}\"", c.as_str())),
            "connection {}",
            c.as_str()
        );
    }
    assert_eq!(
        Connection::from_str_or_unknown("nonsense"),
        Connection::Unknown
    );
}

#[test]
fn the_typescript_still_has_no_default_endpoint() {
    // It defaulted to https://mzizi.dev/api/rum, a route that returns 404, inside
    // a catch that correctly swallows delivery failures — silent data loss that
    // looked exactly like working RUM. Asserted on behaviour, not on the string,
    // because the file explains the defect in its own prose.
    let ts = fs::read_to_string(
        PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("../../../components/registry/n8-assurance/mzizi-rum.ts"),
    )
    .expect("the rum TypeScript sibling");
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
            "a default endpoint returned ({forbidden}…)"
        );
    }
}

// ── conformity ─────────────────────────────────────────────────────────────

use std::collections::BTreeSet;

use mzizi_assurance::mzizi_conformity_check::{
    ObservedElement, ViolationSeverity, ViolationType, check_conformity, check_element,
    selector_for, worst_severity,
};

fn el(slot: &str, tag: &str) -> ObservedElement {
    ObservedElement {
        slot: slot.to_owned(),
        tag_name: tag.to_owned(),
        portal_url: Some("https://mzizi.dev/components/button".to_owned()),
        aria_label: Some("Save".to_owned()),
        aria_labelledby: None,
        role: None,
        has_text: true,
    }
}

fn registry() -> BTreeSet<String> {
    ["button", "card"].iter().map(|s| (*s).to_owned()).collect()
}

#[test]
fn one_bad_button_does_not_condemn_every_other_button() {
    // THE BUG THIS PORT FIXES. The .ts counts conformance by SLOT NAME —
    // "has any element with this slot had a violation" — so twenty conformant
    // buttons and one broken one scored zero for all twenty-one.
    let mut broken = el("button", "BUTTON");
    broken.portal_url = None;
    let elements = vec![el("button", "BUTTON"), el("button", "BUTTON"), broken];

    let report = check_conformity("/wallet", &elements, Some(&registry()), &BTreeSet::new());
    assert_eq!(report.total_components, 3);
    assert_eq!(report.conformant, 2, "the two good buttons still count");
    assert_eq!(report.score, 67);
}

#[test]
fn an_unregistered_component_is_still_checked_for_everything_else() {
    // The .ts returns early on `unregistered`, so a component that is also
    // deprecated and also missing its accessible name reports one problem
    // instead of three. Being absent from the registry does not make an
    // accessibility defect untrue.
    let mut element = el("mystery", "BUTTON");
    element.portal_url = None;
    element.aria_label = None;
    element.has_text = false;

    let deprecated: BTreeSet<String> = ["mystery".to_owned()].into_iter().collect();
    let found = check_element(&element, Some(&registry()), &deprecated);
    let kinds: BTreeSet<ViolationType> = found.iter().map(|v| v.violation_type).collect();
    assert!(kinds.contains(&ViolationType::Unregistered));
    assert!(kinds.contains(&ViolationType::MissingPortal));
    assert!(kinds.contains(&ViolationType::Deprecated));
    assert!(kinds.contains(&ViolationType::MissingAria));
    assert_eq!(found.len(), 4);
}

#[test]
fn every_violation_reaches_the_caller() {
    // The .ts only passes `unregistered` to onViolation — every other branch
    // just pushes — so a consumer wiring that callback to an alert saw one type
    // out of four. Returning them all makes a second code path impossible.
    let mut element = el("card", "DIV");
    element.portal_url = None;
    let found = check_element(&element, Some(&registry()), &BTreeSet::new());
    assert_eq!(found.len(), 1);
    assert_eq!(found[0].violation_type, ViolationType::MissingPortal);
    assert_eq!(found[0].severity, ViolationSeverity::Info);
}

#[test]
fn an_interactive_element_needs_a_name_from_somewhere() {
    let mut bare = el("button", "BUTTON");
    bare.aria_label = None;
    bare.role = None;
    bare.has_text = false;
    assert!(!bare.has_accessible_name());
    assert!(bare.is_interactive());

    // Any one of the three sources is enough.
    let mut with_text = bare.clone();
    with_text.has_text = true;
    assert!(with_text.has_accessible_name());

    // aria-labelledby names it too. The .ts never looked at that attribute at
    // all, while mzizi-a11y-audit always did.
    let mut labelled_by = bare.clone();
    labelled_by.aria_labelledby = Some("heading-1".to_owned());
    assert!(labelled_by.has_accessible_name());

    // role=button makes a div interactive.
    let mut div = el("card", "DIV");
    div.role = Some("button".to_owned());
    assert!(div.is_interactive());
    let mut span = el("card", "SPAN");
    span.role = None;
    assert!(!span.is_interactive());
}

#[test]
fn a_role_is_not_an_accessible_name() {
    // THE .ts RULE COULD NEVER FIRE FOR THE ELEMENTS IT WAS WIDENED TO COVER.
    // `const ariaLabel = getAttribute("aria-label") || getAttribute("role")`,
    // then `if (isButton && !ariaLabel && !text)`. Any element carrying
    // role="button" supplies its own "name" via the same attribute that put it
    // in scope, so it is exempted by construction.
    let mut div = el("card", "DIV");
    div.aria_label = None;
    div.aria_labelledby = None;
    div.has_text = false;
    div.role = Some("button".to_owned());

    assert!(div.is_interactive(), "role=button is interactive");
    assert!(
        !div.has_accessible_name(),
        "a role says what a thing IS, never what it is CALLED"
    );

    let found = check_element(&div, Some(&registry()), &BTreeSet::new());
    let kinds: BTreeSet<ViolationType> = found.iter().map(|v| v.violation_type).collect();
    assert!(
        kinds.contains(&ViolationType::MissingAria),
        "the unnamed role=button must be reported"
    );
}

#[test]
fn the_two_n8_components_agree_on_what_a_name_is() {
    // Two definitions of "accessible name" across one node meant the same
    // button was a violation on one surface and a pass on the other, and
    // whichever a consumer saw first was the one they believed.
    use mzizi_assurance::mzizi_a11y_audit::ObservedNode;

    for (aria, labelledby, text, expected) in [
        (None, None, false, false),
        (Some("Save"), None, false, true),
        (None, Some("h1"), false, true),
        (None, None, true, true),
    ] {
        let mut conformity = el("button", "BUTTON");
        conformity.aria_label = aria.map(str::to_owned);
        conformity.aria_labelledby = labelledby.map(str::to_owned);
        conformity.has_text = text;
        conformity.role = Some("button".to_owned());

        let audit = ObservedNode {
            tag_name: "BUTTON".to_owned(),
            aria_label: aria.map(str::to_owned),
            aria_labelledby: labelledby.map(str::to_owned),
            text: text.then(|| "Save".to_owned()),
            role: Some("button".to_owned()),
            ..ObservedNode::default()
        };

        assert_eq!(conformity.has_accessible_name(), expected);
        assert_eq!(audit.accessible_name().is_some(), expected);
    }
}

#[test]
fn a_tag_name_is_matched_case_insensitively() {
    // The DOM reports uppercase; server-rendered HTML and other hosts may not.
    let mut lower = el("button", "button");
    lower.aria_label = None;
    lower.has_text = false;
    assert!(
        lower.is_interactive(),
        "a lowercase tag is the same element"
    );
}

#[test]
fn a_selector_survives_a_quote_in_the_slot() {
    // The selector's whole job is finding the element again, and an unescaped
    // quote produces one that does not parse.
    assert_eq!(selector_for("button"), "[data-slot=\"button\"]");
    assert_eq!(selector_for("a\"b"), "[data-slot=\"a\\\"b\"]");
}

#[test]
fn no_registry_means_no_unregistered_finding() {
    // A host that does not know the registry cannot claim anything is missing
    // from it — that is absence of evidence.
    let found = check_element(&el("anything", "DIV"), None, &BTreeSet::new());
    assert!(
        found
            .iter()
            .all(|v| v.violation_type != ViolationType::Unregistered)
    );
}

#[test]
fn an_empty_page_scores_100_rather_than_dividing_by_zero() {
    let report = check_conformity("/", &[], Some(&registry()), &BTreeSet::new());
    assert_eq!(report.score, 100);
    assert_eq!(
        report.total_components, 0,
        "which is how you tell it from a tested page"
    );
}

#[test]
fn worst_severity_is_the_go_no_go_answer() {
    let mut deprecated_el = el("card", "DIV");
    deprecated_el.portal_url = None;
    let deprecated: BTreeSet<String> = ["card".to_owned()].into_iter().collect();
    let found = check_element(&deprecated_el, Some(&registry()), &deprecated);
    assert_eq!(worst_severity(&found), Some(ViolationSeverity::Error));
    assert_eq!(worst_severity(&[]), None);
}

#[test]
fn conformity_unions_keep_their_typescript_spellings() {
    let ts = fs::read_to_string(
        PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("../../../components/registry/n8-assurance/mzizi-conformity-check.ts"),
    )
    .expect("the conformity-check TypeScript sibling");
    for t in [
        ViolationType::Unregistered,
        ViolationType::MissingPortal,
        ViolationType::Deprecated,
        ViolationType::VersionMismatch,
        ViolationType::MissingAria,
        ViolationType::MissingSlot,
    ] {
        assert!(
            ts.contains(&format!("\"{}\"", t.as_str())),
            "violation type {}",
            t.as_str()
        );
    }
    for s in [
        ViolationSeverity::Info,
        ViolationSeverity::Warning,
        ViolationSeverity::Error,
    ] {
        assert!(
            ts.contains(&format!("\"{}\"", s.as_str())),
            "severity {}",
            s.as_str()
        );
    }
    assert!(ts.contains("data-slot"), "the slot attribute drifted");
    assert!(ts.contains("data-portal"), "the portal attribute drifted");
}

// ═══════════════════════════════════════════════════════════════════════════
// mzizi-a11y-audit — the rules, the score, and the heading order
// ═══════════════════════════════════════════════════════════════════════════

use mzizi_assurance::mzizi_a11y_audit::{
    A11yConfig, A11yLevel, HitBox, ObservedNode, Rule, audit, check_node, css_selector,
    guess_node_from_slot, meets_threshold, resolve_node, worst_level,
};

fn a11y_ts() -> String {
    let path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("../../../components/registry/n8-assurance/mzizi-a11y-audit.ts");
    fs::read_to_string(&path)
        .unwrap_or_else(|e| panic!("cannot read the TypeScript sibling at {path:?}: {e}"))
}

fn node(tag: &str) -> ObservedNode {
    ObservedNode {
        tag_name: tag.to_owned(),
        visible: true,
        ..ObservedNode::default()
    }
}

fn button(name: Option<&str>, hit: Option<(f64, f64)>) -> ObservedNode {
    ObservedNode {
        aria_label: name.map(str::to_owned),
        hit_box: hit.map(|(width, height)| HitBox { width, height }),
        ..node("BUTTON")
    }
}

fn no_registry() -> BTreeMap<String, u32> {
    BTreeMap::new()
}

#[test]
fn one_element_reports_every_rule_it_breaks() {
    // THE PRIMARY BUG. The .ts chains its rules with `else if`, so the first
    // finding hides the rest — and a button with no accessible name is exactly
    // the button most likely to also be too small to hit.
    let broken = button(None, Some((24.0, 24.0)));

    let found = check_node(&broken, None, &A11yConfig::default(), &no_registry());
    let rules: BTreeSet<Rule> = found.iter().map(|v| v.rule).collect();
    assert!(rules.contains(&Rule::ButtonName), "the name rule ran");
    assert!(rules.contains(&Rule::TouchTarget), "the size rule ran too");
    assert_eq!(found.len(), 2);
}

#[test]
fn an_image_with_no_alt_is_still_checked_for_everything_else() {
    // Same else-if chain, seen from the img branch: in the .ts an <img> missing
    // alt exits before any other rule is considered.
    let img = ObservedNode {
        role: Some("button".to_owned()),
        hit_box: Some(HitBox {
            width: 16.0,
            height: 16.0,
        }),
        ..node("IMG")
    };

    let found = check_node(&img, None, &A11yConfig::default(), &no_registry());
    let rules: BTreeSet<Rule> = found.iter().map(|v| v.rule).collect();
    assert!(rules.contains(&Rule::ImgAlt));
    assert!(rules.contains(&Rule::ButtonName));
    assert!(rules.contains(&Rule::TouchTarget));
}

#[test]
fn an_empty_alt_is_a_decorative_image_and_passes() {
    // `alt=""` is the documented way to say "decorative". Absent is the defect.
    let mut decorative = node("IMG");
    decorative.alt = Some(String::new());
    assert!(
        check_node(&decorative, None, &A11yConfig::default(), &no_registry()).is_empty(),
        "alt=\"\" is a deliberate answer, not a missing one"
    );

    let missing = node("IMG");
    assert_eq!(
        check_node(&missing, None, &A11yConfig::default(), &no_registry())[0].rule,
        Rule::ImgAlt
    );
}

#[test]
fn a_conformant_button_counts_as_a_pass() {
    // THE SCORE INVERSION. In the .ts `passes++` lives only in branches an
    // interactive element cannot reach, so a page of correct buttons scored
    // LOWER than a page of divs — the number moved the wrong way as
    // accessibility improved.
    let good = button(Some("Save"), Some((44.0, 44.0)));
    let result = audit(
        "/wallet",
        &[good.clone(), good.clone(), good],
        &A11yConfig::default(),
        &no_registry(),
    );

    assert_eq!(result.total_elements, 3);
    assert_eq!(result.passes, 3, "a correct button is a pass");
    assert_eq!(result.score, 100);
    assert!(result.violations.is_empty());
}

#[test]
fn the_score_falls_only_as_violations_rise() {
    let good = button(Some("Save"), Some((44.0, 44.0)));
    let bad = button(None, Some((44.0, 44.0)));
    let result = audit(
        "/wallet",
        &[good.clone(), good, bad],
        &A11yConfig::default(),
        &no_registry(),
    );
    assert_eq!(result.passes, 2);
    assert_eq!(result.score, 67);
    assert!(!meets_threshold(&result, 90));
    assert!(meets_threshold(&result, 60));
}

#[test]
fn an_empty_page_is_not_a_division_by_zero() {
    let result = audit("/", &[], &A11yConfig::default(), &no_registry());
    assert_eq!(result.score, 100);
    assert_eq!(result.total_elements, 0, "the count says it was untested");
}

#[test]
fn the_touch_target_floor_measures_the_hit_area_not_the_painted_box() {
    // Mzizi's control scale is h-8 / h-9 / h-10 — 32-40px — by deliberate
    // decision (CLAUDE.md §8.2), and §8.2 says a dense control earns its hit
    // area through padding or spacing. The .ts measures getBoundingClientRect(),
    // so every correctly-built Mzizi control failed this rule: a design system
    // that fails its own audit universally teaches everyone to ignore the audit.
    let dense_but_padded = ObservedNode {
        hit_box: Some(HitBox {
            width: 48.0,
            height: 48.0,
        }),
        ..button(Some("Save"), None)
    };
    assert!(
        check_node(
            &dense_but_padded,
            None,
            &A11yConfig::default(),
            &no_registry()
        )
        .is_empty(),
        "an h-9 control with real padding around it is not a violation"
    );

    let genuinely_small = button(Some("Save"), Some((44.0, 30.0)));
    let found = check_node(
        &genuinely_small,
        None,
        &A11yConfig::default(),
        &no_registry(),
    );
    assert_eq!(found[0].rule, Rule::TouchTarget);
    assert_eq!(found[0].level, A11yLevel::Moderate);
    assert!(
        found[0].message.contains("44×30px"),
        "the message names the measured size: {}",
        found[0].message
    );
}

#[test]
fn an_unmeasured_or_hidden_control_is_not_accused_of_being_small() {
    // No hit box means the host could not measure, which is not evidence of a
    // small target. Reporting one would be inventing a finding.
    let unmeasured = button(Some("Save"), None);
    assert!(check_node(&unmeasured, None, &A11yConfig::default(), &no_registry()).is_empty());

    let mut hidden = button(Some("Save"), Some((0.0, 0.0)));
    hidden.visible = false;
    assert!(check_node(&hidden, None, &A11yConfig::default(), &no_registry()).is_empty());
}

#[test]
fn the_heading_order_rule_actually_evaluates_something() {
    // The .ts carries `// Rule: Headings should be in order` above a branch that
    // matches H1-H6 and then only counts a pass. A stated rule that evaluates
    // nothing reads as coverage and is worse than an absent one.
    let page = vec![node("H1"), node("H2"), node("H4"), node("P")];
    let result = audit("/docs", &page, &A11yConfig::default(), &no_registry());

    assert_eq!(result.violations.len(), 1);
    assert_eq!(result.violations[0].rule, Rule::HeadingOrder);
    assert_eq!(result.violations[0].element, "H4");
    assert!(result.violations[0].message.contains("h2 → h4"));
}

#[test]
fn a_heading_may_close_a_section_without_skipping() {
    // h4 → h2 goes back UP the outline, which ends a section rather than
    // leaving a gap. Only descending more than one level is a skip.
    let page = vec![node("H1"), node("H2"), node("H3"), node("H2")];
    let result = audit("/docs", &page, &A11yConfig::default(), &no_registry());
    assert!(result.violations.is_empty(), "{:?}", result.violations);
}

#[test]
fn the_first_heading_on_a_page_is_compared_against_nothing_above_it() {
    let starts_deep = audit(
        "/docs",
        &[node("H3")],
        &A11yConfig::default(),
        &no_registry(),
    );
    assert_eq!(starts_deep.violations.len(), 1, "h3 with no h1 or h2 above");

    let starts_right = audit(
        "/docs",
        &[node("H1")],
        &A11yConfig::default(),
        &no_registry(),
    );
    assert!(starts_right.violations.is_empty());
}

#[test]
fn heading_order_reads_document_order() {
    // Which is why `audit` takes a slice in the order the host saw them, and why
    // that is stated in the signature's docs rather than assumed.
    let forwards = audit(
        "/docs",
        &[node("H1"), node("H2"), node("H3")],
        &A11yConfig::default(),
        &no_registry(),
    );
    assert!(forwards.violations.is_empty());

    let shuffled = audit(
        "/docs",
        &[node("H3"), node("H1"), node("H2")],
        &A11yConfig::default(),
        &no_registry(),
    );
    assert_eq!(shuffled.violations.len(), 1);
}

#[test]
fn a_disabled_rule_produces_nothing_and_an_empty_set_is_not_absence() {
    let broken = button(None, Some((10.0, 10.0)));

    let names_only = A11yConfig {
        rules: Some([Rule::ButtonName].into_iter().collect()),
        ..A11yConfig::default()
    };
    let found = check_node(&broken, None, &names_only, &no_registry());
    assert_eq!(found.len(), 1);
    assert_eq!(found[0].rule, Rule::ButtonName);

    let nothing = A11yConfig {
        rules: Some(BTreeSet::new()),
        ..A11yConfig::default()
    };
    assert!(
        check_node(&broken, None, &nothing, &no_registry()).is_empty(),
        "an explicitly empty rule set runs no rules"
    );
    assert_eq!(
        check_node(&broken, None, &A11yConfig::default(), &no_registry()).len(),
        2,
        "unconfigured runs every rule"
    );
}

#[test]
fn a_selector_survives_an_id_that_is_not_an_identifier() {
    // The .ts emits `#${el.id}` raw, so an id with a space, a quote or a leading
    // digit yields a selector that does not parse — and finding the element
    // again is the selector's only job.
    let mut plain = node("BUTTON");
    plain.id = Some("save-button".to_owned());
    assert_eq!(css_selector(&plain), "#save-button");

    let mut awkward = node("BUTTON");
    awkward.id = Some("2 items\"".to_owned());
    assert_eq!(css_selector(&awkward), "[id=\"2 items\\\"\"]");

    let mut slotted = node("BUTTON");
    slotted.data_slot = Some("nyuchi-wallet-card".to_owned());
    assert_eq!(css_selector(&slotted), "[data-slot=\"nyuchi-wallet-card\"]");

    let mut classy = node("BUTTON");
    classy.first_class = Some("inline-flex".to_owned());
    assert_eq!(css_selector(&classy), "button.inline-flex");

    // A Tailwind arbitrary-variant class is not a bare identifier.
    let mut arbitrary = node("BUTTON");
    arbitrary.first_class = Some("[&>svg]:size-4".to_owned());
    assert_eq!(
        css_selector(&arbitrary),
        "button[class~=\"[&>svg]:size-4\"]"
    );

    assert_eq!(css_selector(&node("SPAN")), "span");
}

#[test]
fn the_registry_outranks_the_slot_name_heuristic() {
    // guessNodeFromSlot can only ever answer 2, 3 or 6, so an N7 shell component
    // is labelled N6 and routed to the wrong owner — and N1, N4, N5 and N8-N12
    // are answers it cannot reach at all.
    assert_eq!(guess_node_from_slot("nyuchi-wallet-card"), Some(3));
    assert_eq!(guess_node_from_slot("dashboard-page"), Some(6));
    assert_eq!(guess_node_from_slot("button"), Some(2));

    let registry: BTreeMap<String, u32> =
        [("nyuchi-app-shell".to_owned(), 7)].into_iter().collect();
    assert_eq!(
        resolve_node(Some("nyuchi-app-shell"), &registry),
        Some(7),
        "the registry knows the real node"
    );
    assert_eq!(
        resolve_node(Some("nyuchi-app-shell"), &no_registry()),
        Some(3),
        "the heuristic is the fallback, and it is wrong here"
    );
    assert_eq!(resolve_node(None, &registry), None);
}

#[test]
fn a_violation_carries_the_component_identity_it_was_found_on() {
    let mut broken = button(None, None);
    broken.data_slot = Some("nyuchi-wallet-card".to_owned());
    broken.data_portal = Some("https://mzizi.dev/components/nyuchi-wallet-card".to_owned());

    let registry: BTreeMap<String, u32> =
        [("nyuchi-wallet-card".to_owned(), 3)].into_iter().collect();
    let found = check_node(&broken, None, &A11yConfig::default(), &registry);
    assert_eq!(
        found[0].component_name.as_deref(),
        Some("nyuchi-wallet-card")
    );
    assert_eq!(found[0].node, Some(3));
    assert!(found[0].portal_url.is_some());
    assert!(
        !found[0].fix.is_empty(),
        "a finding says what to do about it"
    );
}

#[test]
fn a_lowercase_tag_is_the_same_element() {
    // The DOM reports uppercase; server-rendered HTML handed to a CI run does not.
    let mut lower = button(None, None);
    lower.tag_name = "button".to_owned();
    assert!(lower.is_button());
    assert_eq!(
        check_node(&lower, None, &A11yConfig::default(), &no_registry())[0].rule,
        Rule::ButtonName
    );
}

#[test]
fn worst_level_gives_one_go_no_go_answer() {
    let page = vec![
        node("IMG"),
        button(Some("Save"), Some((20.0, 20.0))),
        button(Some("Save"), Some((44.0, 44.0))),
    ];
    let result = audit("/wallet", &page, &A11yConfig::default(), &no_registry());
    assert_eq!(worst_level(&result.violations), Some(A11yLevel::Critical));
    assert_eq!(worst_level(&[]), None);
}

#[test]
fn the_wire_spellings_match_the_typescript() {
    // A renamed rule or level silently reclassifies every historical finding.
    let ts = a11y_ts();
    for level in [
        A11yLevel::Critical,
        A11yLevel::Serious,
        A11yLevel::Moderate,
        A11yLevel::Minor,
    ] {
        assert!(
            ts.contains(&format!("\"{}\"", level.as_str())),
            "level {}",
            level.as_str()
        );
    }
    for rule in [Rule::ImgAlt, Rule::ButtonName, Rule::TouchTarget] {
        assert!(
            ts.contains(&format!("\"{}\"", rule.as_str())),
            "rule {}",
            rule.as_str()
        );
    }
    // heading-order is deliberately absent from the .ts as a STRING: it is a
    // comment there and a rule here. Asserting it would demand the defect.
    assert!(
        !ts.contains("\"heading-order\""),
        "the .ts gained a heading-order rule — reconcile the two, do not just \
         delete this assertion"
    );
    assert!(
        ts.contains("Headings should be in order"),
        "the .ts still states the rule it does not implement"
    );
    assert!(
        ts.contains("44"),
        "the touch-target floor drifted from the sibling"
    );
}
