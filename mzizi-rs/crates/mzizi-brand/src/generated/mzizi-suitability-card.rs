// GENERATED — DO NOT EDIT.
//
// Copied verbatim from components/registry/n3-brand/mzizi-suitability-card.rs by scripts/generate-rust-components.mjs.
// That file is the one a human edits; this is the copy `cargo package` can ship,
// because a tarball only carries files under the crate root.
//
// Regenerate with `pnpm rust:generate`. CI runs `pnpm rust:generate:check`,
// which fails if this copy and its source have drifted.

//! MZIZI SUITABILITY CARD — N3 brand, Dioxus. A Mzizi Roots component.
//!
//! The Rust sibling of `mzizi-suitability-card.tsx`: a scored recommendation — "good for
//! drying laundry", "fair for a game drive" — with the level mapped to a mineral. Same
//! `data-slot`, same `role="article"`, same five levels, same score-or-label pill.
//!
//! # The harness's motion preference is a prop
//!
//! [`MziziSuitabilityCardProps::prefers_reduced_motion`] replaces `useMziziHarness`'s
//! `motion.prefersReduced`, as `mzizi-update-prompt.rs` does in N7.

use dioxus::prelude::*;

/// The component's contract, in the clause grammar of the Mzizi language's `contract … end`
/// block (mzizi-dev/mzizi `design/RFC-0006-contracts.md`). `mzizi-brand`'s contract suite
/// evaluates every clause against this component's server-rendered markup and fails on any
/// clause it cannot evaluate.
pub const CONTRACT: &str = r#"contract
  slot is "mzizi-suitability-card"
  portal is "https://mzizi.dev/components/mzizi-suitability-card"
  role is "article"
  every suitability_level label not_empty
  excellent.color uses "--color-malachite"
  unsuitable.color uses "--color-destructive"
end"#;

/// How suitable the thing is. Matches `levelConfig` in the `.tsx`.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum SuitabilityLevel {
    /// Malachite.
    Excellent,
    /// Cobalt.
    Good,
    /// Gold.
    Fair,
    /// Terracotta.
    Poor,
    /// Destructive.
    Unsuitable,
}

impl SuitabilityLevel {
    /// Every level, for exhaustive checks.
    pub const ALL: [Self; 5] = [
        Self::Excellent,
        Self::Good,
        Self::Fair,
        Self::Poor,
        Self::Unsuitable,
    ];

    /// The level's mineral.
    #[must_use]
    pub const fn color(self) -> &'static str {
        match self {
            Self::Excellent => "var(--color-malachite, #64FFDA)",
            Self::Good => "var(--color-cobalt, #00B0FF)",
            Self::Fair => "var(--color-gold, #FFD740)",
            Self::Poor => "var(--color-terracotta, #D4A574)",
            Self::Unsuitable => "var(--color-destructive, #FF5252)",
        }
    }

    /// The pill label when there is no score.
    #[must_use]
    pub const fn label(self) -> &'static str {
        match self {
            Self::Excellent => "Excellent",
            Self::Good => "Good",
            Self::Fair => "Fair",
            Self::Poor => "Poor",
            Self::Unsuitable => "Unsuitable",
        }
    }

    /// The value the `.tsx` accepts for `level`.
    #[must_use]
    pub const fn slug(self) -> &'static str {
        match self {
            Self::Excellent => "excellent",
            Self::Good => "good",
            Self::Fair => "fair",
            Self::Poor => "poor",
            Self::Unsuitable => "unsuitable",
        }
    }
}

/// The pill text: the score as a percentage when there is one, else the level's label.
#[must_use]
pub fn pill_text(level: SuitabilityLevel, score: Option<u8>) -> String {
    score.map_or_else(|| level.label().to_owned(), |s| format!("{s}%"))
}

/// The tinted surface and text colour for the icon well and the pill.
#[must_use]
pub fn tint_style(level: SuitabilityLevel) -> String {
    let c = level.color();
    format!("background-color: color-mix(in srgb, {c} 15%, transparent); color: {c};")
}

/// The entrance animation, empty when motion is reduced — the `.tsx`'s `animStyle`, with the
/// harness's 200ms decelerate curve.
#[must_use]
pub fn entrance_style(prefers_reduced_motion: bool) -> &'static str {
    if prefers_reduced_motion {
        ""
    } else {
        "animation: nyuchi-fade-slide-up 200ms cubic-bezier(0, 0, 0.2, 1) both;"
    }
}

const ROOT: &str = "flex items-center gap-3 rounded-[var(--radius-lg,14px)] bg-card p-4 ring-1 ring-foreground/10 transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary,#00B0FF)]";

/// Props for [`MziziSuitabilityCard`].
#[derive(Props, Clone, PartialEq)]
pub struct MziziSuitabilityCardProps {
    /// Renders the skeleton instead of the card.
    #[props(default)]
    pub loading: bool,
    /// Icon in a tinted well.
    #[props(default)]
    pub icon: Option<Element>,
    /// What is being rated.
    #[props(into)]
    pub title: String,
    /// Why.
    #[props(default)]
    pub description: Option<String>,
    /// The rating.
    pub level: SuitabilityLevel,
    /// A score, shown as a percentage in place of the level label.
    #[props(default)]
    pub score: Option<u8>,
    /// Replaces the harness's `motion.prefersReduced`.
    #[props(default)]
    pub prefers_reduced_motion: bool,
    /// Extra classes, appended last.
    #[props(default)]
    pub class: String,
}

/// A scored recommendation with a mineral-coded level.
#[component]
pub fn MziziSuitabilityCard(props: MziziSuitabilityCardProps) -> Element {
    if props.loading {
        return rsx! {
            div {
                "data-slot": "mzizi-suitability-card",
                "data-portal": "https://mzizi.dev/components/mzizi-suitability-card",
                "data-loading": "",
                role: "article",
                class: "flex animate-pulse items-center gap-3 rounded-[var(--radius-lg,14px)] bg-card p-4 ring-1 ring-foreground/10",
                div { class: "size-10 rounded-[var(--radius-sm,7px)] bg-muted" }
                div { class: "flex-1 space-y-1.5",
                    div { class: "h-3.5 w-1/2 rounded bg-muted" }
                    div { class: "h-2.5 w-2/3 rounded bg-muted" }
                }
                div { class: "h-6 w-16 rounded-full bg-muted" }
            }
        };
    }
    let root = if props.class.is_empty() {
        ROOT.to_owned()
    } else {
        format!("{ROOT} {}", props.class)
    };
    let tint = tint_style(props.level);
    rsx! {
        div {
            "data-slot": "mzizi-suitability-card",
            "data-portal": "https://mzizi.dev/components/mzizi-suitability-card",
            "data-level": props.level.slug(),
            role: "article",
            style: entrance_style(props.prefers_reduced_motion),
            class: "{root}",
            if let Some(icon) = &props.icon {
                div { class: "flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-sm,7px)] text-lg", style: "{tint}",
                    {icon}
                }
            }
            div { class: "min-w-0 flex-1",
                p { class: "text-sm font-medium text-foreground", "{props.title}" }
                if let Some(description) = &props.description {
                    p { class: "mt-0.5 text-xs text-muted-foreground", "{description}" }
                }
            }
            span { class: "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold", style: "{tint}",
                {pill_text(props.level, props.score)}
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_score_replaces_the_label() {
        assert_eq!(pill_text(SuitabilityLevel::Good, Some(82)), "82%");
        assert_eq!(pill_text(SuitabilityLevel::Good, None), "Good");
    }

    #[test]
    fn the_tint_mixes_the_level_colour() {
        let s = tint_style(SuitabilityLevel::Fair);
        assert!(s.contains("color-mix(in srgb, var(--color-gold, #FFD740) 15%, transparent)"));
        assert!(s.contains("color: var(--color-gold, #FFD740);"));
    }
}
