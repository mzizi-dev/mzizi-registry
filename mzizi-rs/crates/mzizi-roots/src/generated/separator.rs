// GENERATED — DO NOT EDIT.
//
// Copied verbatim from components/registry/n2-primitives/separator.rs by scripts/generate-rust-components.mjs.
// That file is the one a human edits; this is the copy `cargo package` can ship,
// because a tarball only carries files under the crate root.
//
// Regenerate with `pnpm rust:generate`. CI runs `pnpm rust:generate:check`,
// which fails if this copy and its source have drifted.

//! SEPARATOR — N2 primitive, Mzizi Roots.
//!
//! The Rust sibling of `separator.tsx`, sharing its contract: the same `data-slot`, the same
//! `data-orientation` values Radix uses, and the same decorative and semantic roles. This build is
//! unstyled: no class names. A stylesheet sizes the rule from `data-orientation`. A `class` passed
//! in is a pass-through, written last, as given.

use crate::node::{Node, render_to_string};

/// Which axis the separator runs along.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum SeparatorOrientation {
    /// A horizontal rule.
    #[default]
    Horizontal,
    /// A vertical rule.
    Vertical,
}

impl SeparatorOrientation {
    /// The `data-orientation` value, matching Radix's own attribute name and values.
    #[must_use]
    pub const fn slug(self) -> &'static str {
        match self {
            Self::Horizontal => "horizontal",
            Self::Vertical => "vertical",
        }
    }
}

/// The props a separator render takes.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RenderProps {
    /// Which axis the rule runs along.
    pub orientation: SeparatorOrientation,
    /// Purely visual when `true` (the default): `role="none"`, nothing announced.
    pub decorative: bool,
    /// Extra classes, passed through as the `class` attribute when not empty.
    pub class: String,
}

impl Default for RenderProps {
    fn default() -> Self {
        Self {
            orientation: SeparatorOrientation::default(),
            decorative: true,
            class: String::new(),
        }
    }
}

/// The separator as a node tree.
#[must_use]
pub fn node(props: &RenderProps) -> Node {
    let role = if props.decorative {
        "none"
    } else {
        "separator"
    };
    let mut attrs = vec![
        ("data-slot", "separator"),
        ("data-portal", "https://mzizi.dev/components/separator"),
        ("data-orientation", props.orientation.slug()),
        ("role", role),
    ];
    // Only a semantic vertical rule states its orientation; a horizontal one is the ARIA default.
    if !props.decorative && props.orientation == SeparatorOrientation::Vertical {
        attrs.push(("aria-orientation", "vertical"));
    }
    if !props.class.is_empty() {
        attrs.push(("class", props.class.as_str()));
    }
    Node::element("div", &attrs, vec![])
}

/// Render a separator to an HTML string, with no Dioxus and no WASM.
#[must_use]
pub fn render(props: &RenderProps) -> String {
    render_to_string(&[node(props)])
}
