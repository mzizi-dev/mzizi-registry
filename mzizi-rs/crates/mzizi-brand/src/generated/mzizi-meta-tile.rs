// GENERATED — DO NOT EDIT.
//
// Copied verbatim from components/registry/n3-brand/mzizi-meta-tile.rs by scripts/generate-rust-components.mjs.
// That file is the one a human edits; this is the copy `cargo package` can ship,
// because a tarball only carries files under the crate root.
//
// Regenerate with `pnpm rust:generate`. CI runs `pnpm rust:generate:check`,
// which fails if this copy and its source have drifted.

//! MZIZI META TILE — N3 brand, Dioxus. A Mzizi Roots component.
//!
//! The Rust sibling of `mzizi-meta-tile.tsx`: the When / Where unit — a rounded-square chip
//! (an icon tile or a month/day date chip) beside a bold primary line and a muted secondary
//! line. Same `data-slot`, same classes, same chip tint.
//!
//! Purely presentational, like the `.tsx`: no harness, no motion, no state. It renders the
//! same markup under server-side rendering as in a browser.
//!
//! # The icon is an element, not a component type
//!
//! The `.tsx` takes `icon` as a React component type and renders it at `size-5` with
//! `strokeWidth={2.2}`. Rust has no Lucide dependency and should not grow one for a slot, so
//! [`MziziMetaTileProps::icon`] is an [`Element`]: the host passes the icon it already has,
//! sized as it likes. The chip still tints it through `color`.

use dioxus::prelude::*;

/// The component's contract, in the clause grammar of the Mzizi language's `contract … end`
/// block (mzizi-dev/mzizi `design/RFC-0006-contracts.md`). `mzizi-brand`'s contract suite
/// evaluates every clause against this component's server-rendered markup and fails on any
/// clause it cannot evaluate.
pub const CONTRACT: &str = r#"contract
  slot is "mzizi-meta-tile"
  tint uses "--brand-accent"
  when date shows span "Sep"
end"#;

/// The default chip tint: the app's brand accent, falling back to the primary token.
pub const DEFAULT_TINT: &str = "var(--brand-accent, var(--color-primary))";

const CHIP_SURFACE: &str =
    "color-mix(in srgb, var(--brand-accent, var(--color-primary)) 12%, transparent)";
const CHIP_BORDER: &str =
    "color-mix(in srgb, var(--brand-accent, var(--color-primary)) 18%, transparent)";

/// Join a base class string with a consumer's extra classes, without a trailing space.
fn join(base: &str, extra: &str) -> String {
    if extra.is_empty() {
        base.to_owned()
    } else {
        format!("{base} {extra}")
    }
}

/// A month-over-day date chip.
#[derive(Clone, Debug, PartialEq)]
pub struct MetaDate {
    /// Month name; only the first three characters are shown.
    pub month: String,
    /// Day of the month, as the host wants it written.
    pub day: String,
}

/// The first three characters of a month name, matching the `.tsx`'s `month.slice(0, 3)`.
///
/// Character-based rather than byte-based, so a non-ASCII month name is never split inside a
/// code point.
#[must_use]
pub fn month_abbrev(month: &str) -> String {
    month.chars().take(3).collect()
}

/// Props for [`MziziMetaTile`].
#[derive(Props, Clone, PartialEq)]
pub struct MziziMetaTileProps {
    /// Icon chip content. Ignored when `date` is set, as in the `.tsx`.
    #[props(default)]
    pub icon: Option<Element>,
    /// Date chip — month abbreviation over the day numeral.
    #[props(default)]
    pub date: Option<MetaDate>,
    /// Small caption above the primary line.
    #[props(default)]
    pub caption: Option<String>,
    /// Bold primary line.
    pub primary: String,
    /// Muted secondary line.
    #[props(default)]
    pub secondary: Option<String>,
    /// Accent tint for the chip glyph or date numeral.
    #[props(default = DEFAULT_TINT.to_string())]
    pub tint: String,
    /// Trailing action, right-aligned.
    #[props(default)]
    pub trailing: Option<Element>,
    /// Extra classes, appended last.
    #[props(default)]
    pub class: String,
}

/// A date or icon chip paired with a primary and secondary line.
#[component]
pub fn MziziMetaTile(props: MziziMetaTileProps) -> Element {
    let chip_background = if props.date.is_some() {
        "transparent"
    } else {
        CHIP_SURFACE
    };
    let primary_class = if props.caption.is_some() {
        "truncate text-[16px] leading-[1.25] font-semibold text-foreground mt-1"
    } else {
        "truncate text-[16px] leading-[1.25] font-semibold text-foreground"
    };
    rsx! {
        div {
            "data-slot": "mzizi-meta-tile",
            class: join("flex items-center gap-3", &props.class),
            div {
                class: "flex size-12 shrink-0 flex-col items-center justify-center rounded-[var(--radius-md,12px)] border",
                style: "border-color: {CHIP_BORDER}; background-color: {chip_background};",
                "aria-hidden": "true",
                if let Some(date) = &props.date {
                    span { class: "text-[10px] leading-none font-semibold tracking-wide text-muted-foreground uppercase",
                        {month_abbrev(&date.month)}
                    }
                    span { class: "mt-0.5 text-xl leading-none font-bold", style: "color: {props.tint};",
                        "{date.day}"
                    }
                } else if let Some(icon) = &props.icon {
                    span { style: "color: {props.tint};", {icon} }
                }
            }
            div { class: "min-w-0 flex-1",
                if let Some(caption) = &props.caption {
                    div { class: "text-[13px] leading-none font-medium text-muted-foreground", "{caption}" }
                }
                div { class: "{primary_class}", "{props.primary}" }
                if let Some(secondary) = &props.secondary {
                    div { class: "mt-0.5 truncate text-[13px] text-muted-foreground", "{secondary}" }
                }
            }
            if let Some(trailing) = &props.trailing {
                div { class: "shrink-0", {trailing} }
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn month_is_cut_to_three_characters() {
        assert_eq!(month_abbrev("September"), "Sep");
        assert_eq!(month_abbrev("Mei"), "Mei");
        assert_eq!(month_abbrev("Ma"), "Ma");
    }

    #[test]
    fn month_abbreviation_never_splits_a_code_point() {
        assert_eq!(month_abbrev("Février"), "Fév");
    }

    #[test]
    fn default_tint_is_the_brand_accent() {
        assert!(DEFAULT_TINT.starts_with("var(--brand-accent"));
    }
}
