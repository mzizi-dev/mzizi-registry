//! PROGRESS — N2 primitive, Mzizi Roots.
//!
//! The Rust sibling of `progress.tsx`, which wraps Radix's `Progress.Root` and `Indicator`.
//!
//! One thing here is a CONTRACT decision, not a translation: the TypeScript never spreads `value`
//! back onto `Progress.Root`, so Radix's `aria-valuenow` and `data-state` never see the real value
//! and every bar reports as indeterminate to assistive technology. Registry issue #223 requires
//! `role="progressbar"` with a working `aria-valuenow`, min and max, and a real indeterminate state.
//! So this build implements that contract, not the gap in the wrapper (registry issue #222, rule 1).
//!
//! Unstyled: the track and the indicator carry no class names. The indicator's fill is the one
//! inline style, `transform: translateX(...)`, because the fill is the value itself: without it a
//! bar cannot show its progress. A stylesheet decides the colours and sizes.

use crate::node::{Node, render_to_string};

/// Progress state, matching Radix's own `data-state` values and their derivation: no value at all
/// is indeterminate; a value at the max is complete; anything else is in progress.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum ProgressState {
    Indeterminate,
    Loading,
    Complete,
}

impl ProgressState {
    const fn slug(self) -> &'static str {
        match self {
            Self::Indeterminate => "indeterminate",
            Self::Loading => "loading",
            Self::Complete => "complete",
        }
    }
}

fn state_for(value: Option<u8>, max: u8) -> ProgressState {
    match value {
        None => ProgressState::Indeterminate,
        Some(v) if v >= max => ProgressState::Complete,
        Some(_) => ProgressState::Loading,
    }
}

/// The props a progress render takes.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RenderProps {
    /// Current value, 0 to `max`. `None` is the indeterminate state: no reading yet, not a `0`.
    pub value: Option<u8>,
    /// The value that counts as complete.
    pub max: u8,
    /// Extra classes, passed through as the `class` attribute when not empty.
    pub class: String,
}

impl Default for RenderProps {
    fn default() -> Self {
        Self {
            value: None,
            max: 100,
            class: String::new(),
        }
    }
}

/// The progress bar as a node tree.
#[must_use]
pub fn node(props: &RenderProps) -> Node {
    let state = state_for(props.value, props.max);
    let percent = props.value.unwrap_or(0).min(props.max);
    let transform = format!(
        "transform: translateX(-{}%);",
        100u16.saturating_sub(u16::from(percent))
    );
    let max = props.max.to_string();
    let value = props.value.map(|v| v.to_string());
    let mut attrs = vec![
        ("data-slot", "progress"),
        ("data-portal", "https://mzizi.dev/components/progress"),
        ("data-state", state.slug()),
    ];
    if let Some(v) = value.as_deref() {
        attrs.push(("data-value", v));
    }
    attrs.push(("data-max", max.as_str()));
    attrs.push(("role", "progressbar"));
    attrs.push(("aria-valuemin", "0"));
    attrs.push(("aria-valuemax", max.as_str()));
    if let Some(v) = value.as_deref() {
        attrs.push(("aria-valuenow", v));
    }
    if !props.class.is_empty() {
        attrs.push(("class", props.class.as_str()));
    }
    let indicator = Node::element(
        "div",
        &[
            ("data-slot", "progress-indicator"),
            ("data-state", state.slug()),
            ("style", transform.as_str()),
        ],
        vec![],
    );
    Node::element("div", &attrs, vec![indicator])
}

/// Render a progress bar to an HTML string, with no Dioxus and no WASM.
#[must_use]
pub fn render(props: &RenderProps) -> String {
    render_to_string(&[node(props)])
}
