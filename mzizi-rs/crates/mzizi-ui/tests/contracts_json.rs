//! The registry's contracts (`contracts/<family>/<name>.contract.json`), evaluated on the Rust
//! builds that implement them in full.
//!
//! One contract per component, whatever the language (owner, 2026-10-05; #427). For every
//! contract whose `.rs` implementation has `identity: "contract"` and lives in this crate, this
//! suite renders every state the contract declares with `dioxus-ssr` and evaluates, on the
//! markup, every clause (through the shared evaluator in `mzizi-rs/contract-eval/`), every check,
//! every density row and the CSP rule (no inline `style` attribute, #444). The `.astro` and `.tsx` are held to the same file by `__tests__/astro`
//! and `__tests__/contracts`. A clause, check or selector this suite cannot evaluate fails
//! (RFC-0006, FM-12).

use std::cell::RefCell;
use std::fs;
use std::path::PathBuf;

use dioxus::prelude::*;
use mzizi_ui::card::CardSize;
use mzizi_ui::{
    Alert, AlertVariant, Badge, BadgeVariant, Button, ButtonSize, ButtonVariant, Card, Input,
    Label, MarkdownLinks, MarkdownRenderer, MarkdownSource, SafeAreaFrame, Skeleton, StatusBadge,
    StatusBadgeStatus,
};
use serde_json::Value;

#[path = "../../../contract-eval/contract_eval.rs"]
mod contract_eval;
use contract_eval::{
    Case, Rendered, declared_height, holds, inline_styles, parse, render, select, tokens,
};

fn repo() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../../..")
}

/// Every contract file whose Rust build implements the whole contract.
fn contract_identity_contracts() -> Vec<(String, Value)> {
    rust_contracts()
        .into_iter()
        .filter(|(_, json)| json["implementations"]["rs"]["identity"] == "contract")
        .collect()
}

/// Every contract file that declares a Rust build in this crate, whatever its identity.
fn rust_contracts() -> Vec<(String, Value)> {
    let dir = repo().join("contracts");
    let mut out = Vec::new();
    let mut families: Vec<_> = fs::read_dir(&dir)
        .unwrap()
        .filter_map(Result::ok)
        .filter(|e| e.path().is_dir() && e.file_name() != "schema")
        .collect();
    families.sort_by_key(|e| e.file_name());
    for family in families {
        let mut files: Vec<_> = fs::read_dir(family.path())
            .unwrap()
            .filter_map(Result::ok)
            .filter(|e| e.file_name().to_string_lossy().ends_with(".contract.json"))
            .collect();
        files.sort_by_key(|e| e.file_name());
        for f in files {
            let json: Value = serde_json::from_str(&fs::read_to_string(f.path()).unwrap())
                .unwrap_or_else(|e| panic!("{:?} is not JSON: {e}", f.path()));
            if json["implementations"]["rs"]["registry"].is_string() {
                out.push((json["name"].as_str().unwrap().to_owned(), json));
            }
        }
    }
    out
}

// ─── Rendering a contract state ─────────────────────────────────────────────────────────────
//
// `render` takes a plain `fn`, so a state's props reach the component through a thread-local
// set just before rendering.

thread_local! {
    static PROPS: RefCell<Value> = const { RefCell::new(Value::Null) };
}

fn prop(name: &str) -> Option<String> {
    PROPS.with(|p| p.borrow()["props"][name].as_str().map(str::to_owned))
}

fn slot(name: &str) -> Option<String> {
    PROPS.with(|p| p.borrow()["slots"][name].as_str().map(str::to_owned))
}

fn status_badge_state() -> Element {
    let status = match prop("status").as_deref() {
        None | Some("stable") => StatusBadgeStatus::Stable,
        Some("beta") => StatusBadgeStatus::Beta,
        Some("alpha") => StatusBadgeStatus::Alpha,
        Some("deprecated") => StatusBadgeStatus::Deprecated,
        Some(other) => panic!("status-badge: the contract names an unknown status `{other}`"),
    };
    match slot("default") {
        Some(label) => rsx! { StatusBadge { status, "{label}" } },
        None => rsx! { StatusBadge { status } },
    }
}

fn flag(name: &str) -> bool {
    PROPS.with(|p| p.borrow()["props"][name] == true)
}

fn text(name: &str) -> String {
    slot(name).unwrap_or_default()
}

/// `app/badge`: the registry badge, held to that contract by identity (`slot+variants`).
fn badge_state() -> Element {
    let variant = match prop("variant").as_deref() {
        None | Some("default") => BadgeVariant::Default,
        Some("secondary") => BadgeVariant::Secondary,
        Some("destructive") => BadgeVariant::Destructive,
        Some("outline") => BadgeVariant::Outline,
        Some("ghost") => BadgeVariant::Ghost,
        Some("link") => BadgeVariant::Link,
        Some(other) => panic!("badge: the contract names an unknown variant `{other}`"),
    };
    let label = text("default");
    rsx! { Badge { variant, "{label}" } }
}

fn button_state() -> Element {
    let variant = match prop("variant").as_deref() {
        None | Some("default") => ButtonVariant::Default,
        Some("outline") => ButtonVariant::Outline,
        Some("secondary") => ButtonVariant::Secondary,
        Some("ghost") => ButtonVariant::Ghost,
        Some("destructive") => ButtonVariant::Destructive,
        Some("link") => ButtonVariant::Link,
        Some(other) => panic!("button: the contract names an unknown variant `{other}`"),
    };
    let size = match prop("size").as_deref() {
        None | Some("default") => ButtonSize::Default,
        Some("sm") => ButtonSize::Sm,
        Some("lg") => ButtonSize::Lg,
        Some("icon") => ButtonSize::Icon,
        Some("icon-sm") => ButtonSize::IconSm,
        Some(other) => panic!("button: the contract names an unknown size `{other}`"),
    };
    let label = text("default");
    if flag("disabled") {
        rsx! { Button { variant, size, disabled: true, "{label}" } }
    } else {
        rsx! { Button { variant, size, "{label}" } }
    }
}

fn card_state() -> Element {
    let size = match prop("size").as_deref() {
        None | Some("default") => CardSize::Default,
        Some("sm") => CardSize::Sm,
        Some(other) => panic!("card: the contract names an unknown size `{other}`"),
    };
    let body = text("default");
    rsx! { Card { size, loading: flag("loading"), "{body}" } }
}

fn input_state() -> Element {
    let name = prop("name").unwrap_or_default();
    let kind = prop("type").unwrap_or_default();
    let label = prop("aria-label").unwrap_or_default();
    rsx! { Input { name, r#type: kind, aria_label: label } }
}

fn label_state() -> Element {
    let target = prop("for").unwrap_or_default();
    let body = text("default");
    rsx! { Label { r#for: target, "{body}" } }
}

fn num(name: &str) -> Option<u32> {
    PROPS.with(|p| {
        p.borrow()["props"][name]
            .as_u64()
            .map(|n| u32::try_from(n).expect("a contract number fits in u32"))
    })
}

fn alert_state() -> Element {
    let variant = match prop("variant").as_deref() {
        None | Some("default") => AlertVariant::Default,
        Some("destructive") => AlertVariant::Destructive,
        Some(other) => panic!("alert: the contract names an unknown variant `{other}`"),
    };
    let body = text("default");
    rsx! { Alert { variant, "{body}" } }
}

fn markdown_renderer_state() -> Element {
    let content = prop("content").expect("markdown-renderer: content");
    let links = match prop("links").as_deref() {
        None | Some("safe") => MarkdownLinks::Safe,
        Some("https") => MarkdownLinks::Https,
        Some(other) => panic!("markdown-renderer: the contract names an unknown links `{other}`"),
    };
    let from = match prop("from").as_deref() {
        None | Some("markdown") => MarkdownSource::Markdown,
        Some("html") => MarkdownSource::Html,
        Some("auto") => MarkdownSource::Auto,
        Some(other) => panic!("markdown-renderer: the contract names an unknown from `{other}`"),
    };
    let heading_base =
        num("headingBase").map_or(1, |n| u8::try_from(n).expect("headingBase fits u8"));
    let class = prop("class").unwrap_or_default();
    rsx! { MarkdownRenderer { content, links, from, heading_base, class } }
}

fn skeleton_state() -> Element {
    let class = prop("class").unwrap_or_default();
    rsx! { Skeleton { class } }
}

fn safe_area_frame_state() -> Element {
    let width = num("width").expect("safe-area-frame: width");
    let height = num("height").expect("safe-area-frame: height");
    let safe = PROPS.with(|p| {
        p.borrow()["props"]["safe"].as_array().map_or([0; 4], |a| {
            let n = |i: usize| u32::try_from(a[i].as_u64().unwrap()).unwrap();
            [n(0), n(1), n(2), n(3)]
        })
    });
    let box_px = num("box").unwrap_or(56);
    let class = prop("class").unwrap_or_default();
    rsx! { SafeAreaFrame { width, height, safe, box_px, class } }
}

/// The renderer for each registry item this crate implements a contract for. A contract whose
/// `.rs` claims `identity: "contract"` with no renderer here fails, so none goes unevaluated.
fn renderer(registry: &str) -> fn() -> Element {
    match registry {
        "alert" => alert_state,
        "badge" => badge_state,
        "button" => button_state,
        "card" => card_state,
        "input" => input_state,
        "label" => label_state,
        "markdown-renderer" => markdown_renderer_state,
        "safe-area-frame" => safe_area_frame_state,
        "skeleton" => skeleton_state,
        "status-badge" => status_badge_state,
        other => panic!(
            "contracts name `{other}.rs`, and tests/contracts_json.rs has no renderer for it: \
             add one, so its contract (and the CSP rule) is evaluated"
        ),
    }
}

fn render_state(registry: &str, state: &Value) -> Rendered {
    PROPS.with(|p| *p.borrow_mut() = state.clone());
    render(renderer(registry))
}

fn leak(s: &str) -> &'static str {
    Box::leak(s.to_owned().into_boxed_str())
}

// ─── Checks and density ─────────────────────────────────────────────────────────────────────

fn state_names(contract: &Value, which: Option<&str>) -> Vec<String> {
    let all: Vec<String> = contract["states"]
        .as_object()
        .unwrap()
        .keys()
        .cloned()
        .collect();
    match which {
        None => vec!["default".to_owned()],
        Some("*") => all,
        Some(s) => vec![s.to_owned()],
    }
}

fn run_check(name: &str, contract: &Value, case: &Case, check: &Value) {
    let say = check["say"].as_str().unwrap();
    let selector = check["select"].as_str().unwrap();
    for state in state_names(contract, check["state"].as_str()) {
        let root = case
            .state(&state)
            .unwrap_or_else(|e| panic!("{name}: check `{say}`: {e}"));
        let hits = select(root, selector).unwrap_or_else(|e| {
            panic!("{name}: check `{say}` cannot be evaluated (RFC-0006 FM-12): {e}")
        });
        if let Some(n) = check["count"].as_u64() {
            assert_eq!(hits.len() as u64, n, "{name} [{state}]: {say}");
        }
        if let Some(n) = check["min"].as_u64() {
            assert!(hits.len() as u64 >= n, "{name} [{state}]: {say}");
        }
        if check["absent"] == true {
            assert!(hits.is_empty(), "{name} [{state}]: {say}");
        }
        if let Some(attrs) = check["attr"].as_object() {
            assert!(
                !hits.is_empty(),
                "{name} [{state}]: {say} (nothing matched)"
            );
            for e in &hits {
                for (k, v) in attrs {
                    match v {
                        Value::String(s) => {
                            assert_eq!(e.attr(k), Some(s.as_str()), "{name} [{state}]: {say}")
                        }
                        Value::Bool(true) => {
                            assert!(e.attr(k).is_some(), "{name} [{state}]: {say}")
                        }
                        Value::Bool(false) => {
                            assert!(e.attr(k).is_none(), "{name} [{state}]: {say}")
                        }
                        other => panic!("{name}: check `{say}` has attr value {other}"),
                    }
                }
            }
        }
        if let Some(text) = check["text"].as_str() {
            assert!(
                !hits.is_empty(),
                "{name} [{state}]: {say} (nothing matched)"
            );
            for e in &hits {
                assert!(e.text().contains(text), "{name} [{state}]: {say}");
            }
        }
    }
}

/// The height a touch pointer gets: a `pointer-coarse:` height class, else the fine height.
fn coarse_height(classes: &str, fine: Option<u32>) -> Option<u32> {
    let coarse: String = classes
        .split_whitespace()
        .filter_map(|c| c.strip_prefix("pointer-coarse:"))
        .collect::<Vec<_>>()
        .join(" ");
    declared_height(&coarse).or(fine)
}

fn run_density(name: &str, case: &Case, row: &Value) {
    let part = row["part"].as_str().unwrap();
    let state = row["state"].as_str().unwrap_or("default");
    let root = case.state(state).unwrap();
    let hit = select(root, row["select"].as_str().unwrap())
        .unwrap_or_else(|e| panic!("{name}: density `{part}` cannot be evaluated: {e}"))
        .into_iter()
        .next()
        .unwrap_or_else(|| panic!("{name}: density `{part}` selects nothing"));
    let classes = hit.attr("class").unwrap_or("");
    let fine = declared_height(classes);
    assert_eq!(
        fine.map(u64::from),
        row["fine"].as_u64(),
        "{name}: density `{part}` (fine)"
    );
    assert_eq!(
        coarse_height(classes, fine).map(u64::from),
        row["coarse"].as_u64(),
        "{name}: density `{part}` (coarse)"
    );
}

// ─── The suite ──────────────────────────────────────────────────────────────────────────────

#[test]
fn every_contract_identity_rust_build_keeps_its_contract() {
    let contracts = contract_identity_contracts();
    assert!(
        !contracts.is_empty(),
        "no contract names a .rs with identity \"contract\""
    );
    for (name, c) in contracts {
        let registry = c["implementations"]["rs"]["registry"].as_str().unwrap();
        let states = c["states"]
            .as_object()
            .unwrap()
            .iter()
            .map(|(k, v)| (leak(k), render_state(registry, v)))
            .collect();
        let defaults = c["props"]
            .as_array()
            .unwrap()
            .iter()
            .filter_map(|p| Some((leak(p["name"].as_str()?), p["default"].as_str()?.to_owned())))
            .collect();
        let case = Case {
            name: leak(&name),
            contract: leak(c["contract"].as_str().unwrap()),
            states,
            defaults,
            columns: Vec::new(),
        };
        case.check();
        for check in c["checks"].as_array().unwrap() {
            run_check(&name, &c, &case, check);
        }
        for row in c["density"].as_array().unwrap() {
            run_density(&name, &case, row);
        }
    }
}

#[test]
fn every_rust_contract_const_is_the_contract_file() {
    for (name, c) in contract_identity_contracts() {
        let registry = c["implementations"]["rs"]["registry"].as_str().unwrap();
        let inline = mzizi_ui::CONTRACTS
            .iter()
            .find(|(n, _)| *n == registry)
            .map(|(_, text)| *text)
            .unwrap_or_else(|| panic!("{name}: mzizi_ui::CONTRACTS does not list `{registry}`"));
        assert_eq!(
            inline,
            c["contract"].as_str().unwrap(),
            "{name}: {registry}.rs's CONTRACT differs from its contract file — run `pnpm contracts:sync`"
        );
    }
}

// ─── The value predicates, against the TypeScript runner ───────────────────────────────────
//
// `__tests__/contracts/fixtures/predicates.json` is one table of predicates, malformed operands
// included, and the verdict both runners give each: `true`, `false` or `"unevaluable"` (an
// `Err` here). `__tests__/contracts/runner-grammar.test.ts` holds `contracts/runner.ts` to the
// same rows, so the Rust and TypeScript runners cannot disagree on one, and `not` never turns
// an unevaluable predicate into a pass in either.

fn verdict(r: &Result<bool, String>) -> Value {
    match r {
        Ok(b) => Value::Bool(*b),
        Err(_) => Value::String("unevaluable".into()),
    }
}

#[test]
fn every_predicate_case_gets_the_verdict_the_typescript_runner_gives() {
    let path = repo().join("__tests__/contracts/fixtures/predicates.json");
    let table: Value = serde_json::from_str(&fs::read_to_string(&path).unwrap()).unwrap();
    let cases = table["cases"].as_array().expect("a `cases` array");
    assert!(!cases.is_empty());
    for case in cases {
        let pred = case["pred"].as_str().unwrap();
        let value = case["value"].as_str().unwrap();
        let got = holds(value, &tokens(pred));
        assert_eq!(
            verdict(&got),
            case["verdict"],
            "`{pred}` on {value:?} gave {got:?}"
        );
        if got.is_err() && !pred.is_empty() && !pred.starts_with("not ") {
            assert!(
                holds(value, &tokens(&format!("not {pred}"))).is_err(),
                "`not {pred}` must stay unevaluable"
            );
        }
    }
}

/// A `when` clause with `not`, on a node parsed from fixed markup, so the test depends on no
/// component's classes.
#[test]
fn a_when_clause_with_not_holds_fails_or_cannot_be_evaluated() {
    let node = |html: &str| {
        let roots = parse(html);
        let root = roots.first().cloned().expect("one root");
        Rendered { root, roots }
    };
    let case = Case {
        name: "fixture",
        contract: "contract\n  slot is \"x\"\nend",
        states: vec![
            (
                "default",
                node(
                    r#"<span data-slot="x" class="rounded-full uppercase hover:line-through">x</span>"#,
                ),
            ),
            (
                "struck",
                node(r#"<span data-slot="x" class="rounded-full uppercase line-through">x</span>"#),
            ),
            ("bare", node(r#"<span data-slot="x">x</span>"#)),
        ],
        defaults: Vec::new(),
        columns: Vec::new(),
    };
    assert_eq!(
        case.evaluate(r#"when default class not has "line-through""#),
        Ok(true)
    );
    assert_eq!(
        case.evaluate(r#"when default class not contains "line-through""#),
        Ok(false)
    );
    assert_eq!(
        case.evaluate(r#"when struck class not has "line-through""#),
        Ok(false)
    );
    assert_eq!(
        case.evaluate(r#"when struck class has "uppercase""#),
        Ok(true)
    );
    // An attribute the root does not carry, or a malformed operand, is unevaluable with `not`
    // as without it.
    assert!(
        case.evaluate(r#"when bare class not contains "line-through""#)
            .is_err()
    );
    assert!(case.evaluate(r#"when default class not in foo"#).is_err());
    assert!(
        case.evaluate(r#"when default class not is "a" "b""#)
            .is_err()
    );
}

// ─── The CSP rule (#444) ────────────────────────────────────────────────────────────────────
//
// `Case::check` fails any rendered element with a `style` attribute, in every state, so every
// identity-`contract` build above is held to it. This holds the rest of the Rust builds a
// contract declares (identity `slot+variants`, as `badge`) in every state too, and proves the
// rule fails on each way Dioxus writes an inline style.

#[test]
fn every_rust_build_a_contract_declares_renders_no_inline_style() {
    let contracts = rust_contracts();
    assert!(
        contracts
            .iter()
            .any(|(_, c)| c["implementations"]["rs"]["identity"] != "contract")
    );
    for (name, c) in contracts {
        let registry = c["implementations"]["rs"]["registry"].as_str().unwrap();
        for (state, fixture) in c["states"].as_object().unwrap() {
            let found = inline_styles(&render_state(registry, fixture));
            assert!(
                found.is_empty(),
                "{name} ({registry}.rs) [{state}]: an inline style attribute (#444): {found:?}"
            );
        }
    }
}

/// `style: "…"`, as `MineralStrip` did before #444.
#[component]
fn StyleAttribute() -> Element {
    rsx! {
        div { "data-slot": "tinted-strip",
            span { style: "--tint: var(--primary)", "tint" }
            span { class: "text-foreground", "plain" }
        }
    }
}

/// A Dioxus CSS-property attribute, which `dioxus-ssr` merges into `style`.
#[component]
fn CssProperty() -> Element {
    rsx! {
        div { "data-slot": "tinted-strip",
            span { background_color: "var(--primary)", width: "6px", "tint" }
        }
    }
}

/// A clean first root and a styled second one: the rule reads every top-level node.
#[component]
fn SecondRoot() -> Element {
    rsx! {
        div { "data-slot": "tinted-strip", "first" }
        span { style: "--tint: var(--primary)", "second" }
    }
}

#[test]
fn the_inline_style_rule_fails_on_each_way_dioxus_writes_one() {
    assert_eq!(
        inline_styles(&render(|| rsx! { StyleAttribute {} })),
        vec![r#"<span> style="--tint: var(--primary)""#.to_owned()]
    );
    let property = inline_styles(&render(|| rsx! { CssProperty {} }));
    assert_eq!(property.len(), 1, "{property:?}");
    assert!(
        property[0].contains("background-color:var(--primary)")
            && property[0].contains("width:6px"),
        "{property:?}"
    );
    let second = render(|| rsx! { SecondRoot {} });
    assert!(second.root.attr("style").is_none());
    assert_eq!(
        inline_styles(&second),
        vec![r#"<span> style="--tint: var(--primary)""#.to_owned()]
    );
    let clean = render(|| rsx! { StatusBadge { status: StatusBadgeStatus::Beta } });
    assert!(inline_styles(&clean).is_empty());
}

#[test]
#[should_panic(
    expected = "an inline style attribute, which a strict Content-Security-Policy blocks"
)]
fn case_check_fails_a_component_that_renders_an_inline_style() {
    Case {
        name: "fixture-second-root",
        contract: "contract\n  slot is \"tinted-strip\"\nend",
        states: vec![("default", render(|| rsx! { SecondRoot {} }))],
        defaults: Vec::new(),
        columns: Vec::new(),
    }
    .check();
}
