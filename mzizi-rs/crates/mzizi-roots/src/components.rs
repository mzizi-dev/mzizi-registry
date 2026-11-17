//! The components that render through the Mzizi Roots core, with no Dioxus.
//!
//! Each module is the component's registry source, copied by `pnpm rust:generate` from
//! `components/registry/n2-primitives/<name>.rs`. Edit the registry file; the copy is overwritten.
//! Every component here is unstyled: it renders `data-slot`, `data-variant`, `data-size`,
//! `data-state` and ARIA, and no `class` attribute unless the caller passes one.

#[path = "generated/alert.rs"]
pub mod alert;

#[path = "generated/badge.rs"]
pub mod badge;

#[path = "generated/card.rs"]
pub mod card;

#[path = "generated/chart.rs"]
pub mod chart;

#[path = "generated/markdown-renderer.rs"]
pub mod markdown_renderer;

#[path = "generated/progress.rs"]
pub mod progress;

#[path = "generated/safe-area-frame.rs"]
pub mod safe_area_frame;

#[path = "generated/separator.rs"]
pub mod separator;

/// Every component here that exports a `CONTRACT`, with its registry name.
pub const CONTRACTS: &[(&str, &str)] = &[
    ("alert", alert::CONTRACT),
    ("card", card::CONTRACT),
    ("markdown-renderer", markdown_renderer::CONTRACT),
    ("safe-area-frame", safe_area_frame::CONTRACT),
];
