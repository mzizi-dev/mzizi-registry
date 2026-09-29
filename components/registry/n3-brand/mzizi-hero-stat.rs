//! MZIZI HERO STAT — N3 brand, Dioxus. A Mzizi Roots component.
//!
//! The Rust sibling of `mzizi-hero-stat.tsx`: one large primary value with a unit, a
//! condition, a subtitle and a row of secondary stats — the pattern from mukoko weather's
//! current conditions. Same `data-slot`, same `role="region"`, same loading skeleton.
//!
//! # The harness's motion preference is a prop
//!
//! The `.tsx` reads `motion.prefersReduced` from `useMziziHarness`, which has no Rust port.
//! [`MziziHeroStatProps::prefers_reduced_motion`] takes the one bit the component branches on,
//! the same move `mzizi-update-prompt.rs` makes in N7.
//!
//! # The icon is an element
//!
//! `icon` is already a `ReactNode` in the `.tsx`, so it maps straight to an [`Element`].
//!
//! # The skeleton keeps the region's name
//!
//! The `.tsx`'s loading branch is a `role="region"` with no accessible name, so a screen
//! reader announces an anonymous region. This port labels it with `title` in both branches.
//! **The `.tsx` sibling still has the unnamed skeleton.**

use dioxus::prelude::*;

/// The component's contract, in the clause grammar of the Mzizi language's `contract … end`
/// block (mzizi-dev/mzizi `design/RFC-0006-contracts.md`). `mzizi-brand`'s contract suite
/// evaluates every clause against this component's server-rendered markup and fails on any
/// clause it cannot evaluate.
pub const CONTRACT: &str = r#"contract
  slot is "mzizi-hero-stat"
  role is "region"
  label not_empty
  button "Share" min_height 48
end"#;

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

/// The accessible name of the value, matching the `.tsx`'s `` `${value}${unit || ""}` ``.
#[must_use]
pub fn value_label(value: &str, unit: Option<&str>) -> String {
    format!("{value}{}", unit.unwrap_or(""))
}

/// One secondary stat, e.g. "Humidity 62%".
#[derive(Clone, Debug, PartialEq)]
pub struct SecondaryStat {
    /// Label, shown muted.
    pub label: String,
    /// Value, shown strong.
    pub value: String,
}

/// Join a base class string with a consumer's extra classes, without a trailing space.
fn join(base: &str, extra: &str) -> String {
    if extra.is_empty() {
        base.to_owned()
    } else {
        format!("{base} {extra}")
    }
}

const SHARE: &str = "flex min-h-[48px] min-w-[48px] items-center justify-center rounded-[var(--radius-md,12px)] bg-muted px-3 text-sm text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary,#00B0FF)]";

/// Props for [`MziziHeroStat`].
#[derive(Props, Clone, PartialEq)]
pub struct MziziHeroStatProps {
    /// Renders the skeleton instead of the value.
    #[props(default)]
    pub loading: bool,
    /// What the value is, e.g. "Harare now". Also the region's accessible name.
    #[props(into)]
    pub title: String,
    /// The primary value.
    #[props(into)]
    pub value: String,
    /// Unit after the value.
    #[props(default)]
    pub unit: Option<String>,
    /// Condition line, in the serif face.
    #[props(default)]
    pub condition: Option<String>,
    /// Muted subtitle.
    #[props(default)]
    pub subtitle: Option<String>,
    /// Secondary stats.
    #[props(default)]
    pub secondary_stats: Vec<SecondaryStat>,
    /// Icon, tinted with the brand accent.
    #[props(default)]
    pub icon: Option<Element>,
    /// Shows a Share button when set.
    #[props(default)]
    pub on_share: Option<EventHandler<()>>,
    /// Replaces the harness's `motion.prefersReduced`.
    #[props(default)]
    pub prefers_reduced_motion: bool,
    /// Extra classes, appended last.
    #[props(default)]
    pub class: String,
}

/// A large primary value with context and secondary stats.
#[component]
pub fn MziziHeroStat(props: MziziHeroStatProps) -> Element {
    if props.loading {
        return rsx! {
            div {
                "data-slot": "mzizi-hero-stat",
                "data-portal": "https://mzizi.dev/components/mzizi-hero-stat",
                "data-loading": "",
                role: "region",
                "aria-label": "{props.title}",
                class: "animate-pulse space-y-3 rounded-[var(--radius-lg,14px)] bg-card p-5 ring-1 ring-foreground/10",
                div { class: "h-3 w-24 rounded bg-muted" }
                div { class: "h-16 w-32 rounded bg-muted" }
                div { class: "h-4 w-20 rounded bg-muted" }
                div { class: "h-3 w-40 rounded bg-muted" }
            }
        };
    }
    let label = value_label(&props.value, props.unit.as_deref());
    let share_label = format!("Share {}", props.title);
    rsx! {
        section {
            "data-slot": "mzizi-hero-stat",
            role: "region",
            "aria-label": "{props.title}",
            style: entrance_style(props.prefers_reduced_motion),
            class: join("rounded-[var(--radius-lg,14px)] bg-card p-5 ring-1 ring-foreground/10 sm:p-6", &props.class),
            div { class: "flex items-start justify-between gap-2",
                div { class: "min-w-0",
                    p { class: "text-sm font-medium text-muted-foreground", "{props.title}" }
                    div { class: "mt-1 flex items-baseline gap-1",
                        span {
                            class: "font-mono text-6xl font-bold tracking-tighter text-foreground sm:text-7xl",
                            "aria-label": "{label}",
                            "{props.value}"
                        }
                        if let Some(unit) = &props.unit {
                            span { class: "text-2xl font-light text-muted-foreground", "aria-hidden": "true", "{unit}" }
                        }
                    }
                    if let Some(condition) = &props.condition {
                        p { class: "mt-1 text-base font-semibold text-foreground", style: "font-family: var(--font-serif);",
                            "{condition}"
                        }
                    }
                    if let Some(subtitle) = &props.subtitle {
                        p { class: "mt-1 text-sm text-muted-foreground", "{subtitle}" }
                    }
                    if !props.secondary_stats.is_empty() {
                        div { class: "mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground",
                            for (i, s) in props.secondary_stats.iter().enumerate() {
                                span { key: "{i}",
                                    "{s.label} "
                                    strong { class: "text-foreground", "{s.value}" }
                                }
                            }
                        }
                    }
                }
                div { class: "flex shrink-0 flex-col items-end gap-2",
                    if let Some(icon) = &props.icon {
                        div { class: "text-[var(--brand-accent,var(--color-cobalt,#00B0FF))]", {icon} }
                    }
                    if let Some(on_share) = props.on_share {
                        button {
                            r#type: "button",
                            "aria-label": "{share_label}",
                            class: SHARE,
                            onclick: move |_| on_share.call(()),
                            "Share"
                        }
                    }
                }
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn value_label_appends_the_unit() {
        assert_eq!(value_label("24", Some("°C")), "24°C");
        assert_eq!(value_label("24", None), "24");
    }

    #[test]
    fn reduced_motion_drops_the_animation() {
        assert_eq!(entrance_style(true), "");
        assert!(entrance_style(false).contains("nyuchi-fade-slide-up"));
    }
}
