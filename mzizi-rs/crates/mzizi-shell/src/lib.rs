//! Mzizi N7 shell for Rust — the app-chrome rung: header, nav, connectivity, theme, lifecycle.
//!
//! # Where the components are
//!
//! Not in this crate's `src/`. Each is a file under `components/registry/n7-shell/<name>.rs`,
//! beside the `.tsx` implementing the same contract for a JavaScript host, and this module
//! `#[path]`-includes it.
//!
//! # This is a first batch, not the whole node
//!
//! N7 has 16 components. Three are ported here. `app-switcher`, `nyuchi-header` and
//! `nyuchi-sidebar` depend on N2 primitives (`button`, `popover`, the shadcn `sidebar`
//! primitive) that have no Dioxus port yet — porting them first would mean writing throwaway
//! primitive stubs this crate does not own. `nyuchi-root-layout` wraps Next.js's `<html>`/
//! `<body>`, which is the App Router's job, not a portable shell component's; a Dioxus app's
//! root is `dioxus::launch`, not a registry component, so a straight port would be a fiction
//! that compiles. The remaining components are unstarted, tracked as the rest of N7.

#[path = "../../../../components/registry/n7-shell/nyuchi-connectivity-bar.rs"]
pub mod nyuchi_connectivity_bar;

#[path = "../../../../components/registry/n7-shell/nyuchi-update-prompt.rs"]
pub mod nyuchi_update_prompt;

#[path = "../../../../components/registry/n7-shell/nyuchi-deep-link-handler.rs"]
pub mod nyuchi_deep_link_handler;
