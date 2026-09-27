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
//! N7 has 16 components. 12 are ported here. `app-switcher`, `mzizi-header` and
//! `mzizi-sidebar` depend on N2 primitives (`button`, `popover`, the shadcn `sidebar`
//! primitive) that have no Dioxus port yet — porting them first would mean writing throwaway
//! primitive stubs this crate does not own. `mzizi-root-layout` wraps Next.js's `<html>`/
//! `<body>`, which is the App Router's job, not a portable shell component's; a Dioxus app's
//! root is `dioxus::launch`, not a registry component, so a straight port would be a fiction
//! that compiles. Those four are the only ones left, and none are portable work this crate can
//! do on its own — they wait on N2.

#[path = "generated/mzizi-connectivity-bar.rs"]
pub mod mzizi_connectivity_bar;

#[path = "generated/mzizi-update-prompt.rs"]
pub mod mzizi_update_prompt;

#[path = "generated/mzizi-deep-link-handler.rs"]
pub mod mzizi_deep_link_handler;

#[path = "generated/mzizi-bottom-nav.rs"]
pub mod mzizi_bottom_nav;

#[path = "generated/mzizi-command-palette.rs"]
pub mod mzizi_command_palette;

#[path = "generated/mzizi-footer.rs"]
pub mod mzizi_footer;

#[path = "generated/mzizi-mini-app-runtime.rs"]
pub mod mzizi_mini_app_runtime;

#[path = "generated/mzizi-notification-center.rs"]
pub mod mzizi_notification_center;

#[path = "generated/mzizi-persistent-player.rs"]
pub mod mzizi_persistent_player;

#[path = "generated/mzizi-route-guard.rs"]
pub mod mzizi_route_guard;

#[path = "generated/mzizi-theme-provider.rs"]
pub mod mzizi_theme_provider;

#[path = "generated/mzizi-toast-provider.rs"]
pub mod mzizi_toast_provider;
