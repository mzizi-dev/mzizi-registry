//! Parity: the Dioxus-free `render(props) -> String` path against today's `dioxus-ssr` output.
//!
//! For every state the skeleton contract declares, and for a few cases the contract does not
//! declare (escaping edge cases), the two paths must produce the same bytes. This is the gate
//! that lets the Dioxus component be removed later without changing any markup.
//!
//! The oracle is `dioxus-ssr` rendering the Dioxus `Skeleton`, so this test is only as honest
//! as that path: it is the reference by definition, and it is removed together with the
//! Dioxus dependency, after the golden fixtures below have been captured from it.

use std::fs;
use std::path::PathBuf;

use dioxus::prelude::*;
use mzizi_ui::skeleton::{RenderProps, render};
use mzizi_ui::{StatusBadge, StatusBadgeStatus, status_badge};
use serde_json::Value;

/// The Dioxus build's output for one `class`.
fn dioxus_html(class: &str) -> String {
    let class = class.to_owned();
    dioxus_ssr::render_element(rsx! { mzizi_ui::Skeleton { class } })
}

/// Every `class` the contract declares, in state order.
fn contract_classes() -> Vec<(String, String)> {
    let path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("../../../contracts/ui/skeleton.contract.json");
    let json: Value = serde_json::from_str(&fs::read_to_string(&path).unwrap()).unwrap();
    json["states"]
        .as_object()
        .expect("states")
        .iter()
        .map(|(state, body)| {
            let class = body["props"]["class"].as_str().unwrap_or("").to_owned();
            (state.clone(), class)
        })
        .collect()
}

#[test]
fn every_contract_state_renders_byte_identically() {
    let states = contract_classes();
    assert!(
        !states.is_empty(),
        "the skeleton contract declares no states"
    );
    for (state, class) in states {
        let got = render(&RenderProps {
            class: class.clone(),
        });
        assert_eq!(
            got,
            dioxus_html(&class),
            "skeleton state `{state}` (class {class:?}) differs from dioxus-ssr"
        );
    }
}

#[test]
fn undeclared_cases_render_byte_identically() {
    // Not in the contract, so they are pinned here. The empty class checks that no stray
    // space is written; the last one checks the escaping table against dioxus-ssr, including
    // the quote characters an attribute value must never let through.
    for class in [
        "",
        "h-10 w-full",
        r#"w-[calc(100%-"x")] h-4"#,
        "a&b<c>d'e\"f",
        "h-4 bg-[url('x.png')]",
        "ünï · w-4",
    ] {
        assert_eq!(
            render(&RenderProps {
                class: class.to_owned()
            }),
            dioxus_html(class),
            "class {class:?} differs from dioxus-ssr"
        );
    }
}

#[test]
fn the_render_path_is_native_and_has_no_script() {
    // Static component: zero WASM, no script in the markup. Asserted on the output, since the
    // contract's `noJs` block says the same.
    let html = render(&RenderProps {
        class: "h-10 w-full".to_owned(),
    });
    assert!(!html.contains("<script"), "{html}");
    // The parity above is only meaningful if the oracle really writes markup. Pin its shape,
    // and its escaping, so an empty string on either side cannot pass.
    let oracle = dioxus_html("a\"b");
    assert!(
        oracle.starts_with("<div data-slot=\"skeleton\" data-portal="),
        "{oracle}"
    );
    assert!(
        oracle.contains("class=\"animate-pulse rounded-[var(--radius-xl,17px)] bg-muted a&#34;b\""),
        "{oracle}"
    );
    assert_eq!(html.matches("data-slot=\"skeleton\"").count(), 1);
}

// ── PR 1: the static primitives ─────────────────────────────────────────────────────────
//
// Each component below has a `render` path, and its cases pair that output with `dioxus-ssr`
// rendering the Dioxus component with the same props. A case is a state the component's
// contract declares (read from `contracts/ui/<name>.contract.json`, so none can be skipped) or
// an undeclared edge case. Those named `escaped-*` also pin the oracle: its output must hold the
// escaped probe, so the two cannot agree by both writing nothing.
//
// Goldens: `tests/goldens/<component>/<state>.html` are the `dioxus-ssr` output, captured once by
// the ignored `capture_goldens` test. After `dioxus` leaves this crate, `goldens_match_render`
// is the parity check that remains.

/// The probe every escaping case writes: the five escaped characters, then non-ASCII text.
const PROBE: &str = "a&b<c>d\"e'f ünï";
/// What `dioxus-ssr` and `render` both write for [`PROBE`].
const PROBE_ESCAPED: &str = "a&#38;b&#60;c&#62;d&#34;e&#39;f ünï";

/// One state of one component: the `render` output, and `dioxus-ssr`'s output for the same props.
struct Case {
    component: &'static str,
    state: String,
    render: String,
    dioxus: String,
}

fn case(component: &'static str, state: &str, render: String, dioxus: Element) -> Case {
    Case {
        component,
        state: state.to_owned(),
        render,
        dioxus: dioxus_ssr::render_element(dioxus),
    }
}

/// The `props` of every state a contract declares, in file order of its `states` object.
fn contract_states(name: &str) -> Vec<(String, Value)> {
    let path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join(format!("../../../contracts/ui/{name}.contract.json"));
    let json: Value = serde_json::from_str(&fs::read_to_string(&path).unwrap()).unwrap();
    json["states"]
        .as_object()
        .expect("states")
        .iter()
        .map(|(state, body)| (state.clone(), body["props"].clone()))
        .collect()
}
fn status_badge_cases() -> Vec<Case> {
    use status_badge::RenderProps;
    let mut out = Vec::new();
    for (state, props) in contract_states("status-badge") {
        let status = match props["status"].as_str().unwrap_or("stable") {
            "stable" => StatusBadgeStatus::Stable,
            "beta" => StatusBadgeStatus::Beta,
            "alpha" => StatusBadgeStatus::Alpha,
            "deprecated" => StatusBadgeStatus::Deprecated,
            other => panic!("status-badge contract names an unknown status {other:?}"),
        };
        out.push(case(
            "status-badge",
            &state,
            status_badge::render(&RenderProps {
                status,
                ..RenderProps::default()
            }),
            rsx! { StatusBadge { status: status } },
        ));
    }
    let label = PROBE.to_owned();
    out.push(case(
        "status-badge",
        "escaped-label",
        status_badge::render(&RenderProps {
            status: StatusBadgeStatus::Beta,
            label: Some(label.clone()),
            ..RenderProps::default()
        }),
        rsx! { StatusBadge { status: StatusBadgeStatus::Beta, "{label}" } },
    ));
    out.push(case(
        "status-badge",
        "empty-label",
        status_badge::render(&RenderProps {
            label: Some(String::new()),
            ..RenderProps::default()
        }),
        rsx! { StatusBadge { "" } },
    ));
    out.push(case(
        "status-badge",
        "escaped-class",
        status_badge::render(&RenderProps {
            class: PROBE.to_owned(),
            ..RenderProps::default()
        }),
        rsx! { StatusBadge { class: PROBE.to_owned() } },
    ));
    out
}
/// Every case of every PR 1 component.
fn static_cases() -> Vec<Case> {
    status_badge_cases()
}

/// The committed golden for one case.
fn golden_path(case: &Case) -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("tests/goldens")
        .join(case.component)
        .join(format!("{}.html", case.state))
}

#[test]
fn every_static_state_renders_byte_identically_to_dioxus_ssr() {
    let cases = static_cases();
    // The seven status-badge states. The other components moved to mzizi-roots.
    assert_eq!(
        cases.len(),
        7,
        "the case count moved; update the pin and the goldens"
    );
    for c in cases {
        let slot = format!("data-slot=\"{}\"", c.component);
        assert!(
            c.dioxus.starts_with('<') && c.dioxus.contains(&slot),
            "{}/{}: the oracle wrote no {slot}: {}",
            c.component,
            c.state,
            c.dioxus
        );
        if c.state.starts_with("escaped") {
            assert!(
                c.dioxus.contains(PROBE_ESCAPED),
                "{}/{}: the oracle did not escape the probe: {}",
                c.component,
                c.state,
                c.dioxus
            );
        }
        assert_eq!(
            c.render, c.dioxus,
            "{}/{} differs from dioxus-ssr",
            c.component, c.state
        );
    }
}

#[test]
fn every_contract_state_of_the_static_components_is_covered() {
    // The contract states are read by `static_cases`; this pins that each one produced a case.
    let cases = static_cases();
    for (name, component) in [("status-badge", "status-badge")] {
        for (state, _) in contract_states(name) {
            assert!(
                cases
                    .iter()
                    .any(|c| c.component == component && c.state == state),
                "{name} declares state `{state}` with no parity case"
            );
        }
    }
}

#[test]
fn goldens_match_dioxus_ssr_and_render() {
    for c in static_cases() {
        let path = golden_path(&c);
        let golden = fs::read_to_string(&path).unwrap_or_else(|e| {
            panic!(
                "missing golden {}: {e}. Capture with `cargo test -p mzizi-ui --test render_parity -- --ignored capture_goldens`",
                path.display()
            )
        });
        assert_eq!(
            golden,
            c.dioxus,
            "golden {} differs from dioxus-ssr",
            path.display()
        );
        assert_eq!(
            golden,
            c.render,
            "golden {} differs from render",
            path.display()
        );
    }
}

/// Writes `tests/goldens/` from `dioxus-ssr`. Run once, before `dioxus` is removed:
/// `cargo test -p mzizi-ui --test render_parity -- --ignored capture_goldens`.
#[test]
#[ignore = "captures the goldens from dioxus-ssr; run once, before dioxus is removed"]
fn capture_goldens() {
    for c in static_cases() {
        let path = golden_path(&c);
        fs::create_dir_all(path.parent().expect("parent")).expect("create golden dir");
        fs::write(&path, &c.dioxus).expect("write golden");
    }
}

// ── PR 1, batch B: alert, card and markdown-renderer ────────────────────────────────────
//
// Their children are HTML the caller has rendered, so a case builds the same children on both
// sides: the render path's `render_*` part functions, and the Dioxus parts. The text a part
// holds is written escaped on the render side and by Dioxus on the other, and is pinned like
// every other `escaped-*` case.
