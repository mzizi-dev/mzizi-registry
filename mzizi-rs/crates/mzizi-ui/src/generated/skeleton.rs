// GENERATED — DO NOT EDIT.
//
// Copied verbatim from components/registry/n2-primitives/skeleton.rs by scripts/generate-rust-components.mjs.
// That file is the one a human edits; this is the copy `cargo package` can ship,
// because a tarball only carries files under the crate root.
//
// Regenerate with `pnpm rust:generate`. CI runs `pnpm rust:generate:check`,
// which fails if this copy and its source have drifted.

//! SKELETON — N2 primitive, Dioxus.
//!
//! The Rust build of `contracts/ui/skeleton.contract.json`, beside `skeleton.tsx` and
//! `skeleton.astro`: a loading placeholder on the `muted` token with the 17px card-scale
//! corner, sized by `class`. The Dashboard Standard skeleton is `app-skeleton`.
//!
//! Written against the contract, NOT machine-translated from the `.tsx` (registry issue #222,
//! rule 1).

use dioxus::prelude::*;

use crate::html;

/// The classes every skeleton carries.
const BASE: &str = "animate-pulse rounded-[var(--radius-xl,17px)] bg-muted";

/// Compose the full class string for a skeleton.
#[must_use]
pub fn skeleton_variants(extra: &str) -> String {
    if extra.is_empty() {
        BASE.to_owned()
    } else {
        format!("{BASE} {extra}")
    }
}

/// Props for [`Skeleton`].
#[derive(Props, Clone, PartialEq)]
pub struct SkeletonProps {
    /// Sizing classes (`h-10 w-full`), appended last.
    #[props(default)]
    pub class: String,
    /// Any other attribute.
    #[props(extends = GlobalAttributes)]
    pub attributes: Vec<Attribute>,
}

/// A pulsing placeholder for content that is loading.
#[component]
pub fn Skeleton(props: SkeletonProps) -> Element {
    rsx! {
        div {
            "data-slot": "skeleton",
            "data-portal": "https://mzizi.dev/components/skeleton",
            class: skeleton_variants(&props.class),
            ..props.attributes,
        }
    }
}

/// The Dioxus-free render path: the props a [`render`] call takes.
///
/// `class` is the only prop the contract declares, so it is the only one here. The Dioxus
/// [`SkeletonProps`] also carries free-form attributes; those have no HTML-string form yet
/// and are not part of this path.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct RenderProps {
    /// Sizing classes (`h-10 w-full`), appended last, as [`skeleton_variants`] does.
    pub class: String,
}

/// Render a skeleton to an HTML string, with no Dioxus and no WASM.
///
/// Byte-identical to `dioxus-ssr` rendering [`Skeleton`] with the same `class`: the same
/// attributes in the same order, the same escaping. `tests/render_parity.rs` holds it to that.
#[must_use]
pub fn render(props: &RenderProps) -> String {
    let class = skeleton_variants(&props.class);
    let mut out = String::with_capacity(160 + class.len());
    html::open(
        &mut out,
        "div",
        &[
            ("data-slot", "skeleton"),
            ("data-portal", "https://mzizi.dev/components/skeleton"),
            ("class", &class),
        ],
    );
    html::close(&mut out, "div");
    out
}

/// The contract this build implements, copied by `pnpm contracts:sync` from
/// `contracts/ui/skeleton.contract.json`, the one contract the Astro, React and Rust builds
/// share: edit the contract file, never this copy. `tests/contracts_json.rs` renders every
/// state the contract declares and evaluates every clause and check against the markup.
pub const CONTRACT: &str = r#"contract
  slot is "skeleton"
  portal is "https://mzizi.dev/components/skeleton"
  class contains "animate-pulse"
  class contains "bg-muted"
end"#;
