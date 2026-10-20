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
use mzizi_ui::{
    Alert, AlertAction, AlertDescription, AlertTitle, AlertVariant, Badge, BadgeVariant, Card,
    CardContent, CardFooter, CardHeader, CardTitle, Chart, MarkdownLinks, MarkdownRenderer,
    MarkdownSource, Progress, SafeAreaFrame, Separator, SeparatorOrientation, StatusBadge,
    StatusBadgeStatus, alert, badge, card, chart, markdown_renderer, progress, safe_area_frame,
    separator, status_badge,
};
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

fn separator_cases() -> Vec<Case> {
    use separator::RenderProps;
    let vertical = SeparatorOrientation::Vertical;
    vec![
        case(
            "separator",
            "default",
            separator::render(&RenderProps::default()),
            rsx! { Separator {} },
        ),
        case(
            "separator",
            "vertical",
            separator::render(&RenderProps {
                orientation: vertical,
                ..RenderProps::default()
            }),
            rsx! { Separator { orientation: vertical } },
        ),
        case(
            "separator",
            "semantic",
            separator::render(&RenderProps {
                decorative: false,
                ..RenderProps::default()
            }),
            rsx! { Separator { decorative: false } },
        ),
        case(
            "separator",
            "semantic-vertical",
            separator::render(&RenderProps {
                orientation: vertical,
                decorative: false,
                ..RenderProps::default()
            }),
            rsx! { Separator { orientation: vertical, decorative: false } },
        ),
        case(
            "separator",
            "escaped-class",
            separator::render(&RenderProps {
                class: PROBE.to_owned(),
                ..RenderProps::default()
            }),
            rsx! { Separator { class: PROBE.to_owned() } },
        ),
    ]
}

fn progress_cases() -> Vec<Case> {
    use progress::RenderProps;
    vec![
        case(
            "progress",
            "indeterminate",
            progress::render(&RenderProps::default()),
            rsx! { Progress {} },
        ),
        case(
            "progress",
            "empty",
            progress::render(&RenderProps {
                value: Some(0),
                ..RenderProps::default()
            }),
            rsx! { Progress { value: Some(0) } },
        ),
        case(
            "progress",
            "loading",
            progress::render(&RenderProps {
                value: Some(40),
                ..RenderProps::default()
            }),
            rsx! { Progress { value: Some(40) } },
        ),
        case(
            "progress",
            "complete",
            progress::render(&RenderProps {
                value: Some(100),
                ..RenderProps::default()
            }),
            rsx! { Progress { value: Some(100) } },
        ),
        case(
            "progress",
            "over-max",
            progress::render(&RenderProps {
                value: Some(150),
                ..RenderProps::default()
            }),
            rsx! { Progress { value: Some(150) } },
        ),
        case(
            "progress",
            "custom-max",
            progress::render(&RenderProps {
                value: Some(3),
                max: 4,
                ..RenderProps::default()
            }),
            rsx! { Progress { value: Some(3), max: 4 } },
        ),
        case(
            "progress",
            "escaped-class",
            progress::render(&RenderProps {
                value: Some(10),
                class: PROBE.to_owned(),
                ..RenderProps::default()
            }),
            rsx! { Progress { value: Some(10), class: PROBE.to_owned() } },
        ),
    ]
}

fn badge_cases() -> Vec<Case> {
    use badge::RenderProps;
    let variants = [
        ("default", BadgeVariant::Default),
        ("secondary", BadgeVariant::Secondary),
        ("destructive", BadgeVariant::Destructive),
        ("outline", BadgeVariant::Outline),
        ("ghost", BadgeVariant::Ghost),
        ("link", BadgeVariant::Link),
    ];
    let mut out: Vec<Case> = variants
        .into_iter()
        .map(|(state, variant)| {
            case(
                "badge",
                state,
                badge::render(&RenderProps {
                    variant,
                    text: "New".to_owned(),
                    ..RenderProps::default()
                }),
                rsx! { Badge { variant: variant, "New" } },
            )
        })
        .collect();
    let text = PROBE.to_owned();
    out.push(case(
        "badge",
        "escaped-text",
        badge::render(&RenderProps {
            text: text.clone(),
            ..RenderProps::default()
        }),
        rsx! { Badge { "{text}" } },
    ));
    out.push(case(
        "badge",
        "escaped-class",
        badge::render(&RenderProps {
            class: PROBE.to_owned(),
            text: "New".to_owned(),
            ..RenderProps::default()
        }),
        rsx! { Badge { class: PROBE.to_owned(), "New" } },
    ));
    out.push(case(
        "badge",
        "empty-text",
        badge::render(&RenderProps::default()),
        rsx! { Badge { "" } },
    ));
    out
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

/// A safe-area frame case, with the props written into both paths from the same values.
fn safe_area_case(
    state: &str,
    width: u32,
    height: u32,
    safe: [u32; 4],
    box_px: u32,
    class: &str,
) -> Case {
    let render = safe_area_frame::render(&safe_area_frame::RenderProps {
        width,
        height,
        safe,
        box_px,
        class: class.to_owned(),
    });
    let class = class.to_owned();
    case(
        "safe-area-frame",
        state,
        render,
        rsx! { SafeAreaFrame { width: width, height: height, safe: safe, box_px: box_px, class: class } },
    )
}

fn safe_area_cases() -> Vec<Case> {
    let mut out = Vec::new();
    for (state, props) in contract_states("safe-area-frame") {
        let num = |key: &str, default: u64| {
            u32::try_from(props[key].as_u64().unwrap_or(default)).expect("u32")
        };
        let mut safe = [0u32; 4];
        if let Some(insets) = props["safe"].as_array() {
            for (slot, value) in safe.iter_mut().zip(insets) {
                *slot = u32::try_from(value.as_u64().expect("inset")).expect("u32");
            }
        }
        out.push(safe_area_case(
            &state,
            num("width", 0),
            num("height", 0),
            safe,
            num("box", 56),
            props["class"].as_str().unwrap_or(""),
        ));
    }
    out.push(safe_area_case("zero-inset", 1080, 1920, [0; 4], 56, ""));
    // A canvas smaller than the 6px floor: both paths clamp the drawn size the same way.
    out.push(safe_area_case("tiny-canvas", 1, 1, [0; 4], 1, ""));
    out.push(safe_area_case(
        "escaped-class",
        1080,
        1920,
        [10, 20, 30, 40],
        56,
        PROBE,
    ));
    out
}

fn chart_cases() -> Vec<Case> {
    use chart::RenderProps;
    let id = PROBE.to_owned();
    vec![
        case(
            "chart",
            "loading",
            chart::render(&RenderProps {
                loading: true,
                id: "main".to_owned(),
                ..RenderProps::default()
            }),
            rsx! { Chart { loading: true, id: "main".to_owned() } },
        ),
        case(
            "chart",
            "container",
            chart::render(&RenderProps {
                id: "main".to_owned(),
                children: "<span>x</span>".to_owned(),
                ..RenderProps::default()
            }),
            rsx! { Chart { id: "main".to_owned(), span { "x" } } },
        ),
        case(
            "chart",
            "empty",
            chart::render(&RenderProps {
                id: "empty".to_owned(),
                ..RenderProps::default()
            }),
            rsx! { Chart { id: "empty".to_owned() } },
        ),
        case(
            "chart",
            "escaped-id",
            chart::render(&RenderProps {
                id: id.clone(),
                ..RenderProps::default()
            }),
            rsx! { Chart { id: id.clone() } },
        ),
        case(
            "chart",
            "escaped-class",
            chart::render(&RenderProps {
                id: "main".to_owned(),
                class: PROBE.to_owned(),
                ..RenderProps::default()
            }),
            rsx! { Chart { id: "main".to_owned(), class: PROBE.to_owned() } },
        ),
        case(
            "chart",
            "escaped-loading-class",
            chart::render(&RenderProps {
                loading: true,
                id: "main".to_owned(),
                class: PROBE.to_owned(),
                ..RenderProps::default()
            }),
            rsx! { Chart { loading: true, id: "main".to_owned(), class: PROBE.to_owned() } },
        ),
    ]
}

/// Every case of every PR 1 component.
fn static_cases() -> Vec<Case> {
    let mut all = Vec::new();
    all.extend(separator_cases());
    all.extend(progress_cases());
    all.extend(badge_cases());
    all.extend(status_badge_cases());
    all.extend(safe_area_cases());
    all.extend(chart_cases());
    all.extend(batch_b_cases());
    all
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
    // 5 separator + 7 progress + 9 badge + 7 status-badge + 6 safe-area-frame + 6 chart
    // + 7 alert + 8 card + 15 markdown-renderer.
    assert_eq!(
        cases.len(),
        70,
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
    for (name, component) in [
        ("status-badge", "status-badge"),
        ("safe-area-frame", "safe-area-frame"),
    ] {
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

/// The `default` slot text of a contract state, as the contract writes it.
fn contract_slot_text(name: &str, state: &str) -> String {
    let path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join(format!("../../../contracts/ui/{name}.contract.json"));
    let json: Value = serde_json::from_str(&fs::read_to_string(&path).unwrap()).unwrap();
    json["states"][state]["slots"]["default"]
        .as_str()
        .unwrap_or_default()
        .to_owned()
}

fn alert_variant(name: &str) -> AlertVariant {
    match name {
        "default" => AlertVariant::Default,
        "destructive" => AlertVariant::Destructive,
        other => panic!("alert contract names an unknown variant {other:?}"),
    }
}

fn alert_cases() -> Vec<Case> {
    use alert::{PartProps, RenderProps};
    let mut out = Vec::new();
    for (state, props) in contract_states("alert") {
        let variant = alert_variant(props["variant"].as_str().unwrap_or("default"));
        let text = contract_slot_text("alert", &state);
        out.push(case(
            "alert",
            &state,
            alert::render(&RenderProps {
                variant,
                children: alert::render_title(&PartProps {
                    children: text.clone(),
                    ..PartProps::default()
                }),
                ..RenderProps::default()
            }),
            rsx! { Alert { variant: variant, AlertTitle { "{text}" } } },
        ));
    }
    let title = |class: &str, text: &str| PartProps {
        class: class.to_owned(),
        children: text.to_owned(),
    };
    out.push(case(
        "alert",
        "parts-with-classes",
        alert::render(&RenderProps {
            children: [
                alert::render_title(&title("x-title", "T")),
                alert::render_description(&title("x-desc", "D")),
                alert::render_action(&title("x-action", "A")),
            ]
            .concat(),
            ..RenderProps::default()
        }),
        rsx! {
            Alert {
                AlertTitle { class: "x-title".to_owned(), "T" }
                AlertDescription { class: "x-desc".to_owned(), "D" }
                AlertAction { class: "x-action".to_owned(), "A" }
            }
        },
    ));
    out.push(case(
        "alert",
        "escaped-title",
        alert::render(&RenderProps {
            children: alert::render_title(&PartProps {
                children: PROBE_ESCAPED.to_owned(),
                ..PartProps::default()
            }),
            ..RenderProps::default()
        }),
        rsx! { Alert { AlertTitle { "{PROBE}" } } },
    ));
    out.push(case(
        "alert",
        "escaped-class",
        alert::render(&RenderProps {
            class: PROBE.to_owned(),
            children: alert::render_title(&title("", "T")),
            ..RenderProps::default()
        }),
        rsx! { Alert { class: PROBE.to_owned(), AlertTitle { "T" } } },
    ));
    out.push(case(
        "alert",
        "escaped-part-class",
        alert::render(&RenderProps {
            children: alert::render_description(&title(PROBE, "D")),
            ..RenderProps::default()
        }),
        rsx! { Alert { AlertDescription { class: PROBE.to_owned(), "D" } } },
    ));
    out.push(case(
        "alert",
        "empty-description",
        alert::render(&RenderProps {
            children: alert::render_description(&title("", "")),
            ..RenderProps::default()
        }),
        rsx! { Alert { AlertDescription { "" } } },
    ));
    out
}

fn card_cases() -> Vec<Case> {
    use card::{CardSize, RenderProps, SlotProps};
    let slot = |text: &str| SlotProps {
        children: text.to_owned(),
        ..SlotProps::default()
    };
    let mut out = Vec::new();
    for (state, props) in contract_states("card") {
        let size = match props["size"].as_str().unwrap_or("default") {
            "default" => CardSize::Default,
            "sm" => CardSize::Sm,
            other => panic!("card contract names an unknown size {other:?}"),
        };
        let loading = props["loading"].as_bool().unwrap_or(false);
        let text = contract_slot_text("card", &state);
        out.push(case(
            "card",
            &state,
            card::render(&RenderProps {
                size,
                loading,
                children: text.clone(),
                ..RenderProps::default()
            }),
            rsx! { Card { size: size, loading: loading, "{text}" } },
        ));
    }
    out.push(case(
        "card",
        "loading-sm",
        card::render(&RenderProps {
            size: CardSize::Sm,
            loading: true,
            class: "x-loading".to_owned(),
            ..RenderProps::default()
        }),
        rsx! { Card { size: CardSize::Sm, loading: true, class: "x-loading".to_owned() } },
    ));
    let header = [
        card::render_title(&slot("T")),
        card::render_description(&slot("D")),
        card::render_action(&slot("A")),
    ]
    .concat();
    out.push(case(
        "card",
        "composed",
        card::render(&RenderProps {
            children: [
                card::render_header(&slot(&header)),
                card::render_content(&slot("C")),
                card::render_footer(&slot("F")),
            ]
            .concat(),
            ..RenderProps::default()
        }),
        rsx! {
            Card {
                CardHeader {
                    CardTitle { "T" }
                    card::CardDescription { "D" }
                    card::CardAction { "A" }
                }
                CardContent { "C" }
                CardFooter { "F" }
            }
        },
    ));
    out.push(case(
        "card",
        "escaped-title",
        card::render(&RenderProps {
            children: card::render_title(&slot(PROBE_ESCAPED)),
            ..RenderProps::default()
        }),
        rsx! { Card { CardTitle { "{PROBE}" } } },
    ));
    out.push(case(
        "card",
        "escaped-class",
        card::render(&RenderProps {
            class: PROBE.to_owned(),
            children: card::render_content(&slot("C")),
            ..RenderProps::default()
        }),
        rsx! { Card { class: PROBE.to_owned(), CardContent { "C" } } },
    ));
    out.push(case(
        "card",
        "empty-content",
        card::render(&RenderProps {
            children: card::render_content(&slot("")),
            ..RenderProps::default()
        }),
        rsx! { Card { CardContent { "" } } },
    ));
    out
}

/// The `links` and `from` names a contract writes, as the enums.
fn markdown_links(name: &str) -> MarkdownLinks {
    match name {
        "safe" => MarkdownLinks::Safe,
        "https" => MarkdownLinks::Https,
        other => panic!("markdown contract names an unknown link policy {other:?}"),
    }
}

fn markdown_source(name: &str) -> MarkdownSource {
    match name {
        "markdown" => MarkdownSource::Markdown,
        "html" => MarkdownSource::Html,
        "auto" => MarkdownSource::Auto,
        other => panic!("markdown contract names an unknown source {other:?}"),
    }
}

/// One Markdown case: the same content, policy and heading base for both paths.
fn markdown_case(
    state: &str,
    content: &str,
    links: MarkdownLinks,
    from: MarkdownSource,
    heading_base: u8,
    class: &str,
) -> Case {
    let render = markdown_renderer::render(&markdown_renderer::RenderProps {
        content: content.to_owned(),
        links,
        from,
        heading_base,
        class: class.to_owned(),
    });
    let (content, class) = (content.to_owned(), class.to_owned());
    case(
        "markdown-renderer",
        state,
        render,
        rsx! {
            MarkdownRenderer {
                content: content,
                links: links,
                from: from,
                heading_base: heading_base,
                class: class,
            }
        },
    )
}

fn markdown_cases() -> Vec<Case> {
    let mut out = Vec::new();
    for (state, props) in contract_states("markdown-renderer") {
        out.push(markdown_case(
            &state,
            props["content"].as_str().unwrap_or(""),
            markdown_links(props["links"].as_str().unwrap_or("safe")),
            markdown_source(props["from"].as_str().unwrap_or("markdown")),
            u8::try_from(props["headingBase"].as_u64().unwrap_or(1)).expect("heading base"),
            props["class"].as_str().unwrap_or(""),
        ));
    }
    let md = MarkdownSource::Markdown;
    let safe = MarkdownLinks::Safe;
    out.push(markdown_case(
        "code-language",
        "```rust\nfn main() {}\n```",
        safe,
        md,
        1,
        "",
    ));
    out.push(markdown_case(
        "ordered-start",
        "4. four\n5. five",
        safe,
        md,
        1,
        "",
    ));
    out.push(markdown_case(
        "table-alignment",
        "| a | b | c |\n| :-- | :-: | --: |\n| 1 | 2 | 3 |",
        safe,
        md,
        1,
        "",
    ));
    out.push(markdown_case(
        "all-headings",
        "# 1\n\n## 2\n\n### 3\n\n#### 4\n\n##### 5\n\n###### 6",
        safe,
        md,
        1,
        "",
    ));
    out.push(markdown_case(
        "nested-quote-rule-break",
        "> outer\n>\n> > inner\n\na  \nb\n\n---",
        safe,
        md,
        1,
        "",
    ));
    out.push(markdown_case(
        "href-query",
        "[x](https://example.org/?a=1&b=2)",
        safe,
        md,
        1,
        "",
    ));
    out.push(markdown_case("escaped-text", PROBE, safe, md, 1, ""));
    out.push(markdown_case(
        "escaped-code",
        &format!("```\n{PROBE}\n```"),
        safe,
        md,
        1,
        "",
    ));
    out.push(markdown_case("escaped-class", "x", safe, md, 1, PROBE));
    out
}

/// Every case of batch B.
fn batch_b_cases() -> Vec<Case> {
    let mut all = Vec::new();
    all.extend(alert_cases());
    all.extend(card_cases());
    all.extend(markdown_cases());
    all
}
