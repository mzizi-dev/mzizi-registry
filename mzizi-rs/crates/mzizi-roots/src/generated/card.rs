// GENERATED — DO NOT EDIT.
//
// Copied verbatim from components/registry/n2-primitives/card.rs by scripts/generate-rust-components.mjs.
// That file is the one a human edits; this is the copy `cargo package` can ship,
// because a tarball only carries files under the crate root.
//
// Regenerate with `pnpm rust:generate`. CI runs `pnpm rust:generate:check`,
// which fails if this copy and its source have drifted.

//! CARD — N2 primitive, Mzizi Roots.
//!
//! The Rust sibling of `card.tsx`, sharing its contract: the same seven slots and the same
//! `data-slot` names, and the same built-in loading skeleton. This build is unstyled: it carries
//! the hooks a stylesheet keys off (`data-slot`, `data-size`, `data-state`, ARIA) and no class
//! names. A `class` passed in is a pass-through for the adopter's own styling, written last.
//!
//! The card is the most composed primitive in the system. A consumer composes `header`, `title`,
//! `content` and the other slots, and every slot is a `data-slot` element a stylesheet can target.

use crate::node::{Node, render_to_string};

/// Card density, written as `data-size`.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum CardSize {
    /// Standard padding and gaps.
    #[default]
    Default,
    /// Tighter padding and gaps.
    Sm,
}

impl CardSize {
    /// The `data-size` value.
    #[must_use]
    pub const fn slug(self) -> &'static str {
        match self {
            Self::Default => "default",
            Self::Sm => "sm",
        }
    }
}

/// The props a card render takes.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct RenderProps {
    /// Density.
    pub size: CardSize,
    /// Render the built-in skeleton instead of the children.
    pub loading: bool,
    /// Extra classes, passed through as the `class` attribute when not empty.
    pub class: String,
    /// The card's slots, as nodes. Not written while `loading`.
    pub children: Vec<Node>,
}

/// The props for a card slot (header, title, description, action, content, footer).
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct SlotProps {
    /// Extra classes, passed through as the `class` attribute when not empty.
    pub class: String,
    /// The slot's content.
    pub children: Vec<Node>,
}

/// One element with a `data-slot` and an optional pass-through class, around its children.
fn slot(name: &'static str, class: &str, children: Vec<Node>) -> Node {
    let mut attrs = vec![("data-slot", name)];
    if !class.is_empty() {
        attrs.push(("class", class));
    }
    Node::element("div", &attrs, children)
}

/// The card as a node tree.
#[must_use]
pub fn node(props: &RenderProps) -> Node {
    if props.loading {
        let mut attrs = vec![
            ("data-slot", "card"),
            ("data-portal", "https://mzizi.dev/components/card"),
            ("data-size", props.size.slug()),
            ("data-loading", "true"),
            ("aria-busy", "true"),
        ];
        if !props.class.is_empty() {
            attrs.push(("class", props.class.as_str()));
        }
        let bars = (0..3)
            .map(|_| {
                Node::element(
                    "div",
                    &[("data-slot", "card-skeleton"), ("aria-hidden", "true")],
                    vec![],
                )
            })
            .collect();
        return Node::element("div", &attrs, bars);
    }
    let mut attrs = vec![("data-slot", "card"), ("data-size", props.size.slug())];
    if !props.class.is_empty() {
        attrs.push(("class", props.class.as_str()));
    }
    Node::element("div", &attrs, props.children.clone())
}

/// Render a card to an HTML string, with no Dioxus and no WASM.
#[must_use]
pub fn render(props: &RenderProps) -> String {
    render_to_string(&[node(props)])
}

/// A card's header as a node tree.
#[must_use]
pub fn render_header(props: &SlotProps) -> Node {
    slot("card-header", &props.class, props.children.clone())
}

/// A card's title as a node tree.
#[must_use]
pub fn render_title(props: &SlotProps) -> Node {
    slot("card-title", &props.class, props.children.clone())
}

/// A card's description as a node tree.
#[must_use]
pub fn render_description(props: &SlotProps) -> Node {
    slot("card-description", &props.class, props.children.clone())
}

/// A card's action as a node tree.
#[must_use]
pub fn render_action(props: &SlotProps) -> Node {
    slot("card-action", &props.class, props.children.clone())
}

/// A card's content as a node tree.
#[must_use]
pub fn render_content(props: &SlotProps) -> Node {
    slot("card-content", &props.class, props.children.clone())
}

/// A card's footer as a node tree.
#[must_use]
pub fn render_footer(props: &SlotProps) -> Node {
    slot("card-footer", &props.class, props.children.clone())
}

/// The contract this build implements, copied by `pnpm contracts:sync` from
/// `contracts/ui/card.contract.json`, the one contract the Astro, React and Rust builds
/// share: edit the contract file, never this copy.
pub const CONTRACT: &str = r#"contract
  slot is "card"
  class contains "bg-card"
  class contains "rounded-[var(--radius-lg,14px)]"
  when default shows div "Body"
  when sm slot is "card"
  when loading class contains "animate-pulse"
end"#;
