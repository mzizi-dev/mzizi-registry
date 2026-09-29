//! MZIZI GAUGE CARD — N3 brand, Dioxus. A Mzizi Roots component.
//!
//! The Rust sibling of `mzizi-gauge-card.tsx`: a 270° radial arc gauge with a value, a label
//! and a line of context — the pattern from mukoko weather's metric cards. Same `data-slot`,
//! same `role="meter"` with its value range, same five mineral strokes, same loading skeleton.
//!
//! # The arc is computed, and clamped, in one place
//!
//! [`arc_dash`] is the `.tsx`'s `filled = clamp(percent) / 100 * ARC_LEN`. It also clamps
//! `aria-valuenow`, which the `.tsx` rounds without clamping, so a `percent` of 140 announces
//! 140 against an `aria-valuemax` of 100. **The `.tsx` sibling still announces the
//! unclamped value.**
//!
//! # The harness's motion preference is a prop
//!
//! [`MziziGaugeCardProps::prefers_reduced_motion`] replaces `useMziziHarness`'s
//! `motion.prefersReduced`, as `mzizi-update-prompt.rs` does in N7.
//!
//! # The portal link is on both branches
//!
//! The `.tsx` sets `data-portal` on the loading skeleton only. This port sets it on the loaded
//! view too, so the link from rendered markup back to the registry page does not depend on
//! whether the data has arrived.

use dioxus::prelude::*;

/// The component's contract, in the clause grammar of the Mzizi language's `contract … end`
/// block (mzizi-dev/mzizi `design/RFC-0006-contracts.md`). `mzizi-brand`'s contract suite
/// evaluates every clause against this component's server-rendered markup and fails on any
/// clause it cannot evaluate.
pub const CONTRACT: &str = r#"contract
  slot is "mzizi-gauge-card"
  portal is "https://mzizi.dev/components/mzizi-gauge-card"
  role is "article"
  mineral is "cobalt"
  every gauge_mineral stroke uses "--color-"
end"#;

/// Arc radius in the 64-unit viewBox.
pub const ARC_R: f64 = 26.0;
/// Circumference of the arc's circle.
pub const ARC_C: f64 = 2.0 * std::f64::consts::PI * ARC_R;
/// The visible arc: three quarters of the circle.
pub const ARC_LEN: f64 = ARC_C * 0.75;

/// The stroke mineral. Matches `mineralStrokes` in the `.tsx`.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Default)]
pub enum GaugeMineral {
    /// Cobalt, the default.
    #[default]
    Cobalt,
    /// Tanzanite.
    Tanzanite,
    /// Malachite.
    Malachite,
    /// Gold.
    Gold,
    /// Terracotta.
    Terracotta,
}

impl GaugeMineral {
    /// Every mineral, for exhaustive checks.
    pub const ALL: [Self; 5] = [
        Self::Cobalt,
        Self::Tanzanite,
        Self::Malachite,
        Self::Gold,
        Self::Terracotta,
    ];

    /// The stroke colour.
    #[must_use]
    pub const fn stroke(self) -> &'static str {
        match self {
            Self::Cobalt => "var(--color-cobalt, #00B0FF)",
            Self::Tanzanite => "var(--color-tanzanite, #B388FF)",
            Self::Malachite => "var(--color-malachite, #64FFDA)",
            Self::Gold => "var(--color-gold, #FFD740)",
            Self::Terracotta => "var(--color-terracotta, #D4A574)",
        }
    }

    /// The value the `.tsx` accepts for `mineral`.
    #[must_use]
    pub const fn slug(self) -> &'static str {
        match self {
            Self::Cobalt => "cobalt",
            Self::Tanzanite => "tanzanite",
            Self::Malachite => "malachite",
            Self::Gold => "gold",
            Self::Terracotta => "terracotta",
        }
    }
}

/// `percent` clamped to 0–100; NaN reads as 0.
#[must_use]
pub fn clamp_percent(percent: f64) -> f64 {
    if percent.is_nan() {
        0.0
    } else {
        percent.clamp(0.0, 100.0)
    }
}

/// The filled arc length for `percent`, as a `stroke-dasharray` value.
#[must_use]
pub fn arc_dash(percent: f64) -> String {
    let filled = clamp_percent(percent) / 100.0 * ARC_LEN;
    format!("{filled} {ARC_C}")
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

/// Props for [`MziziGaugeCard`].
#[derive(Props, Clone, PartialEq)]
pub struct MziziGaugeCardProps {
    /// Renders the skeleton instead of the gauge.
    #[props(default)]
    pub loading: bool,
    /// Icon before the label.
    #[props(default)]
    pub icon: Option<Element>,
    /// What is measured, e.g. "UV index".
    #[props(into)]
    pub label: String,
    /// The value in the middle of the arc, e.g. "7".
    #[props(into)]
    pub value: String,
    /// How full the arc is, 0–100.
    pub percent: f64,
    /// Line of context under the label, e.g. "High".
    #[props(default)]
    pub context: Option<String>,
    /// Classes for the context line; defaults to muted.
    #[props(default)]
    pub context_class: Option<String>,
    /// A stroke colour that overrides `mineral`.
    #[props(default)]
    pub stroke_color: Option<String>,
    /// The stroke mineral.
    #[props(default)]
    pub mineral: GaugeMineral,
    /// Replaces the harness's `motion.prefersReduced`.
    #[props(default)]
    pub prefers_reduced_motion: bool,
    /// Extra classes, appended last.
    #[props(default)]
    pub class: String,
}

/// A radial arc gauge card.
#[component]
pub fn MziziGaugeCard(props: MziziGaugeCardProps) -> Element {
    if props.loading {
        return rsx! {
            div {
                "data-slot": "mzizi-gauge-card",
                "data-portal": "https://mzizi.dev/components/mzizi-gauge-card",
                "data-loading": "",
                role: "article",
                class: "flex animate-pulse flex-col items-center gap-3 rounded-[var(--radius-lg,14px)] bg-card p-4 ring-1 ring-foreground/10",
                div { class: "size-16 rounded-full bg-muted" }
                div { class: "h-3 w-16 rounded bg-muted" }
                div { class: "h-2.5 w-24 rounded bg-muted" }
            }
        };
    }
    let color = props
        .stroke_color
        .clone()
        .unwrap_or_else(|| props.mineral.stroke().to_owned());
    let now = clamp_percent(props.percent).round();
    let base = "flex flex-col items-center gap-2 rounded-[var(--radius-lg,14px)] bg-card p-4 text-center ring-1 ring-foreground/10 transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary,#00B0FF)]";
    let root = if props.class.is_empty() {
        base.to_owned()
    } else {
        format!("{base} {}", props.class)
    };
    let context_class = props
        .context_class
        .clone()
        .unwrap_or_else(|| "text-muted-foreground".to_owned());
    rsx! {
        div {
            "data-slot": "mzizi-gauge-card",
            "data-portal": "https://mzizi.dev/components/mzizi-gauge-card",
            "data-mineral": props.mineral.slug(),
            role: "article",
            style: entrance_style(props.prefers_reduced_motion),
            class: "{root}",
            div {
                class: "relative flex shrink-0 items-center justify-center",
                role: "meter",
                "aria-valuenow": "{now}",
                "aria-valuemin": "0",
                "aria-valuemax": "100",
                "aria-label": "{props.value}",
                svg { width: "72", height: "72", view_box: "0 0 64 64", class: "overflow-visible", "aria-hidden": "true",
                    circle {
                        cx: "32",
                        cy: "32",
                        r: "{ARC_R}",
                        fill: "none",
                        class: "stroke-muted-foreground/15",
                        stroke_width: "5",
                        stroke_linecap: "round",
                        stroke_dasharray: "{ARC_LEN} {ARC_C}",
                        transform: "rotate(135 32 32)",
                    }
                    circle {
                        cx: "32",
                        cy: "32",
                        r: "{ARC_R}",
                        fill: "none",
                        style: "stroke: {color};",
                        class: "transition-all duration-500",
                        stroke_width: "5",
                        stroke_linecap: "round",
                        stroke_dasharray: arc_dash(props.percent),
                        transform: "rotate(135 32 32)",
                    }
                }
                span { class: "absolute inset-0 flex items-center justify-center text-base font-bold text-foreground",
                    "{props.value}"
                }
            }
            div { class: "min-w-0",
                div { class: "flex items-center justify-center gap-1.5",
                    if let Some(icon) = &props.icon {
                        span { class: "text-muted-foreground", "aria-hidden": "true", {icon} }
                    }
                    p { class: "text-sm font-medium text-muted-foreground", "{props.label}" }
                }
                if let Some(context) = &props.context {
                    p { class: "mt-1 text-sm {context_class}", "{context}" }
                }
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn the_arc_is_three_quarters_of_the_circle() {
        assert!((ARC_LEN / ARC_C - 0.75).abs() < f64::EPSILON);
    }

    #[test]
    fn percent_is_clamped_both_ways() {
        assert!((clamp_percent(140.0) - 100.0).abs() < f64::EPSILON);
        assert!(clamp_percent(-5.0).abs() < f64::EPSILON);
        assert!(clamp_percent(f64::NAN).abs() < f64::EPSILON);
    }

    #[test]
    fn a_full_gauge_fills_the_visible_arc() {
        assert_eq!(arc_dash(100.0), format!("{ARC_LEN} {ARC_C}"));
        assert_eq!(arc_dash(0.0), format!("0 {ARC_C}"));
    }
}
