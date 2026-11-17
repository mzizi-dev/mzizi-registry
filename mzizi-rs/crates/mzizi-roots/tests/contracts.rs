//! The registry's contracts, evaluated on the Mzizi Roots builds in `mzizi_roots::components`.
//!
//! Every contract that declares a `.rs` build whose file is in `mzizi-roots` (listed in
//! `mzizi-rs/crate-for-file.json`) is evaluated here, with the shared evaluator in
//! `mzizi-rs/contract-eval/`. Each state the contract declares is rendered with `render`, then
//! every clause, check and the CSP rule is held to the markup.
//!
//! One rule differs from the styled builds, and it is the owner's (#708): a Roots build carries no
//! class names, so a clause or check that asserts a class cannot hold here. Those are dropped
//! before evaluation: a `class contains` clause, and a check whose selector names a class. The
//! styled builds (`.tsx`, `.astro`) keep them in the same contract file. The rule that replaces
//! them is `components::no_default_build_writes_a_class_attribute`, in `tests/components.rs`.
//! Density rows measure class-declared sizes, so they are not evaluated here either.
//!
//! A clause this suite cannot evaluate fails (RFC-0006, FM-12).

use std::cell::RefCell;
use std::fs;
use std::path::PathBuf;

use mzizi_roots::components::{alert, badge, card, markdown_renderer, safe_area_frame};
use mzizi_roots::node::Node;
use serde_json::Value;

#[path = "../../../contract-eval/contract_eval.rs"]
mod contract_eval;
use contract_eval::{Case, Rendered, select};

fn repo() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../../..")
}

thread_local! {
    static STATE: RefCell<Value> = const { RefCell::new(Value::Null) };
}

fn prop(name: &str) -> Option<String> {
    STATE.with(|s| s.borrow()["props"][name].as_str().map(str::to_owned))
}

fn flag(name: &str) -> bool {
    STATE.with(|s| s.borrow()["props"][name] == true)
}

fn class() -> String {
    prop("class").unwrap_or_default()
}

/// The text of a state's default slot, as the single child a Roots build takes. Empty means none.
fn slot_children() -> Vec<Node> {
    let text = STATE.with(|s| {
        s.borrow()["slots"]["default"]
            .as_str()
            .unwrap_or("")
            .to_owned()
    });
    if text.is_empty() {
        Vec::new()
    } else {
        vec![Node::text(text)]
    }
}

/// The registry builds this suite renders, matched by [`render_state`].
const RENDERED: &[&str] = &[
    "alert",
    "badge",
    "card",
    "markdown-renderer",
    "safe-area-frame",
];

/// Render one state of a registry build from its contract props and slots.
fn render_state(registry: &str) -> String {
    match registry {
        "alert" => alert::render(&alert::RenderProps {
            variant: match prop("variant").as_deref() {
                Some("destructive") => alert::AlertVariant::Destructive,
                _ => alert::AlertVariant::Default,
            },
            class: class(),
            children: slot_children(),
        }),
        "badge" => badge::render(&badge::RenderProps {
            variant: match prop("variant").as_deref() {
                Some("destructive") => badge::BadgeVariant::Destructive,
                _ => badge::BadgeVariant::Default,
            },
            class: class(),
            text: STATE.with(|s| {
                s.borrow()["slots"]["default"]
                    .as_str()
                    .unwrap_or("")
                    .to_owned()
            }),
        }),
        "card" => card::render(&card::RenderProps {
            size: match prop("size").as_deref() {
                Some("sm") => card::CardSize::Sm,
                _ => card::CardSize::Default,
            },
            loading: flag("loading"),
            class: class(),
            children: slot_children(),
        }),
        "markdown-renderer" => {
            let heading_base = STATE.with(|s| s.borrow()["props"]["headingBase"].as_u64());
            markdown_renderer::render(&markdown_renderer::RenderProps {
                content: prop("content").expect("markdown-renderer: content"),
                links: match prop("links").as_deref() {
                    Some("https") => markdown_renderer::MarkdownLinks::Https,
                    _ => markdown_renderer::MarkdownLinks::Safe,
                },
                from: match prop("from").as_deref() {
                    Some("html") => markdown_renderer::MarkdownSource::Html,
                    Some("auto") => markdown_renderer::MarkdownSource::Auto,
                    _ => markdown_renderer::MarkdownSource::Markdown,
                },
                heading_base: heading_base
                    .map_or(1, |n| u8::try_from(n).expect("headingBase fits u8")),
                class: class(),
            })
        }
        "safe-area-frame" => {
            let num = |name: &str| {
                STATE
                    .with(|s| s.borrow()["props"][name].as_u64())
                    .map(|n| u32::try_from(n).unwrap())
            };
            let safe = STATE.with(|s| {
                s.borrow()["props"]["safe"].as_array().map_or([0; 4], |a| {
                    let n = |i: usize| u32::try_from(a[i].as_u64().unwrap()).unwrap();
                    [n(0), n(1), n(2), n(3)]
                })
            });
            safe_area_frame::render(&safe_area_frame::RenderProps {
                width: num("width").expect("safe-area-frame: width"),
                height: num("height").expect("safe-area-frame: height"),
                safe,
                box_px: num("box").unwrap_or(56),
                class: class(),
            })
        }
        other => panic!("no Roots renderer for `{other}.rs`"),
    }
}

fn leak(s: &str) -> &'static str {
    Box::leak(s.to_owned().into_boxed_str())
}

/// The contract text with its class clauses removed: `class contains …` on a `when` or a bare line.
fn unstyled(contract: &str) -> String {
    contract
        .lines()
        .filter(|line| !line.contains("class contains"))
        .collect::<Vec<_>>()
        .join("\n")
}

/// Whether a selector names a class, outside its quoted values (`a[href="https://x.y"]` does not).
fn names_a_class(selector: &str) -> bool {
    let mut unquoted = String::new();
    let mut quoted = false;
    for c in selector.chars() {
        match c {
            '"' => quoted = !quoted,
            _ if !quoted => unquoted.push(c),
            _ => {}
        }
    }
    unquoted.contains('.')
}

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
    if names_a_class(selector) {
        return;
    }
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

/// The Roots builds: the `.rs` files `mzizi-rs/crate-for-file.json` places in `mzizi-roots`.
fn roots_registry_names() -> Vec<String> {
    let map: Value = serde_json::from_str(
        &fs::read_to_string(repo().join("mzizi-rs/crate-for-file.json")).unwrap(),
    )
    .unwrap();
    map.as_object()
        .unwrap()
        .iter()
        .filter(|(_, krate)| krate.as_str() == Some("mzizi-roots"))
        .map(|(path, _)| {
            path.rsplit('/')
                .next()
                .unwrap()
                .trim_end_matches(".rs")
                .to_owned()
        })
        .collect()
}

/// Every contract file (`contracts/<family>/<name>.contract.json`).
fn contract_files() -> Vec<Value> {
    let mut out = Vec::new();
    for family in fs::read_dir(repo().join("contracts"))
        .unwrap()
        .filter_map(Result::ok)
    {
        if !family.path().is_dir() || family.file_name() == "schema" {
            continue;
        }
        for f in fs::read_dir(family.path()).unwrap().filter_map(Result::ok) {
            if f.file_name().to_string_lossy().ends_with(".contract.json") {
                out.push(serde_json::from_str(&fs::read_to_string(f.path()).unwrap()).unwrap());
            }
        }
    }
    out
}

/// Every contract that declares a Roots build, with its registry name.
fn roots_contracts() -> Vec<(String, Value)> {
    let roots = roots_registry_names();
    contract_files()
        .into_iter()
        .filter_map(|c| {
            let registry = c["implementations"]["rs"]["registry"].as_str()?.to_owned();
            roots
                .contains(&registry)
                .then(|| (c["name"].as_str().unwrap().to_owned(), c))
        })
        .collect()
}

#[test]
fn every_roots_build_a_contract_declares_has_a_renderer_and_a_contract() {
    let found = roots_contracts();
    assert!(
        found.len() >= 5,
        "expected the five contracts with Roots builds, found {}",
        found.len()
    );
    for (name, c) in &found {
        let registry = c["implementations"]["rs"]["registry"].as_str().unwrap();
        // A declared build with no renderer here would be skipped silently, so it must be listed.
        assert!(
            RENDERED.contains(&registry),
            "{name}: `{registry}.rs` has no Roots renderer"
        );
        assert!(
            !c["states"].as_object().unwrap().is_empty(),
            "{name} declares no states"
        );
    }
}

#[test]
fn every_roots_build_keeps_its_contract_in_every_state() {
    for (name, c) in roots_contracts() {
        let registry = c["implementations"]["rs"]["registry"]
            .as_str()
            .unwrap()
            .to_owned();
        let states = c["states"]
            .as_object()
            .unwrap()
            .iter()
            .map(|(state, body)| {
                STATE.with(|s| *s.borrow_mut() = body.clone());
                (leak(state), Rendered::from_html(&render_state(&registry)))
            })
            .collect();
        let case = Case {
            name: leak(&name),
            contract: leak(&unstyled(c["contract"].as_str().unwrap())),
            states,
            defaults: Vec::new(),
            columns: Vec::new(),
            allowed_styles: &[],
        };
        case.check();
        for check in c["checks"].as_array().unwrap() {
            run_check(&name, &c, &case, check);
        }
    }
}
