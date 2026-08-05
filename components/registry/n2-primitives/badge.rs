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
