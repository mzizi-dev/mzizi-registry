//! CHART — N2 primitive, Dioxus. Container/contract only.
//!
//! `chart.tsx` is a wrapper around Recharts, a JavaScript charting runtime: `ChartStyle`
//! injects `<style>` from a `ChartConfig` keyed to Recharts' theme selectors, and
//! `ChartTooltipContent`/`ChartLegendContent` format Recharts' own tooltip/legend payload
//! shapes. None of that has a Rust equivalent to port against — there is no charting
//! runtime on this target, and registry issue #223 explicitly ruled out reimplementing
//! Recharts in Rust as out of scope for this wave. That is the design decision #223 left
//! open (container-only port vs. backing this with the existing `canvas-chart` primitive);
//! this resolves it as the container-only port, since backing a *contract port* with a
//! *different, unrelated primitive* would not be porting `chart.tsx` at all.
//!
//! What IS ported is the one piece with no Recharts dependency: `ChartContainer`'s own
//! wrapper contract — `data-slot`, the `data-chart` id, the wrapper class list (including
//! the Recharts CSS-selector overrides, which are inert without Recharts but are still part
//! of the exact class-string contract), and the loading skeleton, which is plain markup.
//!
//! NOT ported: `ChartConfig`, `ChartStyle`, `ChartTooltip`, `ChartTooltipContent`,
//! `ChartLegend`, `ChartLegendContent`. Backing them with a real Rust/WASM charting library
//! is future work, not a gap in this port.
//!
//! One more deliberate divergence from `useId()`: the TypeScript generates a `chart-<id>`
//! id automatically via `React.useId()` when none is passed. Dioxus has no equivalent hook
//! that guarantees per-instance uniqueness, and a fake one would be worse than an explicit
//! requirement — so `id` is a required prop here, not optional.
//!
//! Written against the contract, NOT machine-translated from the `.tsx` (registry issue
//! #222, rule 1).
//!
//! `registry #223`: the sixth and last primitive in wave 1.

use dioxus::prelude::*;

/// The wrapper classes for a rendered chart, including the Recharts CSS-selector
/// overrides — verbatim from the TypeScript even though they target class names
/// Recharts itself emits at runtime, which this port has no equivalent of. They are
/// part of the class-string contract regardless of whether anything on this target
/// currently renders a `.recharts-*` element.
const BASE: &str = "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-hidden [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector]:outline-hidden [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-surface]:outline-hidden";

/// The loading-skeleton classes — the one branch of `chart.tsx` with no Recharts
/// dependency at all, so the one branch this container-only port can fully match.
const LOADING_BASE: &str = "flex aspect-video animate-pulse items-end justify-center gap-2 p-6";

/// Compose the full class string for a rendered (non-loading) chart container.
pub fn chart_variants(extra: &str) -> String {
    let mut out = String::with_capacity(BASE.len() + 32);
    out.push_str(BASE);
    if !extra.is_empty() {
        out.push(' ');
        out.push_str(extra);
    }
    out
}

/// Compose the full class string for the loading skeleton.
pub fn chart_loading_variants(extra: &str) -> String {
    let mut out = String::with_capacity(LOADING_BASE.len() + 32);
    out.push_str(LOADING_BASE);
    if !extra.is_empty() {
        out.push(' ');
        out.push_str(extra);
    }
    out
}

/// Seven bar heights for the loading skeleton. `chart.tsx` randomizes these per
/// render (`20 + Math.random() * 60`); the contract is the structure and class
/// list, not the exact animation, so this port uses a fixed, varied sequence
/// rather than pulling in a random-number dependency for cosmetic motion.
const LOADING_BAR_HEIGHTS: [u8; 7] = [45, 70, 35, 80, 55, 65, 40];

/// Props for [`Chart`].
#[derive(Props, Clone, PartialEq)]
pub struct ChartProps {
    /// Renders the loading skeleton instead of the chart container.
    #[props(default)]
    pub loading: bool,
    /// The `data-chart` id. Required — see the module doc comment on why this
    /// port does not attempt to replicate `useId()`'s auto-generation.
    pub id: String,
    /// Extra classes, appended last so a consumer can override.
    #[props(default)]
    pub class: String,
    /// Any other HTML attribute.
    #[props(extends = GlobalAttributes)]
    pub attributes: Vec<Attribute>,
    /// The chart's rendered content. This primitive has no charting runtime of
    /// its own — whatever draws the chart is the caller's responsibility.
    pub children: Element,
}

/// A chart container. Container/contract only — see the module doc comment.
#[component]
pub fn Chart(props: ChartProps) -> Element {
    if props.loading {
        return rsx! {
            div {
                "data-slot": "chart",
                "data-portal": "https://mzizi.dev/components/chart",
                "data-loading": "true",
                class: chart_loading_variants(&props.class),
                ..props.attributes,
                for height in LOADING_BAR_HEIGHTS {
                    div {
                        class: "flex-1 rounded-t bg-muted",
                        style: "height: {height}%",
                    }
                }
            }
        };
    }

    rsx! {
        div {
            "data-slot": "chart",
            "data-chart": "chart-{props.id}",
            class: chart_variants(&props.class),
            ..props.attributes,
            {props.children}
        }
    }
}
