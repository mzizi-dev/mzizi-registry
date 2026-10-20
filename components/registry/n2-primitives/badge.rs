//! BADGE — N2 primitive, Dioxus.
//!
//! The Rust sibling of `badge.tsx`, sharing its contract: the same six variants, the same
//! `data-slot` / `data-variant` attributes, and the same Tailwind classes, so one stylesheet
//! serves both targets.
//!
//! A badge is not interactive on its own, so it carries no touch-target floor — the `[a]:`
//! prefixed hover classes only apply when a consumer wraps it in a link, which is when it
//! becomes a target and inherits the link's hit area.

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

    /// Write text content, escaped.
    pub(super) fn text(out: &mut String, value: &str) {
        escape_into(out, value);
    }
}

/// Visual treatment. Matches `badgeVariants` in `badge.tsx` exactly.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum BadgeVariant {
    /// Solid primary fill.
    #[default]
    Default,
    /// Solid secondary fill.
    Secondary,
    /// Destructive state — error, revoked, failed.
    Destructive,
    /// Bordered, low-emphasis.
    Outline,
    /// No fill until hovered.
    Ghost,
    /// Renders as an inline text link.
    Link,
}

/// The base classes every badge carries.
const BASE: &str = "h-5 gap-1 rounded-md border border-transparent px-2 py-0.5 text-xs font-medium transition-all has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&>svg]:size-3! inline-flex items-center justify-center w-fit whitespace-nowrap shrink-0 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive overflow-hidden group/badge";

impl BadgeVariant {
    /// The Tailwind classes for this variant.
    pub const fn classes(self) -> &'static str {
        match self {
            Self::Default => "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
            Self::Secondary => "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
            Self::Destructive => {
                "bg-destructive/10 [a]:hover:bg-destructive/20 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 text-destructive dark:bg-destructive/20"
            }
            Self::Outline => {
                "border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground bg-input/30"
            }
            Self::Ghost => "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
            Self::Link => "text-primary underline-offset-4 hover:underline",
        }
    }

    /// The `data-variant` value.
    pub const fn slug(self) -> &'static str {
        match self {
            Self::Default => "default",
            Self::Secondary => "secondary",
            Self::Destructive => "destructive",
            Self::Outline => "outline",
            Self::Ghost => "ghost",
            Self::Link => "link",
        }
    }
}

/// Compose the full class string for a badge.
pub fn badge_variants(variant: BadgeVariant, extra: &str) -> String {
    let mut out = String::with_capacity(BASE.len() + 128);
    out.push_str(BASE);
    out.push(' ');
    out.push_str(variant.classes());
    if !extra.is_empty() {
        out.push(' ');
        out.push_str(extra);
    }
    out
}

/// Props for [`Badge`].
#[derive(Props, Clone, PartialEq)]
pub struct BadgeProps {
    /// Visual treatment.
    #[props(default)]
    pub variant: BadgeVariant,
    /// Extra classes, appended last so a consumer can override.
    #[props(default)]
    pub class: String,
    /// Any other HTML attribute.
    #[props(extends = GlobalAttributes)]
    pub attributes: Vec<Attribute>,
    /// Badge label.
    pub children: Element,
}

/// A small status or category label.
#[component]
pub fn Badge(props: BadgeProps) -> Element {
    rsx! {
        span {
            "data-slot": "badge",
            "data-portal": "https://mzizi.dev/components/badge",
            "data-variant": props.variant.slug(),
            class: badge_variants(props.variant, &props.class),
            ..props.attributes,
            {props.children}
        }
    }
}

/// The Dioxus-free render path: the props a [`render`] call takes.
///
/// `text` is the label, written as escaped text. [`BadgeProps`] takes an `Element` for its
/// children, which this path cannot take; a registry badge's label is text.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct RenderProps {
    /// Visual treatment.
    pub variant: BadgeVariant,
    /// Extra classes, appended last.
    pub class: String,
    /// The label text.
    pub text: String,
}

/// Render a badge to an HTML string, with no Dioxus and no WASM.
///
/// Byte-identical to `dioxus-ssr` rendering [`Badge`] with the same props, for the cases
/// `mzizi-ui/tests/render_parity.rs` covers.
#[must_use]
pub fn render(props: &RenderProps) -> String {
    let class = badge_variants(props.variant, &props.class);
    let mut out = String::with_capacity(BASE.len() + 256 + props.text.len());
    html::open(
        &mut out,
        "span",
        &[
            ("data-slot", "badge"),
            ("data-portal", "https://mzizi.dev/components/badge"),
            ("data-variant", props.variant.slug()),
            ("class", class.as_str()),
        ],
    );
    html::text(&mut out, &props.text);
    html::close(&mut out, "span");
    out
}
