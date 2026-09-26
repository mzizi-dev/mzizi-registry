//! LABEL — N2 primitive, Dioxus.
//!
//! The Rust sibling of `label.tsx`, which wraps Radix's `Label.Root`. The contract that
//! matters here is two states that come from OUTSIDE this element, not from its own
//! props: `group-data-[disabled=true]` (an ancestor group marked disabled) and
//! `peer-disabled` (a sibling form control that is itself disabled). Both are plain CSS
//! attribute/pseudo selectors, so they need no Rust-side state at all — the classes are
//! static and the browser does the rest, exactly as in the TypeScript.
//!
//! Written against the contract, NOT machine-translated from the `.tsx` (registry
//! issue #222, rule 1).
//!
//! `registry #223`: 31 dependents.

use dioxus::prelude::*;

/// The classes every label carries. No variants — `label.tsx` has none either, only the
/// `htmlFor` association (native `for`/`html_for` in Dioxus) and these two external-state
/// selectors.
const BASE: &str = "flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50";

/// Compose the full class string for a label.
pub fn label_variants(extra: &str) -> String {
    let mut out = String::with_capacity(BASE.len() + 32);
    out.push_str(BASE);
    if !extra.is_empty() {
        out.push(' ');
        out.push_str(extra);
    }
    out
}

/// Props for [`Label`].
#[derive(Props, Clone, PartialEq)]
pub struct LabelProps {
    /// Extra classes, appended last so a consumer can override.
    #[props(default)]
    pub class: String,
    /// Any other HTML attribute — `r#for`/`html_for` for the form-control association,
    /// `onclick`, and the rest.
    #[props(extends = GlobalAttributes, extends = label)]
    pub attributes: Vec<Attribute>,
    /// Label text or inline content.
    pub children: Element,
}

/// A form-control label.
///
/// ```ignore
/// rsx! { Label { r#for: "email", "Email address" } }
/// ```
#[component]
pub fn Label(props: LabelProps) -> Element {
    rsx! {
        label {
            "data-slot": "label",
            "data-portal": "https://mzizi.dev/components/label",
            class: label_variants(&props.class),
            ..props.attributes,
            {props.children}
        }
    }
}
