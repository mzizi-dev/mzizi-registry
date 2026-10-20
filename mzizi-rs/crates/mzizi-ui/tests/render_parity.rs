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
