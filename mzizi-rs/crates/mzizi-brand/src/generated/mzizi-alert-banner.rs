// GENERATED — DO NOT EDIT.
//
// Copied verbatim from components/registry/n3-brand/mzizi-alert-banner.rs by scripts/generate-rust-components.mjs.
// That file is the one a human edits; this is the copy `cargo package` can ship,
// because a tarball only carries files under the crate root.
//
// Regenerate with `pnpm rust:generate`. CI runs `pnpm rust:generate:check`,
// which fails if this copy and its source have drifted.

//! MZIZI ALERT BANNER — N3 brand, Dioxus. A Mzizi Roots component.
//!
//! The Rust sibling of `mzizi-alert-banner.tsx`: the mineral-coded severity alert used for
//! weather, security, trust and system alerts across the ecosystem. Same `data-slot`, same
//! `role="alert"`, same three severities with the same mineral and surface expressions.
//!
//! # Named for the registry item, not the `.tsx` export
//!
//! The `.tsx` exports this component as `MziziWeatherAlert`, a name from before it was
//! generalised. The registry item is `mzizi-alert-banner`, so the Rust component is
//! [`MziziAlertBanner`].
//!
//! # The details button meets the touch floor here
//!
//! The `.tsx`'s "View Details" button is `h-10` — 40px, under the 48px floor its own header
//! claims (`TOUCH 48px+`). This port renders it `min-h-[48px]`, and the contract asserts it.
//! **The `.tsx` sibling still ships `h-10`.**

use dioxus::prelude::*;

/// The component's contract, in the clause grammar of the Mzizi language's `contract … end`
/// block (mzizi-dev/mzizi `design/RFC-0006-contracts.md`). `mzizi-brand`'s contract suite
/// evaluates every clause against this component's server-rendered markup and fails on any
/// clause it cannot evaluate.
pub const CONTRACT: &str = r#"contract
  slot is "mzizi-alert-banner"
  portal is "https://mzizi.dev/components/mzizi-alert-banner"
  role is "alert"
  every alert_severity label not_empty
  watch.mineral uses "--severity-cold"
  severe.mineral uses "--severity-severe"
  button "Dismiss" min_height 48
  button "View Details" min_height 48
end"#;

/// How serious the alert is. Matches `severityConfig` in the `.tsx`.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum AlertSeverity {
    /// Heads-up; cobalt surface.
    Watch,
    /// Take care; terracotta.
    Moderate,
    /// Act now; the severe mineral on a gold surface.
    Severe,
}

impl AlertSeverity {
    /// Every severity, for exhaustive checks.
    pub const ALL: [Self; 3] = [Self::Watch, Self::Moderate, Self::Severe];

    /// The mineral: left border, label colour and details-button fill.
    #[must_use]
    pub const fn mineral(self) -> &'static str {
        match self {
            Self::Watch => "var(--severity-cold, #3B82F6)",
            Self::Moderate => "var(--severity-high,var(--color-terracotta,#D4A574))",
            Self::Severe => "var(--severity-severe, #EF4444)",
        }
    }

    /// The colour mixed at 8% into the card surface.
    #[must_use]
    pub const fn surface(self) -> &'static str {
        match self {
            Self::Watch => "var(--color-cobalt,#00B0FF)",
            Self::Moderate => "var(--color-terracotta,#D4A574)",
            Self::Severe => "var(--color-gold,#FFD740)",
        }
    }

    /// The leading glyph.
    #[must_use]
    pub const fn icon(self) -> &'static str {
        match self {
            Self::Watch => "👁",
            Self::Moderate => "⚠️",
            Self::Severe => "🚨",
        }
    }

    /// The uppercase label shown before the alert type.
    #[must_use]
    pub const fn label(self) -> &'static str {
        match self {
            Self::Watch => "Watch",
            Self::Moderate => "Moderate",
            Self::Severe => "Severe",
        }
    }

    /// The value the `.tsx` accepts for `severity`.
    #[must_use]
    pub const fn slug(self) -> &'static str {
        match self {
            Self::Watch => "watch",
            Self::Moderate => "moderate",
            Self::Severe => "severe",
        }
    }
}

/// The validity line, matching the `.tsx`'s two optional template fragments.
#[must_use]
pub fn validity_line(valid_from: Option<&str>, valid_until: Option<&str>) -> Option<String> {
    match (valid_from, valid_until) {
        (None, None) => None,
        (Some(from), None) => Some(format!("From {from}")),
        (None, Some(until)) => Some(format!(" until {until}")),
        (Some(from), Some(until)) => Some(format!("From {from} until {until}")),
    }
}

/// Join a base class string with a consumer's extra classes, without a trailing space.
fn join(base: &str, extra: &str) -> String {
    if extra.is_empty() {
        base.to_owned()
    } else {
        format!("{base} {extra}")
    }
}

const DISMISS: &str = "min-h-[48px] text-sm text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary,#00B0FF)]";
const DETAILS: &str =
    "min-h-[48px] rounded-full px-4 text-[12px] font-medium transition-opacity hover:opacity-80";

/// Props for [`MziziAlertBanner`].
#[derive(Props, Clone, PartialEq)]
pub struct MziziAlertBannerProps {
    /// Alert type, shown after the severity label (e.g. "Thunderstorm").
    #[props(into)]
    pub r#type: String,
    /// How serious the alert is.
    pub severity: AlertSeverity,
    /// The headline.
    #[props(into)]
    pub headline: String,
    /// Supporting description.
    #[props(default)]
    pub description: Option<String>,
    /// Affected areas, joined with commas.
    #[props(default)]
    pub areas: Vec<String>,
    /// Start of validity, as the host formats it.
    #[props(default)]
    pub valid_from: Option<String>,
    /// End of validity, as the host formats it.
    #[props(default)]
    pub valid_until: Option<String>,
    /// What to do.
    #[props(default)]
    pub instructions: Option<String>,
    /// Shows a dismiss control when set.
    #[props(default)]
    pub on_dismiss: Option<EventHandler<()>>,
    /// Shows a "View Details" button when set.
    #[props(default)]
    pub on_details: Option<EventHandler<()>>,
    /// Extra classes, appended last.
    #[props(default)]
    pub class: String,
}

/// A mineral-coded severity alert.
#[component]
pub fn MziziAlertBanner(props: MziziAlertBannerProps) -> Element {
    let severity = props.severity;
    let mineral = severity.mineral();
    let surface = severity.surface();
    let validity = validity_line(props.valid_from.as_deref(), props.valid_until.as_deref());
    let areas = props.areas.join(", ");
    rsx! {
        div {
            "data-slot": "mzizi-alert-banner",
            "data-portal": "https://mzizi.dev/components/mzizi-alert-banner",
            "data-severity": severity.slug(),
            role: "alert",
            class: join("space-y-2 rounded-[var(--radius-lg,14px)] border-l-[3px] p-4", &props.class),
            style: "border-left-color: {mineral}; background-color: color-mix(in srgb, {surface} 8%, var(--card));",
            div { class: "flex items-start justify-between gap-2",
                div { class: "flex items-center gap-2",
                    span { {severity.icon()} }
                    span { class: "text-xs font-bold tracking-wider uppercase", style: "color: {mineral};",
                        "{severity.label()} — {props.r#type}"
                    }
                }
                if let Some(on_dismiss) = props.on_dismiss {
                    button {
                        r#type: "button",
                        class: DISMISS,
                        "aria-label": "Dismiss",
                        onclick: move |_| on_dismiss.call(()),
                        "✕"
                    }
                }
            }
            p { class: "text-sm font-semibold text-foreground", style: "font-family: var(--font-serif);",
                "{props.headline}"
            }
            if let Some(description) = &props.description {
                p { class: "text-xs leading-relaxed text-muted-foreground", "{description}" }
            }
            if !props.areas.is_empty() {
                p { class: "text-[11px] text-muted-foreground", "Areas: {areas}" }
            }
            if let Some(validity) = validity {
                p { class: "text-[10px] text-muted-foreground", "{validity}" }
            }
            if let Some(instructions) = &props.instructions {
                div { class: "rounded-[var(--radius-sm,7px)] bg-muted p-2.5",
                    p { class: "text-xs leading-relaxed text-foreground", "⚡ {instructions}" }
                }
            }
            if let Some(on_details) = props.on_details {
                button {
                    r#type: "button",
                    class: DETAILS,
                    style: "background-color: {mineral}; color: var(--foreground, #0A0A0A);",
                    onclick: move |_| on_details.call(()),
                    "View Details"
                }
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn validity_matches_the_two_template_fragments() {
        assert_eq!(validity_line(None, None), None);
        assert_eq!(
            validity_line(Some("06:00"), None).as_deref(),
            Some("From 06:00")
        );
        assert_eq!(
            validity_line(None, Some("18:00")).as_deref(),
            Some(" until 18:00")
        );
        assert_eq!(
            validity_line(Some("06:00"), Some("18:00")).as_deref(),
            Some("From 06:00 until 18:00")
        );
    }

    #[test]
    fn every_severity_has_a_distinct_mineral() {
        let minerals: Vec<_> = AlertSeverity::ALL.iter().map(|s| s.mineral()).collect();
        assert_eq!(minerals.len(), 3);
        assert_ne!(minerals[0], minerals[1]);
        assert_ne!(minerals[1], minerals[2]);
    }
}
