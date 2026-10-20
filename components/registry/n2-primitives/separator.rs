//! SEPARATOR — N2 primitive, Dioxus.
//!
//! The Rust sibling of `separator.tsx`, which wraps Radix's `Separator.Root`. Same
//! contract: a `decorative` separator gets `role="none"` and no `aria-orientation` (a
//! screen reader should skip it entirely); a semantic one gets `role="separator"` and,
//! only when vertical, `aria-orientation="vertical"` (horizontal is the ARIA default for
//! `role="separator"`, so it is omitted rather than stated redundantly — this matches
//! Radix's own implementation, not a simplification of it).
//!
//! Written against the contract, NOT machine-translated from the `.tsx` (registry
//! issue #222, rule 1).
//!
//! `registry #223`: 22 dependents, second-heaviest of primitives wave 1.

use dioxus::prelude::*;

/// The escaping HTML writer `render` uses, inlined so this file installs on its own.
///
/// It is a copy of `mzizi-ui/src/html.rs`, which is the reference and carries the unit tests.
/// A test in `html.rs` holds the two to the same output on the five escaped characters and on
/// non-ASCII text, so the copies cannot drift without a test failing.
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

/// Which axis the separator runs along.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum SeparatorOrientation {
    /// A horizontal rule — full width, one pixel tall.
    #[default]
    Horizontal,
    /// A vertical rule — full height, one pixel wide.
    Vertical,
}

impl SeparatorOrientation {
    /// The Tailwind classes for this orientation. Matches the `data-horizontal:` /
    /// `data-vertical:` arbitrary-attribute variants in `separator.tsx` — the underlying
    /// `data-orientation` value is what both targets key off, so this stays in step with
    /// `slug()`.
    pub const fn classes(self) -> &'static str {
        match self {
            Self::Horizontal => "h-px w-full",
            Self::Vertical => "w-px self-stretch",
        }
    }

    /// The `data-orientation` value, matching Radix's own attribute name and values.
    pub const fn slug(self) -> &'static str {
        match self {
            Self::Horizontal => "horizontal",
            Self::Vertical => "vertical",
        }
    }
}

/// The base classes every separator carries, whatever its orientation.
const BASE: &str = "shrink-0 bg-border";

/// Compose the full class string for a separator.
pub fn separator_variants(orientation: SeparatorOrientation, extra: &str) -> String {
    let mut out = String::with_capacity(BASE.len() + 64);
    out.push_str(BASE);
    out.push(' ');
    out.push_str(orientation.classes());
    if !extra.is_empty() {
        out.push(' ');
        out.push_str(extra);
    }
    out
}

/// Props for [`Separator`].
#[derive(Props, Clone, PartialEq)]
pub struct SeparatorProps {
    /// Which axis the rule runs along.
    #[props(default)]
    pub orientation: SeparatorOrientation,
    /// Purely visual (the default) means assistive technology should skip it entirely —
    /// `role="none"`, no orientation announced. `false` means it is structural content
    /// and gets `role="separator"`.
    #[props(default = true)]
    pub decorative: bool,
    /// Extra classes, appended last so a consumer can override.
    #[props(default)]
    pub class: String,
    /// Any other HTML attribute.
    #[props(extends = GlobalAttributes)]
    pub attributes: Vec<Attribute>,
}

/// A one-pixel visual (or semantic) rule between content.
///
/// ```ignore
/// rsx! { Separator {} }
/// rsx! { Separator { orientation: SeparatorOrientation::Vertical, decorative: false } }
/// ```
#[component]
pub fn Separator(props: SeparatorProps) -> Element {
    let role = if props.decorative {
        "none"
    } else {
        "separator"
    };
    // Radix omits `aria-orientation` entirely for horizontal — that is the ARIA default
    // for role="separator" — and never sets it at all on a decorative one. `None` renders
    // no attribute at all in Dioxus, which is the behaviour this reproduces.
    let aria_orientation = (!props.decorative
        && props.orientation == SeparatorOrientation::Vertical)
        .then_some("vertical");
    rsx! {
        div {
            "data-slot": "separator",
            "data-portal": "https://mzizi.dev/components/separator",
            "data-orientation": props.orientation.slug(),
            role,
            "aria-orientation": aria_orientation,
            class: separator_variants(props.orientation, &props.class),
            ..props.attributes,
        }
    }
}

/// The Dioxus-free render path: the props a [`render`] call takes. They are [`SeparatorProps`]
/// without the free-form attributes, which have no HTML-string form yet.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RenderProps {
    /// Which axis the rule runs along.
    pub orientation: SeparatorOrientation,
    /// Purely visual when `true` (the default): `role="none"`, nothing announced.
    pub decorative: bool,
    /// Extra classes, appended last.
    pub class: String,
}

impl Default for RenderProps {
    fn default() -> Self {
        Self {
            orientation: SeparatorOrientation::default(),
            decorative: true,
            class: String::new(),
        }
    }
}

/// Render a separator to an HTML string, with no Dioxus and no WASM.
///
/// Byte-identical to `dioxus-ssr` rendering [`Separator`] with the same props, for the cases
/// `mzizi-ui/tests/render_parity.rs` covers.
#[must_use]
pub fn render(props: &RenderProps) -> String {
    let role = if props.decorative {
        "none"
    } else {
        "separator"
    };
    let class = separator_variants(props.orientation, &props.class);
    let mut attrs = vec![
        ("data-slot", "separator"),
        ("data-portal", "https://mzizi.dev/components/separator"),
        ("data-orientation", props.orientation.slug()),
        ("role", role),
    ];
    // Only a semantic vertical rule states its orientation; a horizontal one is the ARIA default.
    if !props.decorative && props.orientation == SeparatorOrientation::Vertical {
        attrs.push(("aria-orientation", "vertical"));
    }
    attrs.push(("class", class.as_str()));
    let mut out = String::with_capacity(160 + class.len());
    html::open(&mut out, "div", &attrs);
    html::close(&mut out, "div");
    out
}
