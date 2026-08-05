//! BUTTON — N2 primitive, Dioxus.
//!
//! The Rust sibling of `button.tsx`. They share a CONTRACT and a token set, not a source
//! file: same variants, same sizes, same `data-slot` / `data-variant` / `data-size`
//! attributes, same Tailwind classes, so a Dioxus app and a React app render the same
//! button from the same stylesheet.
//!
//! Written against the contract, NOT machine-translated from the `.tsx`. A mechanical
//! TSX→RSX pass carries every defect in the original across while `cargo check` waves it
//! through, because a faithful port of a broken component still compiles.
//!
//! Token compliance, identical to the TypeScript:
//!   * Radius `rounded-full` — buttons are ALWAYS pill-shaped per brand (CLAUDE.md §7.5)
//!   * `--ring` token for the focus ring; semantic colour tokens throughout
//!   * `data-slot` present for CSS targeting and testing
//!
//! No harness. Primitives are too low-level for observability wiring — brand components
//! that USE a button wire in at their own level (CLAUDE.md §6.2).

use dioxus::prelude::*;

/// Visual treatment. The set matches `buttonVariants` in `button.tsx` exactly; a variant
/// that exists on one target and not the other is a broken contract, not a feature.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum ButtonVariant {
    /// Solid primary fill — the default call to action.
    #[default]
    Default,
    /// Bordered, transparent-ish fill.
    Outline,
    /// Solid secondary fill.
    Secondary,
    /// No fill until hovered.
    Ghost,
    /// Destructive action — delete, remove, revoke.
    Destructive,
    /// Renders as an inline text link.
    Link,
}

/// Control size. `Default` and `Lg` are 56px; `Sm` is the 48px floor.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum ButtonSize {
    /// 56px tall — the brand standard.
    #[default]
    Default,
    /// 48px tall — the minimum allowed for a touch target.
    Sm,
    /// 56px tall with wider padding.
    Lg,
    /// 56px square, for an icon alone.
    Icon,
    /// 48px square, for an icon alone.
    IconSm,
}

/// The base classes every button carries, whatever its variant or size.
const BASE: &str = "focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 rounded-full border border-transparent bg-clip-padding text-sm font-medium focus-visible:ring-[3px] aria-invalid:ring-[3px] [&_svg:not([class*='size-'])]:size-4 inline-flex items-center justify-center whitespace-nowrap transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none shrink-0 [&_svg]:shrink-0 outline-none group/button select-none";

impl ButtonVariant {
    /// The Tailwind classes for this variant.
    ///
    /// A `match` is the whole variant system here — Rust's exhaustiveness check does the job
    /// `class-variance-authority` does in TypeScript, at compile time and with no dependency.
    /// Adding a variant without giving it classes will not build.
    pub const fn classes(self) -> &'static str {
        match self {
            Self::Default => "bg-primary text-primary-foreground hover:bg-primary/80",
            Self::Outline => {
                "border-border bg-input/30 hover:bg-input/50 hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground"
            }
            Self::Secondary => {
                "bg-secondary text-secondary-foreground hover:bg-secondary/80 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground"
            }
            Self::Ghost => {
                "hover:bg-muted hover:text-foreground dark:hover:bg-muted/50 aria-expanded:bg-muted aria-expanded:text-foreground"
            }
            Self::Destructive => {
                "bg-destructive/10 hover:bg-destructive/20 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/20 text-destructive focus-visible:border-destructive/40 dark:hover:bg-destructive/30"
            }
            Self::Link => "text-primary underline-offset-4 hover:underline",
        }
    }

    /// The `data-variant` value, matching what the React component emits so one stylesheet
    /// and one test selector serve both targets.
    pub const fn slug(self) -> &'static str {
        match self {
            Self::Default => "default",
            Self::Outline => "outline",
            Self::Secondary => "secondary",
            Self::Ghost => "ghost",
            Self::Destructive => "destructive",
            Self::Link => "link",
        }
    }
}

impl ButtonSize {
    /// The Tailwind classes for this size.
    pub const fn classes(self) -> &'static str {
        match self {
            Self::Default => {
                "h-14 gap-2 px-5 has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4"
            }
            Self::Sm => {
                "h-12 gap-1.5 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3"
            }
            Self::Lg => {
                "h-14 gap-2 px-6 has-data-[icon=inline-end]:pr-5 has-data-[icon=inline-start]:pl-5"
            }
            Self::Icon => "size-14",
            Self::IconSm => "size-12",
        }
    }

    /// The `data-size` value.
    pub const fn slug(self) -> &'static str {
        match self {
            Self::Default => "default",
            Self::Sm => "sm",
            Self::Lg => "lg",
            Self::Icon => "icon",
            Self::IconSm => "icon-sm",
        }
    }
}

/// Compose the full class string for a button.
pub fn button_variants(variant: ButtonVariant, size: ButtonSize, extra: &str) -> String {
    let mut out = String::with_capacity(BASE.len() + 256);
    out.push_str(BASE);
    out.push(' ');
    out.push_str(variant.classes());
    out.push(' ');
    out.push_str(size.classes());
    if !extra.is_empty() {
        out.push(' ');
        out.push_str(extra);
    }
    out
}

/// Props for [`Button`].
#[derive(Props, Clone, PartialEq)]
pub struct ButtonProps {
    /// Visual treatment.
    #[props(default)]
    pub variant: ButtonVariant,
    /// Control size.
    #[props(default)]
    pub size: ButtonSize,
    /// Extra classes, appended last so a consumer can override.
    #[props(default)]
    pub class: String,
    /// Any other HTML attribute — `onclick`, `disabled`, `aria-*`, and the rest.
    #[props(extends = GlobalAttributes, extends = button)]
    pub attributes: Vec<Attribute>,
    /// Button label or icon.
    pub children: Element,
}

/// A pill-shaped button.
///
/// ```ignore
/// rsx! { Button { variant: ButtonVariant::Outline, "Cancel" } }
/// ```
#[component]
pub fn Button(props: ButtonProps) -> Element {
    rsx! {
        button {
            "data-slot": "button",
            "data-portal": "https://mzizi.dev/components/button",
            "data-variant": props.variant.slug(),
            "data-size": props.size.slug(),
            class: button_variants(props.variant, props.size, &props.class),
            ..props.attributes,
            {props.children}
        }
    }
}
