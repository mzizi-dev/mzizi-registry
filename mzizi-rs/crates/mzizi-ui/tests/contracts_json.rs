//! The registry's contracts (`contracts/<family>/<name>.contract.json`), evaluated on the Rust
//! builds that implement them in full.
//!
//! One contract per component, whatever the language (owner, 2026-10-05; #427). For every
//! contract whose `.rs` implementation has `identity: "contract"` and lives in this crate, this
//! suite renders every state the contract declares with `dioxus-ssr` and evaluates, on the
//! markup, every clause (through the shared evaluator in `mzizi-rs/contract-eval/`), every check
//! and every density row. The `.astro` and `.tsx` are held to the same file by `__tests__/astro`
//! and `__tests__/contracts`. A clause, check or selector this suite cannot evaluate fails
//! (RFC-0006, FM-12).

use std::cell::RefCell;
use std::fs;
use std::path::PathBuf;

use dioxus::prelude::*;
use mzizi_ui::{StatusBadge, StatusBadgeStatus};
use serde_json::Value;

#[path = "../../../contract-eval/contract_eval.rs"]
mod contract_eval;
use contract_eval::{Case, Node, declared_height, render, select};

fn repo() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../../..")
}

/// Every contract file whose Rust build implements the whole contract.
fn contract_identity_contracts() -> Vec<(String, Value)> {
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
            if json["implementations"]["rs"]["identity"] == "contract" {
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

/// The renderer for each registry item this crate implements a contract for. A contract whose
/// `.rs` claims `identity: "contract"` with no renderer here fails, so none goes unevaluated.
fn renderer(registry: &str) -> fn() -> Element {
    match registry {
        "status-badge" => status_badge_state,
        other => panic!(
            "contracts name `{other}.rs` with identity \"contract\", and tests/contracts_json.rs has \
             no renderer for it: add one, so its contract is evaluated"
        ),
    }
}

fn render_state(registry: &str, state: &Value) -> Node {
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
