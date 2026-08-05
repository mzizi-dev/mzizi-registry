//! Mzizi N1 design tokens for Rust.
//!
//! The values are NOT authored here. `components/registry/n1-tokens/nyuchi-tokens-rust.rs`
//! is written by `pnpm tokens:sync` from the same Supabase collections that emit the CSS
//! custom properties, the Swift file, the Kotlin file and the ArkTS file, and
//! `pnpm tokens:verify` fails the build when it drifts.
//!
//! That is N1's covenant made literal: design decisions are data, so adding a target means
//! adding an emitter, never re-authoring the palette. A hand-maintained Rust colour table
//! here would be the failure this crate exists to avoid — and the precedent is real, because
//! the platform generators that once carried their own hardcoded five-mineral map are why the
//! token node shipped a five-and-five palette against a seven-and-seven system.
//!
//! Included by path rather than copied for the same reason: one file, in the registry, beside
//! every other target's token artifact.

#[path = "../../../../components/registry/n1-tokens/nyuchi-tokens-rust.rs"]
mod generated;

pub use generated::*;
