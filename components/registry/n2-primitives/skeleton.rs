//! SKELETON — N2 primitive, Dioxus.
//!
//! The Rust build of `contracts/ui/skeleton.contract.json`, beside `skeleton.tsx` and
//! `skeleton.astro`: a loading placeholder on the `muted` token with the 17px card-scale
//! corner, sized by `class`. The Dashboard Standard skeleton is `app-skeleton`.
//!
//! Written against the contract, NOT machine-translated from the `.tsx` (registry issue #222,
//! rule 1).

use dioxus::prelude::*;

/// The escaping HTML writer `render` uses, inlined so this file installs on its own.
///
/// It is a copy of `mzizi-ui/src/html.rs`, which is the reference and carries the unit tests.
/// A test in `html.rs` holds the two to the same output on every character that matters, so
/// the copies cannot drift without a test failing.
mod html {
    /// Escape `value` for text and double-quoted attribute values: `&`, `<`, `>`, `"` and `'`
    /// become decimal references; everything else, including non-ASCII, is written unchanged.
    fn escape_into(out: &mut String, value: &str) {
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

    /// Write an opening tag with its attributes, in the order given. Values are escaped.
    pub(super) fn open(out: &mut String, tag: &str, attrs: &[(&str, &str)]) {
        out.push('<');
        out.push_str(tag);
        for (name, value) in attrs {
            out.push(' ');
            out.push_str(name);
            out.push_str("=\"");
            escape_into(out, value);
            out.push('"');
        }
        out.push('>');
    }

    /// Write a closing tag.
    pub(super) fn close(out: &mut String, tag: &str) {
        out.push_str("</");
        out.push_str(tag);
        out.push('>');
    }
}

/// The classes every skeleton carries.
const BASE: &str = "animate-pulse rounded-[var(--radius-xl,17px)] bg-muted";

/// Compose the full class string for a skeleton.
#[must_use]
pub fn skeleton_variants(extra: &str) -> String {
    if extra.is_empty() {
        BASE.to_owned()
    } else {
        format!("{BASE} {extra}")
    }
}

/// Props for [`Skeleton`].
#[derive(Props, Clone, PartialEq)]
pub struct SkeletonProps {
    /// Sizing classes (`h-10 w-full`), appended last.
    #[props(default)]
    pub class: String,
    /// Any other attribute.
    #[props(extends = GlobalAttributes)]
    pub attributes: Vec<Attribute>,
}

/// A pulsing placeholder for content that is loading.
#[component]
pub fn Skeleton(props: SkeletonProps) -> Element {
    rsx! {
        div {
            "data-slot": "skeleton",
            "data-portal": "https://mzizi.dev/components/skeleton",
            class: skeleton_variants(&props.class),
            ..props.attributes,
        }
    }
}

/// The Dioxus-free render path: the props a [`render`] call takes.
///
/// `class` is the only prop the contract declares, so it is the only one here. The Dioxus
/// [`SkeletonProps`] also carries free-form attributes; those have no HTML-string form yet
/// and are not part of this path.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct RenderProps {
    /// Sizing classes (`h-10 w-full`), appended last, as [`skeleton_variants`] does.
    pub class: String,
}

/// Render a skeleton to an HTML string, with no Dioxus and no WASM.
///
/// Byte-identical to `dioxus-ssr` rendering [`Skeleton`] with the same `class` for the cases
/// `tests/render_parity.rs` covers: the same attributes in the same order, the same escaping.
#[must_use]
pub fn render(props: &RenderProps) -> String {
    let class = skeleton_variants(&props.class);
    let mut out = String::with_capacity(160 + class.len());
    html::open(
        &mut out,
        "div",
        &[
            ("data-slot", "skeleton"),
            ("data-portal", "https://mzizi.dev/components/skeleton"),
            ("class", &class),
        ],
    );
    html::close(&mut out, "div");
    out
}

/// The contract this build implements, copied by `pnpm contracts:sync` from
/// `contracts/ui/skeleton.contract.json`, the one contract the Astro, React and Rust builds
/// share: edit the contract file, never this copy. `tests/contracts_json.rs` renders every
/// state the contract declares and evaluates every clause and check against the markup.
pub const CONTRACT: &str = r#"contract
  slot is "skeleton"
  portal is "https://mzizi.dev/components/skeleton"
  class contains "animate-pulse"
  class contains "bg-muted"
end"#;
