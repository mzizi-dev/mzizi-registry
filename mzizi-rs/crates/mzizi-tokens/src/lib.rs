//! Mzizi N1 design tokens for Rust.
//!
//! The values are NOT authored here. `components/registry/n1-tokens/nyuchi-tokens-rust.rs`
//! is written by `pnpm tokens:sync` from `lib/tokens/palette.source.ts` — the canonical
//! palette in the mzizi-registry repo — which is the same source that emits the CSS custom
//! properties, the Swift file, the Kotlin file and the ArkTS file. `pnpm tokens:verify`
//! fails the build when any of them drifts from it.
//!
//! (That source was Supabase until 2026-09. It is not any more: per `docs/db-contents-rule.md`
//! the database holds no brand or primitive token data, so the palette lives in the repo and
//! the generator needs no credential to run.)
//!
//! All 21 families reach this crate — seven minerals, seven heritage tones and the seven
//! experimental — which is the set `/v1/brand` and the MCP serve. The experimental seven were
//! withheld from the platform targets until 2026-09; the crates registry, the shadcn registry
//! and the MCP are now required to publish the same palette.
//!
//! That is N1's covenant made literal: design decisions are data, so adding a target means
//! adding an emitter, never re-authoring the palette. A hand-maintained Rust colour table
//! here would be the failure this crate exists to avoid.
//!
//! The precedent is real and it is NOT safely in the past, which is why this paragraph is
//! written in the present tense. The hardcoded five-mineral map is why the token node shipped
//! a five-and-five palette against a seven-and-seven system — and one such map outlived that
//! fix by two more palette expansions, in `generateCSSVariables()` in
//! `nyuchi-tokens-typescript.ts`, emitting ten families of twenty-one until 2026-09.
//! `tokens:verify` could not see it: that gate covers the files it writes, and the hand-
//! maintained TypeScript emitter is not one of them. `__tests__/tokens-surface-parity.test.ts`
//! is the gate that can, and it covers all seven emitters including this one's source.
//!
//! Authored in the registry rather than here for the same reason: one file, beside every other
//! target's token artifact.
//!
//! `src/generated/` holds a COMMITTED copy of it, written by `pnpm rust:generate` and checked by
//! `pnpm rust:generate:check`. The copy is what makes this crate publishable: `cargo package`
//! collects only files under the package root, so a `#[path]` reaching up into the registry ships
//! a tarball that cannot build. Edit the registry file; the copy is overwritten.

#[path = "generated/nyuchi-tokens-rust.rs"]
mod generated;

pub use generated::*;
