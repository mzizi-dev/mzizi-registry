//! Mzizi Roots, the UI side — one dependency for Mzizi's Dioxus components and tokens.
//!
//! Mzizi Roots is the Rust build of Mzizi's own components (`docs/roots/RFC-roots.md` in the
//! registry). The components live in one crate per node of the registry, and this crate
//! re-exports them, each behind a feature:
//!
//! | Module    | Crate          | Node             | Feature           |
//! | --------- | -------------- | ---------------- | ----------------- |
//! | [`tokens`] | `mzizi-tokens` | N1 tokens        | always on         |
//! | `ui`      | `mzizi-ui`     | N2 primitives    | `ui` (default)    |
//! | `brand`   | `mzizi-brand`  | N3 brand         | `brand` (default) |
//! | `shell`   | `mzizi-shell`  | N7 app shell     | `shell` (default) |
//!
//! Take only what you use with `default-features = false`:
//!
//! ```toml
//! mzizi-roots = { version = "0.2", default-features = false, features = ["brand"] }
//! ```
//!
//! The server-side components are in `mzizi-roots-server`.
//!
//! ```
//! // The palette is always available.
//! assert_eq!(mzizi_roots::tokens::COBALT_DARK, "#00B0FF");
//!
//! // With the default features, every brand component and its contract.
//! # #[cfg(feature = "brand")]
//! # {
//! use mzizi_roots::brand::{AlertSeverity, CONTRACTS};
//! assert_eq!(AlertSeverity::Severe.label(), "Severe");
//! assert!(CONTRACTS.iter().all(|(_, c)| c.starts_with("contract")));
//! # }
//! ```

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
