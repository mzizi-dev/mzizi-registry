// GENERATED — DO NOT EDIT.
//
// Copied verbatim from components/registry/n3-brand/mzizi-stats-row.rs by scripts/generate-rust-components.mjs.
// That file is the one a human edits; this is the copy `cargo package` can ship,
// because a tarball only carries files under the crate root.
//
// Regenerate with `pnpm rust:generate`. CI runs `pnpm rust:generate:check`,
// which fails if this copy and its source have drifted.

//! MZIZI STATS ROW — N3 brand, Dioxus. A Mzizi Roots component.
//!
//! The Rust sibling of `mzizi-stats-row.tsx`: the compact metrics bar on home screens and
//! dashboards — two to four stats, each with an icon in a translucent mineral square, a value,
//! a label and an optional trend. Same `data-slot`, same `data-layout`, same `inline` and
//! `grid` layouts, same trend colouring.
//!
//! # `layoutVariants` is a `match`
//!
//! The `.tsx` builds the layout classes with `class-variance-authority`; [`StatsLayout`] is the
//! same table, checked exhaustively at compile time, as `badge.rs` and `button.rs` do in N2.
//!
//! # The icon is an element
//!
//! The `.tsx` takes a Lucide component type per stat and renders it at `size-4` in the
//! stat's colour. [`StatItem::icon`] is an [`Element`]: the host passes its own icon, and the
//! square still tints it through `color`.
//!
//! # The harness's motion preference is a prop
//!
//! [`MziziStatsRowProps::prefers_reduced_motion`] replaces `useMziziHarness`'s
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
  slot is "mzizi-stats-row"
  portal is "https://mzizi.dev/components/mzizi-stats-row"
  role is "group"
  label is "Statistics"
  layout is "inline"
  stats_layout.inline class uses "--radius-card"
  every trend_direction class in "text-emerald-400" "text-red-400" "text-muted-foreground"
end"#;

/// Layout. Matches `layoutVariants` in the `.tsx`.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Default)]
pub enum StatsLayout {
    /// One card, stats side by side.
    #[default]
    Inline,
    /// One card per stat, in a grid.
    Grid,
}

impl StatsLayout {
    /// Every layout, for exhaustive checks.
    pub const ALL: [Self; 2] = [Self::Inline, Self::Grid];

    /// The layout's container classes.
    #[must_use]
    pub const fn classes(self) -> &'static str {
        match self {
            Self::Inline => {
                "flex flex-wrap items-center gap-4 rounded-[var(--radius-card,14px)] bg-card p-3 ring-1 ring-foreground/10"
            }
            Self::Grid => "grid gap-3",
        }
    }

    /// The `data-layout` value.
    #[must_use]
    pub const fn slug(self) -> &'static str {
        match self {
            Self::Inline => "inline",
            Self::Grid => "grid",
        }
    }
}

/// Grid columns, used only by [`StatsLayout::Grid`]. Matches `gridColsMap`.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Default)]
pub enum StatsColumns {
    /// Two columns.
    #[default]
    Two,
    /// Three columns.
    Three,
    /// Two on mobile, four from `sm`.
    Four,
}

impl StatsColumns {
    /// The grid column classes.
    #[must_use]
    pub const fn classes(self) -> &'static str {
        match self {
            Self::Two => "grid-cols-2",
            Self::Three => "grid-cols-3",
            Self::Four => "grid-cols-2 sm:grid-cols-4",
        }
    }
}

/// Which way a trend string points: a leading `+` is up, a leading `-` is down.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum TrendDirection {
    /// Starts with `+`.
    Up,
    /// Starts with `-`.
    Down,
    /// Anything else.
    Flat,
}

impl TrendDirection {
    /// Every direction, for exhaustive checks.
    pub const ALL: [Self; 3] = [Self::Up, Self::Down, Self::Flat];

    /// Classify a trend string the way the `.tsx`'s `startsWith` checks do.
    #[must_use]
    pub fn of(trend: &str) -> Self {
        if trend.starts_with('+') {
            Self::Up
        } else if trend.starts_with('-') {
            Self::Down
        } else {
            Self::Flat
        }
    }

    /// The trend's colour class in the grid layout.
    #[must_use]
    pub const fn class(self) -> &'static str {
        match self {
            Self::Up => "text-emerald-400",
            Self::Down => "text-red-400",
            Self::Flat => "text-muted-foreground",
        }
    }

    /// The trend's colour class in the inline layout, which leaves a flat trend uncoloured.
    #[must_use]
    pub const fn inline_class(self) -> &'static str {
        match self {
            Self::Up => "text-emerald-400",
            Self::Down => "text-red-400",
            Self::Flat => "",
        }
    }
}

/// The default icon square colour.
pub const DEFAULT_COLOR: &str = "var(--color-malachite)";

/// One stat.
#[derive(Clone, PartialEq)]
pub struct StatItem {
    /// Icon, tinted with `color`.
    pub icon: Element,
    /// Short label, e.g. "Active events".
    pub label: String,
    /// Display value, e.g. "12" or "$450".
    pub value: String,
    /// Mineral for the icon square; defaults to malachite.
    pub color: Option<String>,
    /// Trend, e.g. "+12%".
    pub trend: Option<String>,
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

/// The container classes: the layout, the grid columns when gridded, then the consumer's.
#[must_use]
pub fn container_classes(layout: StatsLayout, columns: StatsColumns, extra: &str) -> String {
    let mut out = layout.classes().to_owned();
    if layout == StatsLayout::Grid {
        out.push(' ');
        out.push_str(columns.classes());
    }
    if !extra.is_empty() {
        out.push(' ');
        out.push_str(extra);
    }
    out
}

/// Props for [`MziziStatsRow`].
#[derive(Props, Clone, PartialEq)]
pub struct MziziStatsRowProps {
    /// Renders the skeleton instead of the stats.
    #[props(default)]
    pub loading: bool,
    /// The stats, two to four.
    pub stats: Vec<StatItem>,
    /// Layout.
    #[props(default)]
    pub layout: StatsLayout,
    /// Grid columns; ignored inline.
    #[props(default)]
    pub columns: StatsColumns,
    /// Replaces the harness's `motion.prefersReduced`.
    #[props(default)]
    pub prefers_reduced_motion: bool,
    /// Extra classes, appended last.
    #[props(default)]
    pub class: String,
}

/// A compact row, or grid, of stats.
#[component]
pub fn MziziStatsRow(props: MziziStatsRowProps) -> Element {
    if props.loading {
        return rsx! {
            div {
                "data-slot": "mzizi-stats-row",
                "data-portal": "https://mzizi.dev/components/mzizi-stats-row",
                "data-loading": "",
                role: "group",
                "aria-label": "Statistics",
                class: "flex animate-pulse gap-4",
                for i in 0..3 {
                    div { key: "{i}", class: "flex-1 space-y-1.5 rounded-[var(--radius-md,12px)] bg-muted p-3",
                        div { class: "h-2.5 w-1/2 rounded bg-foreground/5" }
                        div { class: "h-5 w-2/3 rounded bg-foreground/5" }
                    }
                }
            }
        };
    }
    let grid = props.layout == StatsLayout::Grid;
    rsx! {
        div {
            "data-slot": "mzizi-stats-row",
            "data-portal": "https://mzizi.dev/components/mzizi-stats-row",
            style: entrance_style(props.prefers_reduced_motion),
            role: "group",
            "aria-label": "Statistics",
            "data-layout": props.layout.slug(),
            class: container_classes(props.layout, props.columns, &props.class),
            for (i, stat) in props.stats.iter().enumerate() {
                {
                    let color = stat.color.clone().unwrap_or_else(|| DEFAULT_COLOR.to_owned());
                    let square = format!("background-color: color-mix(in srgb, {color} 20%, transparent);");
                    let tint = format!("color: {color};");
                    let direction = stat.trend.as_deref().map(TrendDirection::of);
                    if grid {
                        rsx! {
                            div { key: "{i}", class: "flex flex-col gap-2 rounded-[var(--radius-card,14px)] bg-card p-4 ring-1 ring-foreground/10",
                                div { class: "flex items-start justify-between",
                                    div { class: "flex size-8 items-center justify-center rounded-[var(--radius-inner,7px)]", style: "{square}",
                                        span { class: "size-4", style: "{tint}", {stat.icon.clone()} }
                                    }
                                    if let (Some(trend), Some(d)) = (&stat.trend, direction) {
                                        span { class: "text-[11px] font-medium {d.class()}", "{trend}" }
                                    }
                                }
                                div { class: "text-2xl font-bold text-foreground", "{stat.value}" }
                                div { class: "text-xs text-muted-foreground", "{stat.label}" }
                            }
                        }
                    } else {
                        rsx! {
                            div { key: "{i}", class: "flex min-w-[120px] items-center gap-2",
                                div { class: "flex size-8 shrink-0 items-center justify-center rounded-[var(--radius-inner,7px)]", style: "{square}",
                                    span { class: "size-4", style: "{tint}", {stat.icon.clone()} }
                                }
                                div { class: "min-w-0",
                                    div { class: "text-[10px] text-muted-foreground", "{stat.label}" }
                                    div { class: "flex items-baseline gap-1.5",
                                        span { class: "text-[13px] font-semibold text-foreground", "{stat.value}" }
                                        if let (Some(trend), Some(d)) = (&stat.trend, direction) {
                                            span { class: "text-[10px] font-medium {d.inline_class()}", "{trend}" }
                                        }
                                    }
                                }
                            }
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
    fn trends_are_read_from_their_sign() {
        assert_eq!(TrendDirection::of("+12%"), TrendDirection::Up);
        assert_eq!(TrendDirection::of("-3%"), TrendDirection::Down);
        assert_eq!(TrendDirection::of("0%"), TrendDirection::Flat);
    }

    #[test]
    fn grid_columns_apply_only_to_the_grid() {
        assert_eq!(
            container_classes(StatsLayout::Inline, StatsColumns::Four, ""),
            StatsLayout::Inline.classes()
        );
        assert_eq!(
            container_classes(StatsLayout::Grid, StatsColumns::Four, "mt-2"),
            "grid gap-3 grid-cols-2 sm:grid-cols-4 mt-2"
        );
    }

    #[test]
    fn a_flat_trend_is_uncoloured_inline_and_muted_in_the_grid() {
        assert_eq!(TrendDirection::Flat.inline_class(), "");
        assert_eq!(TrendDirection::Flat.class(), "text-muted-foreground");
    }
}
