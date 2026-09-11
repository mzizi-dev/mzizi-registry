//! Mzizi N2 primitives for Dioxus — the Rust path for the component registry.
//!
//! WHERE THE COMPONENTS ARE.
//!
//! Not authored in this crate. Every primitive is a file under
//! `components/registry/n2-primitives/<name>.rs`, beside the `.tsx` that implements the same
//! contract for React. One component, one name, one place — the registry — with this crate as
//! the thing that compiles it.
//!
//! `src/generated/` holds a COMMITTED copy of each, written by `pnpm rust:generate`
//! and checked by `pnpm rust:generate:check`. The copy is what makes this crate
//! publishable: `cargo package` collects only files under the package root, so a
//! `#[path]` reaching up into the registry ships a tarball that cannot build. Edit
//! the registry file; the copy is overwritten.
//!
//! That placement is what makes `/api/v1/rs/{name}` and `/api/v1/ui/{name}` two views of one
//! component rather than two components, and it is why `cargo check` is a registry gate and
//! not just a crate's own business.
//!
//! EACH FILE IS SELF-CONTAINED, DELIBERATELY.
//!
//! No shared `variants` helper, no internal prelude. A Rust `match` on a variant enum is the
//! whole of what `class-variance-authority` does in the TypeScript — exhaustively checked at
//! compile time, with no dependency — so a component needs nothing from its neighbours. A
//! shared helper would make every file unreadable on its own, which is the property that
//! makes a registry component installable in the first place (CLAUDE.md §15.6).
//!
//! DISTRIBUTION IS THE CRATE, NOT A FILE COPY.
//!
//! `npx shadcn add` copies a `.tsx` into a consumer's project. Rust has no equivalent and
//! does not need one: a Dioxus consumer takes `mzizi-ui` as a dependency (CLAUDE.md §8.9).
//! `/api/v1/rs/{name}` serves the source to READ — for an agent, a reviewer, or someone
//! porting — never as an install path.

#[path = "generated/button.rs"]
pub mod button;

#[path = "generated/badge.rs"]
pub mod badge;

#[path = "generated/card.rs"]
pub mod card;

pub use badge::{Badge, BadgeProps, BadgeVariant, badge_variants};
pub use button::{Button, ButtonProps, ButtonSize, ButtonVariant, button_variants};
pub use card::{Card, CardContent, CardFooter, CardHeader, CardTitle};

/// The N1 token module, re-exported so a consumer takes one dependency.
pub use mzizi_tokens as tokens;
