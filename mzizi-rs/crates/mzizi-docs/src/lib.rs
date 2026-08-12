//! Mzizi N10 documentation for Rust — "the system describes itself."
//!
//! # Where the components are
//!
//! Not in this crate's `src/`. Each is a file under
//! `components/registry/n10-documentation/<name>.rs`, beside the `.ts`/`.tsx`
//! implementing the same contract for a JavaScript host, and this module
//! `#[path]`-includes it.
//!
//! # A theme across this node
//!
//! N10's components describe the ecosystem, so a stale literal here does not
//! merely go out of date — it becomes what the system TELLS people about itself.
//! `nyuchi-ai-context` is the sharp case: it opens by forbidding hardcoded counts
//! and then hardcodes the entire node list, which duly went stale at N10 while
//! the node set ran on to N12. Each port turns those literals into parameters.

#[path = "../../../../components/registry/n10-documentation/nyuchi-ai-context.rs"]
pub mod nyuchi_ai_context;

#[path = "../../../../components/registry/n10-documentation/nyuchi-docs-api.rs"]
pub mod nyuchi_docs_api;

#[path = "../../../../components/registry/n10-documentation/nyuchi-changelog-renderer.rs"]
pub mod nyuchi_changelog_renderer;

#[path = "../../../../components/registry/n10-documentation/nyuchi-docs-engine.rs"]
pub mod nyuchi_docs_engine;
