//! Mzizi N7 shell for Rust — the app-chrome rung: header, nav, connectivity, theme, lifecycle.
//!
//! # Where the components are
//!
//! Not authored in this crate. Each is a file under `components/registry/n7-shell/<name>.rs`,
//! beside the `.tsx` implementing the same contract for a JavaScript host.
//!
//! `src/generated/` holds a COMMITTED copy of each, written by `pnpm rust:generate`
//! and checked by `pnpm rust:generate:check`. The copy is what makes this crate
//! publishable: `cargo package` collects only files under the package root, so a
//! `#[path]` reaching up into the registry ships a tarball that cannot build. Edit
//! the registry file; the copy is overwritten.
//!
//! # 12 of 16, node closed except for the N2-blocked three
//!
//! N7 has 16 components. 12 are ported here. `app-switcher`, `nyuchi-header` and
//! `nyuchi-sidebar` depend on N2 primitives (`button`, `popover`, the shadcn `sidebar`
//! primitive) that have no Dioxus port yet — porting them first would mean writing throwaway
//! primitive stubs this crate does not own. `nyuchi-root-layout` wraps Next.js's `<html>`/
//! `<body>`, which is the App Router's job, not a portable shell component's; a Dioxus app's
//! root is `dioxus::launch`, not a registry component, so a straight port would be a fiction
//! that compiles. Those four are the only ones left, and none are portable work this crate can
//! do on its own — they wait on N2.

#[path = "generated/nyuchi-connectivity-bar.rs"]
pub mod nyuchi_connectivity_bar;

#[path = "generated/nyuchi-update-prompt.rs"]
pub mod nyuchi_update_prompt;

#[path = "generated/nyuchi-deep-link-handler.rs"]
pub mod nyuchi_deep_link_handler;

#[path = "generated/nyuchi-bottom-nav.rs"]
pub mod nyuchi_bottom_nav;

#[path = "generated/nyuchi-command-palette.rs"]
pub mod nyuchi_command_palette;

#[path = "generated/nyuchi-footer.rs"]
pub mod nyuchi_footer;

#[path = "generated/nyuchi-mini-app-runtime.rs"]
pub mod nyuchi_mini_app_runtime;

#[path = "generated/nyuchi-notification-center.rs"]
pub mod nyuchi_notification_center;

#[path = "generated/nyuchi-persistent-player.rs"]
pub mod nyuchi_persistent_player;

#[path = "generated/nyuchi-route-guard.rs"]
pub mod nyuchi_route_guard;

#[path = "generated/nyuchi-theme-provider.rs"]
pub mod nyuchi_theme_provider;

#[path = "generated/nyuchi-toast-provider.rs"]
pub mod nyuchi_toast_provider;
