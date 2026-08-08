//! Contract tests — the N9 Rust core against its TypeScript sibling.
//!
//! The escaping tests here are the load-bearing ones. Every field in a fundi
//! report ultimately derives from a runtime error message, and an error message
//! is attacker-influenced whenever any user input reaches an exception — a
//! rejected filename, a malformed address, a pasted value. That text is then
//! interpolated into a Markdown document filed automatically into an issue
//! tracker that humans triage.
//!
//! GitHub sanitises rendered HTML, so the risk is content forgery rather than
//! script execution. That is not a small risk for this component: the body ends
//! with a provenance line saying which tool filed it, and a report that can forge
//! that line can claim to be from a source it is not.

use std::fs;
use std::path::PathBuf;

use mzizi_fundi::nyuchi_fundi_reporter::{
    CooldownLog, ErrorType, FundiReport, NotFiled, ReportSeverity, escape_code_span,
    escape_markdown_cell, issue_body, issue_title, labels_for,
};

fn ts_sibling() -> String {
    let path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("../../../components/registry/n9-fundi/nyuchi-fundi-reporter.ts");
    fs::read_to_string(&path)
        .unwrap_or_else(|e| panic!("cannot read the TypeScript sibling at {path:?}: {e}"))
}

fn report() -> FundiReport {
    FundiReport {
        component: "button".to_owned(),
        node: 2,
        severity: ReportSeverity::High,
        error_type: ErrorType::Render,
        source: "error-tracker".to_owned(),
        title: "render failed".to_owned(),
        description: "the button threw".to_owned(),
        portal_url: Some("https://mzizi.dev/components/button".to_owned()),
        diagnostic: None,
        affected_mini_apps: vec!["wallet".to_owned()],
        blast_radius: vec!["card".to_owned()],
    }
}

// ── cooldown ───────────────────────────────────────────────────────────────

#[test]
fn a_failed_filing_does_not_start_the_cooldown() {
    // THE BUG THIS PORT FIXES. The .ts records the cooldown BEFORE the fetch, so
    // a GitHub outage, a 401 or a rate limit suppressed every retry for five
    // minutes — consuming the signal without ever producing an issue.
    let mut log = CooldownLog::new(300.0);
    assert!(log.may_file(&report(), 0.0).is_ok());
    // The host tried and failed, so it does NOT call record_filed.
    assert!(
        log.may_file(&report(), 1.0).is_ok(),
        "a failed attempt must not suppress the retry"
    );
    log.record_filed(&report(), 1.0);
    assert_eq!(log.may_file(&report(), 2.0), Err(NotFiled::InCooldown));
}

#[test]
fn distinct_error_types_on_one_component_are_distinct_defects() {
    // The .ts keys the cooldown on the component alone, so a component with a
    // render bug and a network bug filed one and silently dropped the other.
    let mut log = CooldownLog::new(300.0);
    let render = report();
    let network = FundiReport {
        error_type: ErrorType::Network,
        ..report()
    };
    log.record_filed(&render, 0.0);
    assert_eq!(log.may_file(&render, 1.0), Err(NotFiled::InCooldown));
    assert!(
        log.may_file(&network, 1.0).is_ok(),
        "a different defect is not a duplicate"
    );
}

#[test]
fn the_cooldown_expires() {
    let mut log = CooldownLog::new(300.0);
    log.record_filed(&report(), 0.0);
    assert_eq!(
        log.may_file(&report(), 299_000.0),
        Err(NotFiled::InCooldown)
    );
    assert!(log.may_file(&report(), 300_000.0).is_ok());
}

// ── escaping ───────────────────────────────────────────────────────────────

#[test]
fn a_backtick_cannot_close_the_code_span_it_sits_in() {
    // `component` renders inside a backtick span. A backtick closes it and
    // everything after renders as Markdown — which is how a component name
    // becomes a heading in an automated issue.
    let evil = FundiReport {
        component: "button` ## Injected heading".to_owned(),
        ..report()
    };
    let body = issue_body(&evil);
    assert!(!body.contains("button` ##"), "the span was closed:\n{body}");
    assert!(body.contains("button' ## Injected heading"));
}

#[test]
fn a_pipe_cannot_forge_table_columns() {
    let evil = FundiReport {
        source: "error-tracker | Severity | critical".to_owned(),
        ..report()
    };
    let body = issue_body(&evil);
    assert!(body.contains("\\|"), "the pipe was not escaped:\n{body}");
}

#[test]
fn a_newline_cannot_escape_a_table_row_or_forge_the_footer() {
    // The body ends with a provenance line naming the tool that filed it. A
    // report able to forge that line can claim a source it does not have, and a
    // triager reading an automated issue trusts exactly that line.
    let evil = FundiReport {
        source: "x\n\n---\n*Filed by someone-else*\n".to_owned(),
        ..report()
    };
    let body = issue_body(&evil);

    // Assert on STRUCTURE, not on a substring. The injected text does appear in
    // the body — as literal content inside the table cell, which is exactly
    // where it should be and is harmless there. What must not happen is that it
    // escapes the row and becomes a block of its own.
    //
    // A first version of this test counted occurrences of "*Filed by" and failed,
    // reporting a forgery that had not happened. That is the same mistake as
    // banning the string "mzizi.dev/api/rum" in the N8 suite: a check that cannot
    // tell content from structure fails on the safe case.
    let own_line = |prefix: &str| {
        body.lines()
            .filter(|l| l.trim_start().starts_with(prefix))
            .count()
    };
    assert_eq!(
        own_line("*Filed by"),
        1,
        "a second provenance line escaped the cell:\n{body}"
    );
    assert_eq!(
        own_line("---"),
        1,
        "a second horizontal rule escaped the cell:\n{body}"
    );

    // And the row itself is still one row.
    assert_eq!(
        body.lines().filter(|l| l.starts_with("| Source |")).count(),
        1,
        "the Source row was split:\n{body}"
    );
}

#[test]
fn a_url_cannot_break_out_of_its_link() {
    // `[View](url)` ends at the first `)`, so a URL containing one lets the rest
    // render as prose. Angle brackets are Markdown's literal-URL form.
    let evil = FundiReport {
        portal_url: Some("https://evil/a)  [Click me](https://evil/b".to_owned()),
        ..report()
    };
    let body = issue_body(&evil);
    assert!(
        body.contains("[View](<"),
        "the URL is not in angle-bracket form:\n{body}"
    );
    assert_eq!(
        body.matches("[Click me]").count(),
        1,
        "content, not a second real link"
    );
}

#[test]
fn a_fence_inside_a_diagnostic_cannot_end_the_block() {
    // The diagnostic is host-serialised JSON that can contain anything. A
    // three-backtick fence inside a three-backtick block closes it and spills
    // the remainder into prose, so the block is four.
    let evil = FundiReport {
        diagnostic: Some("{\"x\":\"```\\n## escaped\"}".to_owned()),
        ..report()
    };
    let body = issue_body(&evil);
    assert!(
        body.contains("````json"),
        "the fence is not widened:\n{body}"
    );
}

#[test]
fn escaping_backslashes_first_stops_the_escapes_being_escaped() {
    // Escaping `|` before `\` lets `\|` in the input become `\\|` — a literal
    // backslash followed by an unescaped pipe.
    assert_eq!(escape_markdown_cell("a\\|b"), "a\\\\\\|b");
    assert_eq!(escape_code_span("a`b\nc"), "a'b c");
}

#[test]
fn a_title_stays_one_line() {
    let evil = FundiReport {
        title: "boom\n\n## Injected".to_owned(),
        ..report()
    };
    assert!(!issue_title(&evil).contains('\n'));
}

// ── agreement with the TypeScript ──────────────────────────────────────────

#[test]
fn labels_match_the_typescript_shape() {
    let labels = labels_for(&report());
    assert_eq!(labels[0], "fundi:severity/high");
    assert_eq!(labels[1], "fundi:node/2");
    assert_eq!(labels[2], "fundi:type/render");
    assert_eq!(labels[3], "fundi:source/error-tracker");
    let ts = ts_sibling();
    for prefix in [
        "fundi:severity/",
        "fundi:node/",
        "fundi:type/",
        "fundi:source/",
    ] {
        assert!(ts.contains(prefix), "label prefix {prefix} drifted");
    }
}

#[test]
fn every_severity_and_error_type_keeps_its_typescript_spelling() {
    let ts = ts_sibling();
    for s in [
        ReportSeverity::Low,
        ReportSeverity::Medium,
        ReportSeverity::High,
        ReportSeverity::Critical,
    ] {
        assert!(
            ts.contains(&format!("\"{}\"", s.as_str())),
            "severity {}",
            s.as_str()
        );
    }
    for t in [
        ErrorType::Render,
        ErrorType::Network,
        ErrorType::Data,
        ErrorType::Auth,
        ErrorType::Chain,
        ErrorType::Crypto,
        ErrorType::Timeout,
        ErrorType::A11y,
        ErrorType::Perf,
        ErrorType::Conformity,
        ErrorType::Slo,
    ] {
        assert!(
            ts.contains(&format!("\"{}\"", t.as_str())),
            "error type {}",
            t.as_str()
        );
    }
}

#[test]
fn the_body_keeps_the_typescript_section_headings() {
    let ts = ts_sibling();
    let body = issue_body(&report());
    for heading in [
        "## Component Failure Report",
        "### Description",
        "### Affected Mini-Apps",
        "### Blast Radius",
    ] {
        assert!(body.contains(heading), "body lost {heading}");
        assert!(ts.contains(heading), "the TypeScript lost {heading}");
    }
    assert!(body.contains("*Filed by nyuchi-fundi-reporter"));
}

#[test]
fn the_typescript_still_files_against_the_renamed_repo() {
    // It said nyuchi/design-portal and worked only because GitHub redirects a
    // renamed repo — which will break every consumer at once when that retires.
    let ts = ts_sibling();
    assert!(ts.contains("nyuchi/mzizi"), "the repo constant regressed");
    assert!(
        !ts.contains("\"nyuchi/design-portal\""),
        "the stale repo name returned"
    );
}

// ── learning ───────────────────────────────────────────────────────────────

use mzizi_fundi::nyuchi_fundi_learning::{
    HealingOutcome, LearningLog, ResolvedBy, Severity as LearnSeverity,
};

fn outcome(
    component: &str,
    error_type: &str,
    sev: LearnSeverity,
    recurred: bool,
) -> HealingOutcome {
    HealingOutcome {
        issue_id: 1,
        component: component.to_owned(),
        node: 2,
        error_type: error_type.to_owned(),
        severity: sev,
        plan_actions: vec!["patch".to_owned()],
        actual_fix: "patched".to_owned(),
        fundi_was_correct: true,
        time_to_resolve_minutes: 10.0,
        recurred,
        resolved_by: ResolvedBy::Fundi,
        recorded_at_ms: 0.0,
    }
}

#[test]
fn recurrence_escalates_severity_and_never_lowers_it() {
    // THE BUG THIS PORT FIXES. The .ts returns "high" outright once something
    // has recurred more than twice — LOWERING a critical defect that keeps
    // coming back. Recurrence is evidence the first assessment was too generous,
    // never too harsh.
    let mut log = LearningLog::default();
    for _ in 0..3 {
        log.record(outcome("button", "render", LearnSeverity::Critical, true));
    }
    assert_eq!(
        log.suggest_severity("button", "render"),
        LearnSeverity::Critical,
        "a repeatedly recurring critical defect must not be downgraded"
    );

    let mut low = LearningLog::default();
    for _ in 0..3 {
        low.record(outcome("card", "render", LearnSeverity::Low, true));
    }
    assert_eq!(
        low.suggest_severity("card", "render"),
        LearnSeverity::High,
        "and it does escalate"
    );
}

#[test]
fn few_recurrences_keep_the_last_severity() {
    let mut log = LearningLog::default();
    log.record(outcome("button", "render", LearnSeverity::Low, true));
    log.record(outcome("button", "render", LearnSeverity::Low, true));
    assert_eq!(log.suggest_severity("button", "render"), LearnSeverity::Low);
}

#[test]
fn no_history_suggests_medium() {
    let log = LearningLog::default();
    assert_eq!(
        log.suggest_severity("unseen", "render"),
        LearnSeverity::Medium
    );
    // And an unrecognised wire value is Medium too — an unknown risk treated as
    // harmless is how things get missed.
    assert_eq!(
        LearnSeverity::from_str_or_medium("nonsense"),
        LearnSeverity::Medium
    );
}

#[test]
fn history_is_bounded() {
    // The .ts pushes forever, in a component whose whole purpose is to
    // accumulate — so a long-lived Worker or session leaks until it dies.
    let mut log = LearningLog::new(3);
    for i in 0..10 {
        log.record(outcome(
            &format!("c{i}"),
            "render",
            LearnSeverity::Low,
            false,
        ));
    }
    assert_eq!(log.outcomes().len(), 3);
    assert_eq!(log.outcomes()[2].component, "c9", "the newest is kept");
}

#[test]
fn both_readings_of_accuracy_are_available() {
    // accuracy counts correct diagnoses over ALL outcomes, including ones fundi
    // never attempted. That is the .ts's definition and it is preserved rather
    // than quietly redefined in the flattering direction.
    let mut log = LearningLog::default();
    log.record(outcome("a", "render", LearnSeverity::Low, false));
    log.record(HealingOutcome {
        fundi_was_correct: false,
        resolved_by: ResolvedBy::Human,
        ..outcome("b", "render", LearnSeverity::Low, false)
    });
    let stats = log.stats();
    assert_eq!(stats.total_issues, 2);
    assert_eq!(stats.auto_fixed, 1);
    assert_eq!(stats.human_fixed, 1);
    assert!((stats.accuracy - 0.5).abs() < 1e-9, "over all outcomes");
    assert!(
        (stats.accuracy_over_attempts - 1.0).abs() < 1e-9,
        "over attempts only"
    );
}

#[test]
fn rankings_are_deterministic_when_counts_tie() {
    // The .ts sorts a Map whose iteration order is insertion order, so equal
    // counts swap places depending on which failed first — and a "top failing
    // components" list that reshuffles between refreshes is one nobody trusts.
    let mut log = LearningLog::default();
    log.record(outcome("zebra", "render", LearnSeverity::Low, false));
    log.record(outcome("alpha", "render", LearnSeverity::Low, false));
    let top = log.stats().top_failing_components;
    assert_eq!(top[0].name, "alpha", "ties break by name, not by arrival");
    assert_eq!(top[1].name, "zebra");
}

#[test]
fn empty_stats_are_zero_not_nan() {
    // total is a denominator in three places; dividing by it unguarded yields
    // NaN, which serialises to null and renders as a blank tile.
    let stats = LearningLog::default().stats();
    assert_eq!(stats.total_issues, 0);
    assert_eq!(stats.accuracy, 0.0);
    assert_eq!(stats.recurrence_rate, 0.0);
    assert!(stats.top_failing_components.is_empty());
}

#[test]
fn learning_keeps_its_typescript_spellings_and_limits() {
    let ts = fs::read_to_string(
        PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("../../../components/registry/n9-fundi/nyuchi-fundi-learning.ts"),
    )
    .expect("the fundi-learning TypeScript sibling");
    for r in [ResolvedBy::Fundi, ResolvedBy::Human, ResolvedBy::Both] {
        assert!(
            ts.contains(&format!("\"{}\"", r.as_str())),
            "resolvedBy {}",
            r.as_str()
        );
    }
    assert!(ts.contains("slice(0, 10)"), "top-components limit drifted");
    assert!(ts.contains("slice(0, 5)"), "top-error-types limit drifted");

    let mut log = LearningLog::default();
    for i in 0..20 {
        log.record(outcome(
            &format!("c{i}"),
            &format!("t{i}"),
            LearnSeverity::Low,
            false,
        ));
    }
    let stats = log.stats();
    assert_eq!(stats.top_failing_components.len(), 10);
    assert_eq!(stats.top_error_types.len(), 5);
}
