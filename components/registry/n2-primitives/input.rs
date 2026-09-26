//! INPUT — N2 primitive, Dioxus.
//!
//! The Rust sibling of `input.tsx`. No variants, no sub-components — one element, one
//! static class string, and the native `type` attribute. The class list is the whole
//! contract: pill radius (`rounded-full`) and a 48px touch target (`h-12`) per brand,
//! the `--ring` focus ring, and `aria-invalid` styling that keys off the browser's own
//! validation state rather than a prop.
//!
//! Written against the contract, NOT machine-translated from the `.tsx` (registry
//! issue #222, rule 1).
//!
//! `registry #223`: 43 dependents — the second-heaviest primitive in wave 1.

use dioxus::prelude::*;

/// The classes every input carries.
const BASE: &str = "h-12 w-full min-w-0 rounded-full border border-input bg-input/30 px-4 py-1 text-base transition-colors outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/20 md:text-sm dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40";

/// Compose the full class string for an input.
pub fn input_variants(extra: &str) -> String {
    let mut out = String::with_capacity(BASE.len() + 32);
    out.push_str(BASE);
    if !extra.is_empty() {
        out.push(' ');
        out.push_str(extra);
    }
    out
}

/// Props for [`Input`].
#[derive(Props, Clone, PartialEq)]
pub struct InputProps {
    /// Extra classes, appended last so a consumer can override.
    #[props(default)]
    pub class: String,
    /// Any other HTML attribute — `r#type`, `value`, `placeholder`, `disabled`,
    /// `aria-invalid`, and the rest. `type` is deliberately not a dedicated prop: the
    /// TypeScript passes it straight through too, and giving it special handling here
    /// would be a second place a new input type needs teaching.
    #[props(extends = GlobalAttributes, extends = input)]
    pub attributes: Vec<Attribute>,
}

/// A single-line text input.
///
/// ```ignore
/// rsx! { Input { r#type: "email", placeholder: "you@example.com" } }
/// ```
#[component]
pub fn Input(props: InputProps) -> Element {
    rsx! {
        input {
            "data-slot": "input",
            "data-portal": "https://mzizi.dev/components/input",
            class: input_variants(&props.class),
            ..props.attributes,
        }
    }
}
