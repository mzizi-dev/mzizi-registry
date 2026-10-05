// GENERATED — DO NOT EDIT.
//
// Copied verbatim from components/registry/n2-primitives/alert.rs by scripts/generate-rust-components.mjs.
// That file is the one a human edits; this is the copy `cargo package` can ship,
// because a tarball only carries files under the crate root.
//
// Regenerate with `pnpm rust:generate`. CI runs `pnpm rust:generate:check`,
// which fails if this copy and its source have drifted.

//! ALERT — N2 primitive, Dioxus.
//!
//! The Rust build of `contracts/ui/alert.contract.json`, beside `alert.tsx` and `alert.astro`:
//! a message with `role="alert"`, default or destructive, and its title, description and
//! action parts. Danger reads only the destructive token, never a brand colour.
//!
//! Written against the contract, NOT machine-translated from the `.tsx` (registry issue #222,
//! rule 1).

use dioxus::prelude::*;

/// The classes every alert carries.
const BASE: &str = "grid gap-0.5 rounded-[var(--radius-lg,14px)] border px-4 py-3 text-left text-sm has-data-[slot=alert-action]:relative has-data-[slot=alert-action]:pr-18 has-[>svg]:grid-cols-[auto_1fr] has-[>svg]:gap-x-2.5 *:[svg]:row-span-2 *:[svg]:translate-y-0.5 *:[svg]:text-current *:[svg:not([class*='size-'])]:size-4 w-full relative group/alert";

/// The alert's variant.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
pub enum AlertVariant {
    /// The card surface.
    #[default]
    Default,
    /// Destructive text on the card surface.
    Destructive,
}

impl AlertVariant {
    fn classes(self) -> &'static str {
        match self {
            Self::Default => "bg-card text-card-foreground",
            Self::Destructive => {
                "text-destructive bg-card *:data-[slot=alert-description]:text-destructive/90 *:[svg]:text-current"
            }
        }
    }
}

/// Compose the full class string for an alert.
#[must_use]
pub fn alert_variants(variant: AlertVariant, extra: &str) -> String {
    let mut out = format!("{BASE} {}", variant.classes());
    if !extra.is_empty() {
        out.push(' ');
        out.push_str(extra);
    }
    out
}

fn join(base: &str, extra: &str) -> String {
    if extra.is_empty() {
        base.to_owned()
    } else {
        format!("{base} {extra}")
    }
}

/// Props for [`Alert`].
#[derive(Props, Clone, PartialEq)]
pub struct AlertProps {
    /// Default or destructive.
    #[props(default)]
    pub variant: AlertVariant,
    /// Extra classes, appended last.
    #[props(default)]
    pub class: String,
    /// Any other attribute.
    #[props(extends = GlobalAttributes)]
    pub attributes: Vec<Attribute>,
    /// An icon, the title and description parts, an optional action.
    pub children: Element,
}

/// A message announced with `role="alert"`.
#[component]
pub fn Alert(props: AlertProps) -> Element {
    rsx! {
        div {
            "data-slot": "alert",
            "data-portal": "https://mzizi.dev/components/alert",
            role: "alert",
            class: alert_variants(props.variant, &props.class),
            ..props.attributes,
            {props.children}
        }
    }
}

/// Props shared by the alert's parts.
#[derive(Props, Clone, PartialEq)]
pub struct AlertPartProps {
    /// Extra classes, appended last.
    #[props(default)]
    pub class: String,
    /// Any other attribute.
    #[props(extends = GlobalAttributes)]
    pub attributes: Vec<Attribute>,
    /// The part's content.
    pub children: Element,
}

/// The alert's heading line.
#[component]
pub fn AlertTitle(props: AlertPartProps) -> Element {
    rsx! {
        div {
            "data-slot": "alert-title",
            class: join("font-medium group-has-[>svg]/alert:col-start-2 hover:text-foreground [&_a]:underline [&_a]:underline-offset-3 [&_a]:transition-colors", &props.class),
            ..props.attributes,
            {props.children}
        }
    }
}

/// The alert's description.
#[component]
pub fn AlertDescription(props: AlertPartProps) -> Element {
    rsx! {
        div {
            "data-slot": "alert-description",
            class: join("text-sm text-balance text-muted-foreground hover:text-foreground md:text-pretty [&_a]:underline [&_a]:underline-offset-3 [&_a]:transition-colors [&_p:not(:last-child)]:mb-4", &props.class),
            ..props.attributes,
            {props.children}
        }
    }
}

/// An action pinned to the alert's top right.
#[component]
pub fn AlertAction(props: AlertPartProps) -> Element {
    rsx! {
        div {
            "data-slot": "alert-action",
            class: join("absolute top-2.5 right-3", &props.class),
            ..props.attributes,
            {props.children}
        }
    }
}

/// The contract this build implements, copied by `pnpm contracts:sync` from
/// `contracts/ui/alert.contract.json`, the one contract the Astro, React and Rust builds
/// share: edit the contract file, never this copy. `tests/contracts_json.rs` renders every
/// state the contract declares and evaluates every clause and check against the markup.
pub const CONTRACT: &str = r#"contract
  slot is "alert"
  role is "alert"
  portal is "https://mzizi.dev/components/alert"
  class contains "bg-card"
  when default shows div "Heads up"
  when destructive class contains "text-destructive"
end"#;
