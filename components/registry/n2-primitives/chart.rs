//! CHART — N2 primitive, Mzizi Roots. Container and contract only.
//!
//! `chart.tsx` is a wrapper around Recharts, a JavaScript charting runtime: `ChartStyle` injects
//! `<style>` from a `ChartConfig`, and `ChartTooltipContent` and `ChartLegendContent` format
//! Recharts' own payload shapes. None of that has a Rust equivalent to port against, and registry
//! issue #223 ruled out reimplementing Recharts in Rust. So this build is the container-only port:
//! the `data-slot`, the `data-chart` id and the loading skeleton, which is plain markup.
//!
//! NOT ported: `ChartConfig`, `ChartStyle`, `ChartTooltip`, `ChartTooltipContent`, `ChartLegend`
//! and `ChartLegendContent`. A real charting backend is future work.
//!
//! This build is unstyled: no class names. The Recharts selectors the TypeScript carries are a
//! styling concern, so they are not written here. `id` is a required prop, because Mzizi Roots
//! has no `useId()` that guarantees per-instance uniqueness.
//!
//! Written against the contract, NOT machine-translated from the `.tsx` (registry issue #222,
//! rule 1).
//!
//! `registry #223`: the sixth and last primitive in wave 1.

use crate::node::{Node, render_to_string};

/// Seven bar heights for the loading skeleton, as a percentage of the chart's height. The
/// TypeScript randomises these per render; this build uses a fixed, varied sequence, so the markup
/// is stable and no random-number dependency is needed for cosmetic motion.
const LOADING_BAR_HEIGHTS: [u8; 7] = [45, 70, 35, 80, 55, 65, 40];

/// The props a chart render takes.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct RenderProps {
    /// Render the loading skeleton instead of the children.
    pub loading: bool,
    /// The chart's id. Written as `data-chart="chart-<id>"`.
    pub id: String,
    /// Extra classes, passed through as the `class` attribute when not empty.
    pub class: String,
    /// The chart's content. Not written while `loading`.
    pub children: Vec<Node>,
}

/// The chart as a node tree.
#[must_use]
pub fn node(props: &RenderProps) -> Node {
    if props.loading {
        let mut attrs = vec![
            ("data-slot", "chart"),
            ("data-portal", "https://mzizi.dev/components/chart"),
            ("data-state", "loading"),
            ("aria-busy", "true"),
        ];
        if !props.class.is_empty() {
            attrs.push(("class", props.class.as_str()));
        }
        let bars = LOADING_BAR_HEIGHTS
            .iter()
            .map(|height| {
                let style = format!("height: {height}%");
                Node::element(
                    "div",
                    &[
                        ("data-slot", "chart-bar"),
                        ("aria-hidden", "true"),
                        ("style", style.as_str()),
                    ],
                    vec![],
                )
            })
            .collect();
        return Node::element("div", &attrs, bars);
    }
    let data_chart = format!("chart-{}", props.id);
    let mut attrs = vec![("data-slot", "chart"), ("data-chart", data_chart.as_str())];
    if !props.class.is_empty() {
        attrs.push(("class", props.class.as_str()));
    }
    Node::element("div", &attrs, props.children.clone())
}

/// Render a chart to an HTML string, with no Dioxus and no WASM.
#[must_use]
pub fn render(props: &RenderProps) -> String {
    render_to_string(&[node(props)])
}
