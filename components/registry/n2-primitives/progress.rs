//! PROGRESS — N2 primitive, Dioxus.
//!
//! The Rust sibling of `progress.tsx`, which wraps Radix's `Progress.Root`/`Indicator`.
//!
//! One thing here is a CONTRACT decision, not a translation: `progress.tsx` destructures
//! `value` out of its own props and never spreads it back onto `ProgressPrimitive.Root`
//! — only onto the indicator's inline-style transform. Radix's own `aria-valuenow` and
//! `data-state` therefore never see the real value in the TypeScript today, which means
//! every progress bar reports as indeterminate to assistive technology regardless of its
//! visual fill. Registry issue #223 lists `role="progressbar"` with a working
//! `aria-valuenow`/min/max and a real indeterminate state as what this primitive HAS to
//! get right — so this port implements the working contract Radix intends, not the gap
//! in the current wrapper (registry issue #222, rule 1: written against the contract,
//! with the TypeScript as reference, not input).
//!
//! `registry #223`: 13 dependents.

use dioxus::prelude::*;

/// Progress state, matching Radix's own `data-state` values and their derivation:
/// no value at all is indeterminate; a value at the max is complete; anything else is
/// in progress.
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

/// The classes the outer track carries.
const TRACK: &str = "relative flex h-3 w-full items-center overflow-x-hidden rounded-full bg-muted";

/// The classes the fill indicator carries.
const INDICATOR: &str = "size-full flex-1 bg-primary transition-all";

/// Compose the full class string for the outer track.
pub fn progress_variants(extra: &str) -> String {
    let mut out = String::with_capacity(TRACK.len() + 32);
    out.push_str(TRACK);
    if !extra.is_empty() {
        out.push(' ');
        out.push_str(extra);
    }
    out
}

/// Props for [`Progress`].
#[derive(Props, Clone, PartialEq)]
pub struct ProgressProps {
    /// Current value, 0 to `max`. `None` renders the indeterminate state — a Radix
    /// progress bar with no value at all, not a `0`, which is a real (empty) reading.
    #[props(default)]
    pub value: Option<u8>,
    /// The value that counts as complete. Radix's own default.
    #[props(default = 100)]
    pub max: u8,
    /// Extra classes, appended last so a consumer can override.
    #[props(default)]
    pub class: String,
    /// Any other HTML attribute.
    #[props(extends = GlobalAttributes)]
    pub attributes: Vec<Attribute>,
}

/// A progress bar.
///
/// ```ignore
/// rsx! { Progress { value: 40 } }
/// rsx! { Progress {} } // indeterminate — no value yet
/// ```
#[component]
pub fn Progress(props: ProgressProps) -> Element {
    let state = state_for(props.value, props.max);
    let percent = props.value.unwrap_or(0).min(props.max);
    let transform = format!(
        "transform: translateX(-{}%);",
        100u16.saturating_sub(u16::from(percent))
    );

    rsx! {
        div {
            "data-slot": "progress",
            "data-portal": "https://mzizi.dev/components/progress",
            "data-state": state.slug(),
            "data-value": props.value.map(|v| v.to_string()),
            "data-max": "{props.max}",
            role: "progressbar",
            "aria-valuemin": "0",
            "aria-valuemax": "{props.max}",
            "aria-valuenow": props.value.map(|v| v.to_string()),
            class: progress_variants(&props.class),
            ..props.attributes,
            div {
                "data-slot": "progress-indicator",
                "data-state": state.slug(),
                class: INDICATOR,
                style: "{transform}",
            }
        }
    }
}
