// GENERATED — DO NOT EDIT.
//
// Copied verbatim from components/registry/n2-primitives/badge.rs by scripts/generate-rust-components.mjs.
// That file is the one a human edits; this is the copy `cargo package` can ship,
// because a tarball only carries files under the crate root.
//
// Regenerate with `pnpm rust:generate`. CI runs `pnpm rust:generate:check`,
// which fails if this copy and its source have drifted.

//! BADGE — N2 primitive, Mzizi Roots.
//!
//! The Rust sibling of `badge.tsx`, sharing its contract: the same six variants, the same
//! `data-slot` and `data-variant` attributes. This build is unstyled: it carries those hooks and
//! no class names, so a stylesheet (Mzizi's, or the adopter's own) decides how a badge looks. A
//! `class` passed in is a pass-through, written last, as given.
//!
//! A badge is not interactive on its own. When a consumer wraps it in a link, the link is the
//! target and the badge inherits its hit area.

use crate::node::{Node, render_to_string};

/// Visual treatment. Matches the `badge` contract's six variants.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum BadgeVariant {
    /// Solid primary fill.
    #[default]
    Default,
    /// Solid secondary fill.
    Secondary,
    /// Destructive state: error, revoked, failed.
    Destructive,
    /// Bordered, low-emphasis.
    Outline,
    /// No fill until hovered.
    Ghost,
    /// Renders as an inline text link.
    Link,
}

impl BadgeVariant {
    /// The `data-variant` value.
    #[must_use]
    pub const fn slug(self) -> &'static str {
        match self {
            Self::Default => "default",
            Self::Secondary => "secondary",
            Self::Destructive => "destructive",
            Self::Outline => "outline",
            Self::Ghost => "ghost",
            Self::Link => "link",
        }
    }
}

/// The props a render takes.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct RenderProps {
    /// Visual treatment.
    pub variant: BadgeVariant,
    /// Extra classes, passed through as the `class` attribute when not empty.
    pub class: String,
    /// The label text, escaped when written.
    pub text: String,
}

/// The badge as a node tree.
#[must_use]
pub fn node(props: &RenderProps) -> Node {
    let mut attrs = vec![
        ("data-slot", "badge"),
        ("data-portal", "https://mzizi.dev/components/badge"),
        ("data-variant", props.variant.slug()),
    ];
    if !props.class.is_empty() {
        attrs.push(("class", props.class.as_str()));
    }
    Node::element("span", &attrs, vec![Node::text(props.text.as_str())])
}

/// Render a badge to an HTML string, with no Dioxus and no WASM.
#[must_use]
pub fn render(props: &RenderProps) -> String {
    render_to_string(&[node(props)])
}
