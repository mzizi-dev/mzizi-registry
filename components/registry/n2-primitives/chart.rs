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

/// The escaping HTML writer `render` uses, inlined so this file installs on its own.
///
/// It is a copy of `mzizi-ui/src/html.rs`, which is the reference and carries the unit tests.
/// A test in `html.rs` holds the two to the same output on the five escaped characters and on
/// non-ASCII text, so the copies cannot drift without a test failing.
mod html {
    /// Escape `value` for text and double-quoted attribute values: `&`, `<`, `>`, `"` and `'`
    /// become decimal references; everything else, including non-ASCII, is written unchanged.
    fn escape_into(out: &mut String, value: &str) {
        for c in value.chars() {
            match c {
                '&' => out.push_str("&#38;"),
                '<' => out.push_str("&#60;"),
                '>' => out.push_str("&#62;"),
                '"' => out.push_str("&#34;"),
                '\'' => out.push_str("&#39;"),
                _ => out.push(c),
            }
        }
    }

    /// Write an opening tag with its attributes, in the order given. Values are escaped.
    pub(super) fn open(out: &mut String, tag: &str, attrs: &[(&str, &str)]) {
        out.push('<');
        out.push_str(tag);
        for (name, value) in attrs {
            out.push(' ');
            out.push_str(name);
            out.push_str("=\"");
            escape_into(out, value);
            out.push('"');
        }
        out.push('>');
    }

    /// Write a closing tag.
    pub(super) fn close(out: &mut String, tag: &str) {
        out.push_str("</");
        out.push_str(tag);
        out.push('>');
    }
}

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

/// The Dioxus-free render path: the props a [`render`] call takes, the same as [`ChartProps`].
///
/// `children` is HTML the caller has already rendered, and it is written as it is, not escaped:
/// it is the one unescaped input here. Build it with the other `render` functions, never from
/// untrusted text.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct RenderProps {
    /// Renders the loading skeleton instead of the chart container.
    pub loading: bool,
    /// The `data-chart` id, written as `chart-<id>`.
    pub id: String,
    /// Extra classes, appended last.
    pub class: String,
    /// The chart's content, already rendered HTML.
    pub children: String,
}

/// Render a chart container to an HTML string, with no Dioxus and no WASM.
///
/// Byte-identical to `dioxus-ssr` rendering [`Chart`] with the same props, for the cases
/// `mzizi-ui/tests/render_parity.rs` covers.
#[must_use]
pub fn render(props: &RenderProps) -> String {
    if props.loading {
        let class = chart_loading_variants(&props.class);
        let mut out = String::with_capacity(LOADING_BASE.len() + 512);
        html::open(
            &mut out,
            "div",
            &[
                ("data-slot", "chart"),
                ("data-portal", "https://mzizi.dev/components/chart"),
                ("data-loading", "true"),
                ("class", class.as_str()),
            ],
        );
        for height in LOADING_BAR_HEIGHTS {
            let style = format!("height: {height}%");
            html::open(
                &mut out,
                "div",
                &[
                    ("class", "flex-1 rounded-t bg-muted"),
                    ("style", style.as_str()),
                ],
            );
            html::close(&mut out, "div");
        }
        html::close(&mut out, "div");
        return out;
    }
    let class = chart_variants(&props.class);
    let data_chart = format!("chart-{}", props.id);
    let mut out = String::with_capacity(BASE.len() + props.children.len() + 128);
    html::open(
        &mut out,
        "div",
        &[
            ("data-slot", "chart"),
            ("data-chart", data_chart.as_str()),
            ("class", class.as_str()),
        ],
    );
    out.push_str(&props.children);
    html::close(&mut out, "div");
    out
}
