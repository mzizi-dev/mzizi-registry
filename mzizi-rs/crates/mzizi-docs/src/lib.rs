//! Mzizi N10 documentation for Rust — "the system describes itself."
//!
//! # Where the components are
//!
//! Not authored in this crate. Each is a file under
//! `components/registry/n10-documentation/<name>.rs`, beside the `.ts`/`.tsx`
//! implementing the same contract for a JavaScript host.
//!
//! `src/generated/` holds a COMMITTED copy of each, written by `pnpm rust:generate`
//! and checked by `pnpm rust:generate:check`. The copy is what makes this crate
//! publishable: `cargo package` collects only files under the package root, so a
//! `#[path]` reaching up into the registry ships a tarball that cannot build. Edit
//! the registry file; the copy is overwritten.
//!
//! # A theme across this node
//!
//! N10's components describe the ecosystem, so a stale literal here does not
//! merely go out of date — it becomes what the system TELLS people about itself.
//! `nyuchi-ai-context` is the sharp case: it opens by forbidding hardcoded counts
//! and then hardcodes the entire node list, which duly went stale at N10 while
//! the node set ran on to N12. Each port turns those literals into parameters.

#[path = "generated/nyuchi-ai-context.rs"]
pub mod nyuchi_ai_context;

#[path = "generated/nyuchi-docs-api.rs"]
pub mod nyuchi_docs_api;

#[path = "generated/nyuchi-changelog-renderer.rs"]
pub mod nyuchi_changelog_renderer;

#[path = "generated/nyuchi-docs-engine.rs"]
pub mod nyuchi_docs_engine;
