//! STATUS BADGE — N2 primitive, Dioxus.
//!
//! The Rust sibling of `status-badge.tsx` and `status-badge.mz`, sharing their contract: a
//! pill-shaped lifecycle label (`stable`, `beta`, `alpha`, `deprecated`), each status tinted
//! with one of the Seven Minerals at 10% behind the mineral itself, with the same
//! `data-slot`, `data-portal`, `data-status` and `data-variant` attributes and the same
//! Tailwind classes, so one stylesheet serves every target.
//!
//! The React build renders `Badge` with `variant="outline"`; this file carries that badge's
//! base and outline classes itself, because a registry component is self-contained.
//!
//! The word is always rendered, so the status never depends on colour alone. Not
//! interactive, so no touch floor applies.

use dioxus::prelude::*;

/// The lifecycle stage. Matches `StatusBadgeStatus` in `status-badge.tsx`.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum StatusBadgeStatus {
    /// Ready for production. Malachite.
    #[default]
    Stable,
    /// Feature-complete, still settling. Cobalt.
    Beta,
    /// A preview surface that may change. Gold.
    Alpha,
    /// Slated for removal, struck through. Terracotta.
    Deprecated,
}

/// Every status, in order.
pub const STATUS_BADGE_STATUSES: [StatusBadgeStatus; 4] = [
    StatusBadgeStatus::Stable,
    StatusBadgeStatus::Beta,
    StatusBadgeStatus::Alpha,
    StatusBadgeStatus::Deprecated,
];

/// The `Badge` base classes (from `badge.tsx`) every status badge carries.
const BADGE_BASE: &str = "h-5 gap-1 rounded-md border border-transparent px-2 py-0.5 text-xs font-medium transition-all has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&>svg]:size-3! inline-flex items-center justify-center w-fit whitespace-nowrap shrink-0 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive overflow-hidden group/badge";

/// The `Badge` outline variant's classes.
const BADGE_OUTLINE: &str =
    "border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground bg-input/30";

/// The status badge's own classes: a pill in small mono capitals.
const STATUS_BASE: &str =
    "rounded-full border-transparent font-mono text-[10px] tracking-wide uppercase";

impl StatusBadgeStatus {
    /// The Tailwind classes for this status: its mineral at 10% behind the mineral.
    pub const fn classes(self) -> &'static str {
        match self {
            Self::Stable => "bg-malachite/10 text-malachite",
            Self::Beta => "bg-cobalt/10 text-cobalt",
            Self::Alpha => "bg-gold/10 text-gold",
            Self::Deprecated => "bg-terracotta/10 text-terracotta line-through",
        }
    }

    /// The mineral this status is tinted with.
    pub const fn mineral(self) -> &'static str {
        match self {
            Self::Stable => "malachite",
            Self::Beta => "cobalt",
            Self::Alpha => "gold",
            Self::Deprecated => "terracotta",
        }
    }

    /// The `data-status` value, and the label when no children are given.
    pub const fn slug(self) -> &'static str {
        match self {
            Self::Stable => "stable",
            Self::Beta => "beta",
            Self::Alpha => "alpha",
            Self::Deprecated => "deprecated",
        }
    }
}

/// Compose the full class string for a status badge.
pub fn status_badge_variants(status: StatusBadgeStatus, extra: &str) -> String {
    let mut out = String::with_capacity(BADGE_BASE.len() + 256);
    for part in [
        BADGE_BASE,
        BADGE_OUTLINE,
        STATUS_BASE,
        status.classes(),
        extra,
    ] {
        if !part.is_empty() {
            if !out.is_empty() {
                out.push(' ');
            }
            out.push_str(part);
        }
    }
    out
}

/// The checkable clauses this component keeps (RFC-0006 grammar), evaluated by
/// `tests/contract.rs` against `dioxus-ssr` markup.
pub const CONTRACT: &str = r#"contract
  slot is "status-badge"
  portal is "https://mzizi.dev/components/status-badge"
  class contains "rounded-full"
  every status_badge_status class not_empty
  status_badge_status.stable class contains "malachite"
  status_badge_status.deprecated class contains "line-through"
  when default shows span "stable"
  when deprecated shows span "deprecated"
end"#;

/// Props for [`StatusBadge`].
#[derive(Props, Clone, PartialEq)]
pub struct StatusBadgeProps {
    /// The lifecycle stage.
    #[props(default)]
    pub status: StatusBadgeStatus,
    /// Extra classes, appended last so a consumer can override.
    #[props(default)]
    pub class: String,
    /// Any other HTML attribute.
    #[props(extends = GlobalAttributes)]
    pub attributes: Vec<Attribute>,
    /// The label. Omit it to show the status itself.
    pub children: Option<Element>,
}

/// A pill-shaped lifecycle label.
#[component]
pub fn StatusBadge(props: StatusBadgeProps) -> Element {
    let label = props.status.slug();
    rsx! {
        span {
            "data-slot": "status-badge",
            "data-portal": "https://mzizi.dev/components/status-badge",
            "data-variant": "outline",
            "data-status": label,
            class: status_badge_variants(props.status, &props.class),
            ..props.attributes,
            if let Some(children) = props.children {
                {children}
            } else {
                "{label}"
            }
        }
    }
}
