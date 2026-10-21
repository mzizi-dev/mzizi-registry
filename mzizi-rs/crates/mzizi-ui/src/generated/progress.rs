// GENERATED — DO NOT EDIT.
//
// Copied verbatim from components/registry/n2-primitives/progress.rs by scripts/generate-rust-components.mjs.
// That file is the one a human edits; this is the copy `cargo package` can ship,
// because a tarball only carries files under the crate root.
//
// Regenerate with `pnpm rust:generate`. CI runs `pnpm rust:generate:check`,
// which fails if this copy and its source have drifted.

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

/// The Dioxus-free render path: the props a [`render`] call takes, the same as [`ProgressProps`].
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RenderProps {
    /// Current value, 0 to `max`. `None` is the indeterminate state.
    pub value: Option<u8>,
    /// The value that counts as complete.
    pub max: u8,
    /// Extra classes, appended last.
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

/// Render a progress bar to an HTML string, with no Dioxus and no WASM.
///
/// Byte-identical to `dioxus-ssr` rendering [`Progress`] with the same props, for the cases
/// `mzizi-ui/tests/render_parity.rs` covers.
#[must_use]
pub fn render(props: &RenderProps) -> String {
    let state = state_for(props.value, props.max);
    let percent = props.value.unwrap_or(0).min(props.max);
    let transform = format!(
        "transform: translateX(-{}%);",
        100u16.saturating_sub(u16::from(percent))
    );
    let class = progress_variants(&props.class);
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
    attrs.push(("class", class.as_str()));
    let mut out = String::with_capacity(TRACK.len() + INDICATOR.len() + 256);
    html::open(&mut out, "div", &attrs);
    html::open(
        &mut out,
        "div",
        &[
            ("data-slot", "progress-indicator"),
            ("data-state", state.slug()),
            ("class", INDICATOR),
            ("style", transform.as_str()),
        ],
    );
    html::close(&mut out, "div");
    html::close(&mut out, "div");
    out
}
