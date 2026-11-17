//! Mzizi Roots, the UI side: the Dioxus-free runtime core, and the umbrella over the Dioxus
//! components still in the node crates.
//!
//! Mzizi Roots is the Rust build of Mzizi's own components. Its core is this crate, with no
//! Dioxus and no renderer:
//!
//! - [`node`]: the element tree (`Node`: an element with a tag, ordered attributes and children;
//!   text; a fragment) and [`node::render_to_string`], which escapes every text node and attribute
//!   value. It is the language's own node shape (`compiler/src/render.rs` in `mzizi-dev/mzizi`), so
//!   a component written in `.mz` and one written in Rust produce the same tree.
//! - [`components`]: the components that already render without Dioxus, each unstyled: they carry
//!   `data-slot`, `data-variant`, `data-size`, `data-state` and ARIA, and no class names.
//!
//! The other components still live in the node crates, behind features, until they move onto the
//! core. Take only what you use with `default-features = false`:
//!
//! ```toml
//! mzizi-roots = { version = "0.7", default-features = false }
//! ```
//!
//! ```
//! use mzizi_roots::node::{Node, render_to_string};
//!
//! let alert = Node::element("div", &[("role", "alert")], vec![Node::text("Saved <once>")]);
//! assert_eq!(
//!     render_to_string(&[alert]),
//!     "<div role=\"alert\">Saved &#60;once&#62;</div>"
//! );
//! ```

pub mod components;
pub mod node;

pub use node::{Node, escape, render_to_string};

/// N1 design tokens: the Mzizi palette and scales as Rust consts (`mzizi-tokens`).
pub use mzizi_tokens as tokens;

/// N2 primitives for Dioxus: button, badge, card and the rest (`mzizi-ui`).
#[cfg(feature = "ui")]
pub use mzizi_ui as ui;

/// N3 brand components for Dioxus, each with a contract (`mzizi-brand`).
#[cfg(feature = "brand")]
pub use mzizi_brand as brand;

/// N7 app shell for Dioxus: navigation, footer, toasts, theme and lifecycle (`mzizi-shell`).
#[cfg(feature = "shell")]
pub use mzizi_shell as shell;
