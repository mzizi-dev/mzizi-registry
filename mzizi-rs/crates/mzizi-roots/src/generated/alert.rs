// GENERATED — DO NOT EDIT.
//
// Copied verbatim from components/registry/n2-primitives/alert.rs by scripts/generate-rust-components.mjs.
// That file is the one a human edits; this is the copy `cargo package` can ship,
// because a tarball only carries files under the crate root.
//
// Regenerate with `pnpm rust:generate`. CI runs `pnpm rust:generate:check`,
// which fails if this copy and its source have drifted.

//! ALERT — N2 primitive, Mzizi Roots.
//!
//! The Rust build of `contracts/ui/alert.contract.json`, beside `alert.tsx` and `alert.astro`:
//! a message with `role="alert"`, default or destructive, and its title, description and action
//! parts. This build is unstyled: it carries the semantic hooks a stylesheet keys off
//! (`data-slot`, `data-variant`) and the ARIA role, and no class names. A `class` passed in is a
//! pass-through for the adopter's own styling and is written last, as given.
//!
//! Written against the contract, NOT machine-translated from the `.tsx` (registry issue #222,
//! rule 1). The runtime is `mzizi_roots::node`: the component returns a tree and the tree is
//! serialised there, with every text node and attribute value escaped.

use crate::node::{Node, render_to_string};

/// The alert's variant. Its `data-variant` value is the slug.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
pub enum AlertVariant {
    /// The default message.
    #[default]
    Default,
    /// A destructive message.
    Destructive,
}

impl AlertVariant {
    /// The `data-variant` value.
    #[must_use]
    pub const fn slug(self) -> &'static str {
        match self {
            Self::Default => "default",
            Self::Destructive => "destructive",
        }
    }
}

/// The props a render takes.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct RenderProps {
    /// Default or destructive.
    pub variant: AlertVariant,
    /// Extra classes, passed through as the `class` attribute when not empty.
    pub class: String,
    /// The alert's parts: an icon, the title and description parts, an optional action.
    pub children: Vec<Node>,
}

/// The props for an alert part (title, description, action).
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct PartProps {
    /// Extra classes, passed through as the `class` attribute when not empty.
    pub class: String,
    /// The part's content.
    pub children: Vec<Node>,
}

/// One element with a `data-slot` and an optional pass-through class, around its children.
fn part(slot: &'static str, class: &str, children: Vec<Node>) -> Node {
    let mut attrs = vec![("data-slot", slot)];
    if !class.is_empty() {
        attrs.push(("class", class));
    }
    Node::element("div", &attrs, children)
}

/// The alert as a node tree.
#[must_use]
pub fn node(props: &RenderProps) -> Node {
    let mut attrs = vec![
        ("data-slot", "alert"),
        ("data-portal", "https://mzizi.dev/components/alert"),
        ("data-variant", props.variant.slug()),
        ("role", "alert"),
    ];
    if !props.class.is_empty() {
        attrs.push(("class", props.class.as_str()));
    }
    Node::element("div", &attrs, props.children.clone())
}

/// Render an alert to an HTML string, with no Dioxus and no WASM.
#[must_use]
pub fn render(props: &RenderProps) -> String {
    render_to_string(&[node(props)])
}

/// The alert's title as a node tree.
#[must_use]
pub fn render_title(props: &PartProps) -> Node {
    part("alert-title", &props.class, props.children.clone())
}

/// The alert's description as a node tree.
#[must_use]
pub fn render_description(props: &PartProps) -> Node {
    part("alert-description", &props.class, props.children.clone())
}

/// The alert's action as a node tree.
#[must_use]
pub fn render_action(props: &PartProps) -> Node {
    part("alert-action", &props.class, props.children.clone())
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
