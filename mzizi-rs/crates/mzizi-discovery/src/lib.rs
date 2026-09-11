//! Mzizi N11 discovery for Rust — "if the machine can't see it, it doesn't exist."
//!
//! # Where the components are
//!
//! Not authored in this crate. Each is a file under
//! `components/registry/n11-discovery/<name>.rs`, beside the `.ts` implementing
//! the same contract for a JavaScript host.
//!
//! `src/generated/` holds a COMMITTED copy of each, written by `pnpm rust:generate`
//! and checked by `pnpm rust:generate:check`. The copy is what makes this crate
//! publishable: `cargo package` collects only files under the package root, so a
//! `#[path]` reaching up into the registry ships a tarball that cannot build. Edit
//! the registry file; the copy is overwritten.
//!
//! # What is here
//!
//! The rung that makes a page legible to a machine: resolved page metadata and
//! Schema.org JSON-LD. The `.ts` returns a Next.js `Metadata` object; there is no
//! Next.js here, so the Rust side returns a plain resolved struct and can render
//! the `<head>` elements itself. Same division as N8, which builds an OTLP
//! request and lets the host send it.

#[path = "generated/nyuchi-seo.rs"]
pub mod nyuchi_seo;
