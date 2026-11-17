//! The Mzizi Roots components' markup: goldens, and the rule that an unstyled build writes no class.
//!
//! Each case renders one state of one component with `render`. The output is compared with
//! `tests/goldens/<component>/<state>.html`. Set `UPDATE_GOLDENS=1` to write the goldens from the
//! current output; review the diff before committing. A case whose class is a pass-through
//! (`passthrough`) may write `class`; every other case must not, because a component never sets a
//! class of its own (#708).

use std::fs;
use std::path::PathBuf;

use mzizi_roots::components::{
    alert, badge, card, chart, markdown_renderer, progress, safe_area_frame, separator,
};
use mzizi_roots::node::Node;

/// The probe every escaping case writes: the five escaped characters, then non-ASCII text.
const PROBE: &str = "a&b<c>d\"e'f ünï";

/// The escaped form of [`PROBE`], which the runtime writes.
const PROBE_ESCAPED: &str = "a&#38;b&#60;c&#62;d&#34;e&#39;f ünï";

/// One rendered state.
struct Case {
    component: &'static str,
    state: &'static str,
    html: String,
    /// Whether the state passes a class through on purpose, so `class` may appear.
    passthrough: bool,
}

fn case(component: &'static str, state: &'static str, html: String) -> Case {
    Case {
        component,
        state,
        html,
        passthrough: state.starts_with("escaped") || state == "plain",
    }
}

fn text(s: &str) -> Vec<Node> {
    vec![Node::text(s)]
}

fn alert_cases() -> Vec<Case> {
    let title = |s: &str| alert::PartProps {
        class: String::new(),
        children: text(s),
    };
    let base = |variant, class: &str, children| alert::RenderProps {
        variant,
        class: class.to_owned(),
        children,
    };
    vec![
        case(
            "alert",
            "default",
            alert::render(&base(
                alert::AlertVariant::Default,
                "",
                vec![
                    alert::render_title(&title("Heads up")),
                    alert::render_description(&title("Saved.")),
                ],
            )),
        ),
        case(
            "alert",
            "destructive",
            alert::render(&base(
                alert::AlertVariant::Destructive,
                "",
                vec![alert::render_title(&title("Failed"))],
            )),
        ),
        case(
            "alert",
            "escaped-title",
            alert::render(&base(
                alert::AlertVariant::Default,
                "",
                vec![alert::render_title(&title(PROBE))],
            )),
        ),
        case(
            "alert",
            "escaped-class",
            alert::render(&base(alert::AlertVariant::Default, PROBE, vec![])),
        ),
        case(
            "alert",
            "empty",
            alert::render(&base(alert::AlertVariant::Default, "", vec![])),
        ),
    ]
}

fn badge_cases() -> Vec<Case> {
    let b = |variant, class: &str, text: &str| {
        badge::render(&badge::RenderProps {
            variant,
            class: class.to_owned(),
            text: text.to_owned(),
        })
    };
    vec![
        case(
            "badge",
            "default",
            b(badge::BadgeVariant::Default, "", "New"),
        ),
        case(
            "badge",
            "secondary",
            b(badge::BadgeVariant::Secondary, "", "New"),
        ),
        case(
            "badge",
            "destructive",
            b(badge::BadgeVariant::Destructive, "", "Revoked"),
        ),
        case(
            "badge",
            "outline",
            b(badge::BadgeVariant::Outline, "", "Draft"),
        ),
        case("badge", "ghost", b(badge::BadgeVariant::Ghost, "", "Draft")),
        case("badge", "link", b(badge::BadgeVariant::Link, "", "Docs")),
        case(
            "badge",
            "empty-text",
            b(badge::BadgeVariant::Default, "", ""),
        ),
        case(
            "badge",
            "escaped-text",
            b(badge::BadgeVariant::Default, "", PROBE),
        ),
        case(
            "badge",
            "escaped-class",
            b(badge::BadgeVariant::Default, PROBE, "x"),
        ),
    ]
}

fn card_cases() -> Vec<Case> {
    let slot = |s: &str| card::SlotProps {
        class: String::new(),
        children: text(s),
    };
    let c = |size, loading, children| card::RenderProps {
        size,
        loading,
        class: String::new(),
        children,
    };
    let header = card::render_header(&card::SlotProps {
        class: String::new(),
        children: vec![
            card::render_title(&slot("Title")),
            card::render_description(&slot("Details")),
        ],
    });
    let content = card::render_content(&slot("Body"));
    vec![
        case(
            "card",
            "default",
            card::render(&c(card::CardSize::Default, false, text("Body"))),
        ),
        case(
            "card",
            "sm",
            card::render(&c(card::CardSize::Sm, false, text("Body"))),
        ),
        case(
            "card",
            "loading",
            card::render(&c(card::CardSize::Default, true, vec![])),
        ),
        case(
            "card",
            "loading-sm",
            card::render(&c(card::CardSize::Sm, true, vec![])),
        ),
        case(
            "card",
            "composed",
            card::render(&c(
                card::CardSize::Default,
                false,
                vec![header, content, card::render_footer(&slot("Footer"))],
            )),
        ),
        case(
            "card",
            "empty-content",
            card::render(&c(card::CardSize::Default, false, vec![])),
        ),
        case(
            "card",
            "escaped-title",
            card::render(&c(
                card::CardSize::Default,
                false,
                vec![card::render_title(&slot(PROBE))],
            )),
        ),
        case(
            "card",
            "escaped-class",
            card::render(&card::RenderProps {
                class: PROBE.to_owned(),
                ..c(card::CardSize::Default, false, vec![])
            }),
        ),
    ]
}

fn chart_cases() -> Vec<Case> {
    let ch = |loading, id: &str, class: &str, children| chart::RenderProps {
        loading,
        id: id.to_owned(),
        class: class.to_owned(),
        children,
    };
    vec![
        case(
            "chart",
            "container",
            chart::render(&ch(false, "sales", "", text("Plot"))),
        ),
        case(
            "chart",
            "empty",
            chart::render(&ch(false, "sales", "", vec![])),
        ),
        case(
            "chart",
            "loading",
            chart::render(&ch(true, "sales", "", vec![])),
        ),
        case(
            "chart",
            "escaped-id",
            chart::render(&ch(false, PROBE, "", vec![])),
        ),
        case(
            "chart",
            "escaped-class",
            chart::render(&ch(false, "sales", PROBE, vec![])),
        ),
        case(
            "chart",
            "escaped-loading-class",
            chart::render(&ch(true, "sales", PROBE, vec![])),
        ),
    ]
}

fn markdown_cases() -> Vec<Case> {
    use markdown_renderer::{MarkdownLinks, MarkdownSource, RenderProps};
    let md = |content: &str| RenderProps {
        content: content.to_owned(),
        ..RenderProps::default()
    };
    let sample = "# Field notes\n\nThe **mzizi** registry keeps *one* contract.\nA second line, kept as a break.\n\n- water bottle\n  - nested item\n- extra time\n\n3. third\n4. fourth\n\n> A quote with `code`\n\nRead [the docs](https://mzizi.dev/docs) or [write](mailto:hello@example.org).\n\n```ts\nconst ok = 1 < 2\n```\n\n---\n\n| Name | Value |\n| :--- | ---: |\n| a | **b** |";
    vec![
        case(
            "markdown-renderer",
            "default",
            markdown_renderer::render(&md(sample)),
        ),
        case(
            "markdown-renderer",
            "empty",
            markdown_renderer::render(&md("")),
        ),
        case(
            "markdown-renderer",
            "xss",
            markdown_renderer::render(&md(
                "<img src=x onerror=alert(1)>\n\n[js](javascript:alert(1)) [ok](https://example.org/a)\n\n<script>alert(6)</script>",
            )),
        ),
        case(
            "markdown-renderer",
            "https",
            markdown_renderer::render(&RenderProps {
                links: MarkdownLinks::Https,
                ..md("[a](https://example.org) [c](/relative)")
            }),
        ),
        case(
            "markdown-renderer",
            "base",
            markdown_renderer::render(&RenderProps {
                heading_base: 3,
                ..md("# Section\n\n###### Deep")
            }),
        ),
        case(
            "markdown-renderer",
            "rich",
            markdown_renderer::render(&RenderProps {
                from: MarkdownSource::Html,
                ..md(
                    "<p># Plan <strong>now</strong></p><ol start=\"4\"><li>refill</li></ol><script>alert(1)</script>",
                )
            }),
        ),
        case(
            "markdown-renderer",
            "titles",
            markdown_renderer::render(&md("[look-alike](https://\u{430}pple.com/login)")),
        ),
        case(
            "markdown-renderer",
            "table-alignment",
            markdown_renderer::render(&md("| a | b | c |\n| :-- | :-: | --: |\n| 1 | 2 | 3 |")),
        ),
        case(
            "markdown-renderer",
            "ordered-start",
            markdown_renderer::render(&md("3. third\n4. fourth")),
        ),
        case(
            "markdown-renderer",
            "escaped-text",
            markdown_renderer::render(&md(PROBE)),
        ),
        case(
            "markdown-renderer",
            "escaped-class",
            markdown_renderer::render(&RenderProps {
                class: PROBE.to_owned(),
                ..md("x")
            }),
        ),
    ]
}

fn progress_cases() -> Vec<Case> {
    let p = |value, max, class: &str| progress::RenderProps {
        value,
        max,
        class: class.to_owned(),
    };
    vec![
        case("progress", "empty", progress::render(&p(None, 100, ""))),
        case(
            "progress",
            "loading",
            progress::render(&p(Some(40), 100, "")),
        ),
        case(
            "progress",
            "complete",
            progress::render(&p(Some(100), 100, "")),
        ),
        case(
            "progress",
            "custom-max",
            progress::render(&p(Some(3), 4, "")),
        ),
        case(
            "progress",
            "half-of-fifty",
            progress::render(&p(Some(25), 50, "")),
        ),
        case(
            "progress",
            "escaped-class",
            progress::render(&p(Some(40), 100, PROBE)),
        ),
    ]
}

fn safe_area_cases() -> Vec<Case> {
    let s = |width, height, safe, box_px, class: &str| safe_area_frame::RenderProps {
        width,
        height,
        safe,
        box_px,
        class: class.to_owned(),
    };
    vec![
        case(
            "safe-area-frame",
            "default",
            safe_area_frame::render(&s(1080, 1920, [250, 0, 340, 0], 56, "")),
        ),
        case(
            "safe-area-frame",
            "rail",
            safe_area_frame::render(&s(1080, 1920, [0, 160, 0, 0], 80, "")),
        ),
        case(
            "safe-area-frame",
            "plain",
            safe_area_frame::render(&s(1920, 1080, [0, 0, 0, 0], 56, "opacity-80")),
        ),
        case(
            "safe-area-frame",
            "escaped-class",
            safe_area_frame::render(&s(1080, 1920, [0, 0, 0, 0], 56, PROBE)),
        ),
    ]
}

fn separator_cases() -> Vec<Case> {
    use separator::{RenderProps, SeparatorOrientation};
    let s = |orientation, decorative, class: &str| RenderProps {
        orientation,
        decorative,
        class: class.to_owned(),
    };
    vec![
        case(
            "separator",
            "default",
            separator::render(&s(SeparatorOrientation::Horizontal, true, "")),
        ),
        case(
            "separator",
            "vertical",
            separator::render(&s(SeparatorOrientation::Vertical, true, "")),
        ),
        case(
            "separator",
            "semantic",
            separator::render(&s(SeparatorOrientation::Horizontal, false, "")),
        ),
        case(
            "separator",
            "semantic-vertical",
            separator::render(&s(SeparatorOrientation::Vertical, false, "")),
        ),
        case(
            "separator",
            "escaped-class",
            separator::render(&s(SeparatorOrientation::Horizontal, true, PROBE)),
        ),
    ]
}

fn all_cases() -> Vec<Case> {
    let mut all = alert_cases();
    all.extend(badge_cases());
    all.extend(card_cases());
    all.extend(chart_cases());
    all.extend(markdown_cases());
    all.extend(progress_cases());
    all.extend(safe_area_cases());
    all.extend(separator_cases());
    all
}

fn golden_path(c: &Case) -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("tests/goldens")
        .join(c.component)
        .join(format!("{}.html", c.state))
}

/// The fill's `translateX` for one reading: the indicator is shifted left by the part of the track
/// it does not fill.
fn progress_offset(value: Option<u8>, max: u8) -> String {
    let html = progress::render(&progress::RenderProps {
        value,
        max,
        class: String::new(),
    });
    let start = html
        .find("transform: translateX(-")
        .expect("an indicator transform");
    html[start..].split('%').next().unwrap().to_owned()
}

#[test]
fn progress_fill_is_value_over_max_not_value_over_100() {
    assert_eq!(progress_offset(Some(25), 50), "transform: translateX(-50");
    assert_eq!(progress_offset(Some(3), 4), "transform: translateX(-25");
    assert_eq!(progress_offset(Some(40), 100), "transform: translateX(-60");
    assert_eq!(progress_offset(Some(100), 100), "transform: translateX(-0");
    // Past the max is complete, not a negative fill.
    assert_eq!(progress_offset(Some(60), 50), "transform: translateX(-0");
    // No reading is an empty bar, and a zero max has nothing to fill, so any reading is complete.
    assert_eq!(progress_offset(None, 50), "transform: translateX(-100");
    assert_eq!(progress_offset(Some(0), 0), "transform: translateX(-0");
}

#[test]
fn goldens_match_the_render_output() {
    let update = std::env::var_os("UPDATE_GOLDENS").is_some();
    for c in all_cases() {
        let path = golden_path(&c);
        if update {
            fs::create_dir_all(path.parent().unwrap()).unwrap();
            fs::write(&path, &c.html).unwrap();
            continue;
        }
        let golden = fs::read_to_string(&path).unwrap_or_else(|e| {
            panic!(
                "missing golden {}: {e}. Write it with UPDATE_GOLDENS=1.",
                path.display()
            )
        });
        assert_eq!(
            c.html, golden,
            "{}/{} differs from its golden",
            c.component, c.state
        );
    }
}

#[test]
fn no_default_build_writes_a_class_attribute() {
    for c in all_cases().iter().filter(|c| !c.passthrough) {
        assert!(
            !c.html.contains(" class="),
            "{}/{} writes a class attribute; an unstyled build carries none: {}",
            c.component,
            c.state,
            c.html
        );
    }
}

#[test]
fn a_passed_class_is_escaped_and_written_last() {
    let escaped = escaped_only(all_cases());
    assert!(!escaped.is_empty());
    for c in escaped {
        assert!(
            c.html.contains(PROBE_ESCAPED),
            "{}/{} does not escape its probe: {}",
            c.component,
            c.state,
            c.html
        );
        assert!(
            !c.html.contains(PROBE),
            "{}/{} writes the probe unescaped: {}",
            c.component,
            c.state,
            c.html
        );
    }
}

/// The cases whose state probes escaping: a passed class, a title, an id, a text.
fn escaped_only(cases: Vec<Case>) -> Vec<Case> {
    cases
        .into_iter()
        .filter(|c| c.state.starts_with("escaped"))
        .collect()
}

#[test]
fn every_goldened_state_is_a_case() {
    let root = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("tests/goldens");
    let cases = all_cases();
    for dir in fs::read_dir(&root).unwrap().filter_map(Result::ok) {
        for file in fs::read_dir(dir.path()).unwrap().filter_map(Result::ok) {
            let component = dir.file_name().to_string_lossy().into_owned();
            let state = file
                .path()
                .file_stem()
                .unwrap()
                .to_string_lossy()
                .into_owned();
            assert!(
                cases
                    .iter()
                    .any(|c| c.component == component && c.state == state),
                "golden {component}/{state} has no case"
            );
        }
    }
}

#[test]
fn safe_area_bands_match_the_typescript_numbers() {
    use mzizi_roots::components::safe_area_frame::safe_area_bands;
    // A 1080x1920 story with Meta's 250/340 bands in a 56px box: the TypeScript's safeAreaBands
    // gives 32x56, top 13.02%, bottom 17.71%, sides 5.93%.
    let b = safe_area_bands(1080, 1920, [250, 64, 340, 64], 56);
    assert_eq!((b.width, b.height), (32, 56));
    assert!((b.top - 13.02).abs() < 1e-9 && (b.bottom - 17.71).abs() < 1e-9);
    assert!((b.left - 5.93).abs() < 1e-9 && (b.right - 5.93).abs() < 1e-9);
    // A favicon never collapses below 6px a side.
    let f = safe_area_bands(32, 4, [0, 0, 0, 0], 56);
    assert_eq!((f.width, f.height), (56, 7));
}
