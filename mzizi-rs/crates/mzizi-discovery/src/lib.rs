//! Mzizi N11 discovery for Rust — "if the machine can't see it, it doesn't exist."
//!
//! # Where the components are
//!
//! Not in this crate's `src/`. Each is a file under
//! `components/registry/n11-discovery/<name>.rs`, beside the `.ts` implementing
//! the same contract for a JavaScript host, and this module `#[path]`-includes
//! it.
//!
//! # What is here
//!
//! The rung that makes a page legible to a machine: resolved page metadata and
//! Schema.org JSON-LD. The `.ts` returns a Next.js `Metadata` object; there is no
//! Next.js here, so the Rust side returns a plain resolved struct and can render
//! the `<head>` elements itself. Same division as N8, which builds an OTLP
//! request and lets the host send it.

#[path = "../../../../components/registry/n11-discovery/nyuchi-seo.rs"]
pub mod nyuchi_seo;
