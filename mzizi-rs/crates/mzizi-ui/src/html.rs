//! A minimal, escaping HTML writer for the Dioxus-free `render(props) -> String` path.
//!
//! No dependencies, no allocation beyond the output `String`. Every text node and every
//! attribute value passes through [`escape`], so a component cannot emit markup it did not
//! mean to: a quote in a `class` or a `<` in a `text` prop is written as a character
//! reference, never as syntax.
//!
//! The reference table is the one `dioxus-ssr` uses today (it escapes through
//! `askama_escape::Html`), so the output of the two paths is byte-identical on the markup
//! this crate produces. `tests/render_parity.rs` holds that to the live `dioxus-ssr` output.
//!
//! Internal to this crate for now. It becomes the public `mzizi-html` crate when the render
//! path is released (see `docs/roots/RFC-roots-renderer.md`).

use core::fmt::Write;

/// Escape `value` for both text content and a double-quoted attribute value.
///
/// `&`, `<`, `>`, `"` and `'` become decimal references (`&#38;`, `&#60;`, `&#62;`,
/// `&#34;`, `&#39;`). Everything else, including non-ASCII, is written unchanged.
pub(crate) fn escape_into(out: &mut String, value: &str) {
    for c in value.chars() {
        match c {
            '&' => out.push_str("&#38;"),
            '<' => out.push_str("&#60;"),
            '>' => out.push_str("&#62;"),
            '"' => out.push_str("&#34;"),
            '\'' => out.push_str("&#39;"),
            _ => out.push(c),
        }
    }
}

/// Write an opening tag with its attributes, in the order given. `attrs` values are escaped;
/// names are the caller's and must be plain ASCII identifiers (`data-slot`, `class`).
pub(crate) fn open(out: &mut String, tag: &str, attrs: &[(&str, &str)]) {
    out.push('<');
    out.push_str(tag);
    for (name, value) in attrs {
        // Writing to a `String` cannot fail, so the `Result` is discarded deliberately.
        let _ = write!(out, " {name}=\"");
        escape_into(out, value);
        out.push('"');
    }
    out.push('>');
}

/// Write a closing tag.
pub(crate) fn close(out: &mut String, tag: &str) {
    out.push_str("</");
    out.push_str(tag);
    out.push('>');
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn escapes_the_five_characters_as_references() {
        let mut out = String::new();
        escape_into(&mut out, r#"<&>"'"#);
        assert_eq!(out, "&#60;&#38;&#62;&#34;&#39;");
    }

    #[test]
    fn leaves_other_text_alone() {
        let mut out = String::new();
        escape_into(&mut out, "Ünïcode · plain text");
        assert_eq!(out, "Ünïcode · plain text");
    }

    #[test]
    fn an_attribute_cannot_break_out_of_its_quotes() {
        let mut out = String::new();
        open(&mut out, "div", &[("class", r#"a" onclick="x"#)]);
        assert_eq!(out, r#"<div class="a&#34; onclick=&#34;x">"#);
        assert!(!out.contains(r#"" onclick"#));
    }

    #[test]
    fn open_and_close_write_a_plain_element() {
        let mut out = String::new();
        open(&mut out, "span", &[("data-slot", "badge")]);
        close(&mut out, "span");
        assert_eq!(out, r#"<span data-slot="badge"></span>"#);
    }

    /// The registry's `skeleton.rs` carries its own copy of this writer, so that one file can
    /// be installed alone. `render` uses that copy. This holds it to the reference written
    /// here, on the five escaped characters and on non-ASCII text, so the two cannot drift.
    #[test]
    fn the_inline_copy_in_skeleton_matches_this_reference() {
        use crate::skeleton::{RenderProps, render, skeleton_variants};

        let input = "a&b<c>d\"e'f ünï · w-4";
        let class = skeleton_variants(input);
        let mut expected = String::new();
        open(
            &mut expected,
            "div",
            &[
                ("data-slot", "skeleton"),
                ("data-portal", "https://mzizi.dev/components/skeleton"),
                ("class", &class),
            ],
        );
        close(&mut expected, "div");
        assert_eq!(
            render(&RenderProps {
                class: input.to_owned()
            }),
            expected
        );
    }

    /// Every inline copy, the one in each registry file's `mod html` included, must escape the
    /// probe the way this reference does. Each component is rendered with the probe in every
    /// attribute and text slot it has; its output must hold the reference escaping of the probe
    /// and never the probe itself. The skeleton test above holds one component to exact bytes;
    /// this one holds every component to the escaping table, so a copy that drifts fails here.
    #[test]
    fn every_inline_copy_escapes_like_the_reference() {
        use crate::{
            alert, badge, card, chart, markdown_renderer, progress, safe_area_frame, separator,
            skeleton, status_badge,
        };

        const PROBE: &str = "a&b<c>d\"e'f ünï";
        let mut escaped = String::new();
        escape_into(&mut escaped, PROBE);

        let outputs = [
            (
                "skeleton",
                skeleton::render(&skeleton::RenderProps {
                    class: PROBE.to_owned(),
                }),
            ),
            (
                "separator",
                separator::render(&separator::RenderProps {
                    class: PROBE.to_owned(),
                    ..separator::RenderProps::default()
                }),
            ),
            (
                "progress",
                progress::render(&progress::RenderProps {
                    class: PROBE.to_owned(),
                    ..progress::RenderProps::default()
                }),
            ),
            (
                "badge",
                badge::render(&badge::RenderProps {
                    class: PROBE.to_owned(),
                    text: PROBE.to_owned(),
                    ..badge::RenderProps::default()
                }),
            ),
            (
                "status-badge",
                status_badge::render(&status_badge::RenderProps {
                    class: PROBE.to_owned(),
                    label: Some(PROBE.to_owned()),
                    ..status_badge::RenderProps::default()
                }),
            ),
            (
                "safe-area-frame",
                safe_area_frame::render(&safe_area_frame::RenderProps {
                    width: 1,
                    height: 1,
                    safe: [0; 4],
                    box_px: 56,
                    class: PROBE.to_owned(),
                }),
            ),
            (
                "chart",
                chart::render(&chart::RenderProps {
                    id: PROBE.to_owned(),
                    class: PROBE.to_owned(),
                    ..chart::RenderProps::default()
                }),
            ),
            (
                "alert",
                alert::render(&alert::RenderProps {
                    class: PROBE.to_owned(),
                    children: alert::render_title(&alert::PartProps {
                        class: PROBE.to_owned(),
                        children: escaped.clone(),
                    }),
                    ..alert::RenderProps::default()
                }),
            ),
            (
                "card",
                card::render(&card::RenderProps {
                    class: PROBE.to_owned(),
                    children: card::render_header(&card::SlotProps {
                        class: PROBE.to_owned(),
                        children: escaped.clone(),
                    }),
                    ..card::RenderProps::default()
                }),
            ),
            (
                "markdown-renderer",
                markdown_renderer::render(&markdown_renderer::RenderProps {
                    content: PROBE.to_owned(),
                    class: PROBE.to_owned(),
                    ..markdown_renderer::RenderProps::default()
                }),
            ),
        ];
        for (name, output) in outputs {
            assert!(
                output.contains(&escaped),
                "{name} does not escape the probe as the reference does: {output}"
            );
            assert!(
                !output.contains(PROBE),
                "{name} wrote the probe unescaped: {output}"
            );
        }
    }
}
