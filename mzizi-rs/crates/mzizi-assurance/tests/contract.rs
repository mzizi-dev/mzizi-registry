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
