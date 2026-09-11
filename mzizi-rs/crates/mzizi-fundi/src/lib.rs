//! Mzizi N9 fundi for Rust — "failure is a learning event, not a user-facing
//! incident."
//!
//! # Where the components are
//!
//! Not authored in this crate. Each is a file under
//! `components/registry/n9-fundi/<name>.rs`, beside the `.ts` implementing the
//! same contract for a JavaScript host.
//!
//! `src/generated/` holds a COMMITTED copy of each, written by `pnpm rust:generate`
//! and checked by `pnpm rust:generate:check`. The copy is what makes this crate
//! publishable: `cargo package` collects only files under the package root, so a
//! `#[path]` reaching up into the registry ships a tarball that cannot build. Edit
//! the registry file; the copy is overwritten.
//!
//! # What is here, and what is emphatically not
//!
//! This crate holds the **client-side** rung: deciding whether a failure is worth
//! filing, shaping the issue, and learning which fixes have worked before. It is
//! what a consumer app installs so its own failures reach a tracker.
//!
//! The **healing loop itself** — the cron pass, the webhook ingest, the GitHub
//! automation — is the `fundi-tester` Worker in `mzizi-dev/agent-tools`, and it is
//! still TypeScript. Converting these registry components does not move it, and
//! saying so matters because `CLAUDE.md` §17 diagrams a loop ending in a draft
//! pull request while `heal.ts` files issues and `github.ts` has no
//! pull-request code at all.
//!
//! So: N9's registry surface is Rust as of this crate. N9's worker is not.

#[path = "generated/nyuchi-fundi.rs"]
pub mod nyuchi_fundi;

#[path = "generated/nyuchi-fundi-learning.rs"]
pub mod nyuchi_fundi_learning;

#[path = "generated/nyuchi-fundi-reporter.rs"]
pub mod nyuchi_fundi_reporter;
