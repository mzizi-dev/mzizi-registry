//! Mzizi N3 brand components for Dioxus — the first Mzizi Roots batch.
//!
//! # What Mzizi Roots is
//!
//! Mzizi's own branded components, converted to Rust: UI components in Dioxus and server
//! components in host-agnostic Rust. `docs/roots/RFC-roots.md` in the registry is the plan;
//! this crate is its first batch. The React siblings keep working and are no longer where new
//! work goes.
//!
//! # Where the components are
//!
//! Not authored in this crate. Each is a file under `components/registry/n3-brand/<name>.rs`,
//! beside the `.tsx` that implements the same contract for React. `src/generated/` holds a
//! COMMITTED copy of each, written by `pnpm rust:generate` and checked by
//! `pnpm rust:generate:check`, because `cargo package` collects only files under the package
//! root. Edit the registry file; the copy is overwritten.
//!
//! # Every component carries a contract
//!
//! Each module exports `CONTRACT`: a `contract … end` block in the clause grammar of the Mzizi
//! language (mzizi-dev/mzizi `design/RFC-0006-contracts.md`) — its slot, its role, its touch
//! floors, its variant tables. `tests/contract.rs` renders each component with `dioxus-ssr` and
//! evaluates every clause against the markup, failing on any clause it cannot evaluate rather
//! than passing it. The same text is what `mz contract` will read once the language lowers to
//! Rust.
//!
//! # What these components do not depend on
//!
//! - **The harness.** `useMziziHarness` gives the `.tsx` siblings a logger, motion config and a
//!   live region. Here the one bit a component branches on — `prefers_reduced_motion` — is a
//!   prop, as in `mzizi-shell`, and logging is the host's.
//! - **An icon set.** Where the `.tsx` takes a Lucide component, the Rust takes an
//!   [`Element`](dioxus::prelude::Element) the host renders.
//! - **Each other.** Every file is self-contained, as in `mzizi-ui`, so each stays readable and
//!   portable on its own.

#[path = "generated/mzizi-alert-banner.rs"]
pub mod mzizi_alert_banner;

#[path = "generated/mzizi-avatar-stack.rs"]
pub mod mzizi_avatar_stack;

#[path = "generated/mzizi-cover-header.rs"]
pub mod mzizi_cover_header;

#[path = "generated/mzizi-empty-state.rs"]
pub mod mzizi_empty_state;

#[path = "generated/mzizi-escalation-card.rs"]
pub mod mzizi_escalation_card;

#[path = "generated/mzizi-gauge-card.rs"]
pub mod mzizi_gauge_card;

#[path = "generated/mzizi-hero-stat.rs"]
pub mod mzizi_hero_stat;

#[path = "generated/mzizi-meta-tile.rs"]
pub mod mzizi_meta_tile;

#[path = "generated/mzizi-stats-row.rs"]
pub mod mzizi_stats_row;

#[path = "generated/mzizi-success-screen.rs"]
pub mod mzizi_success_screen;

#[path = "generated/mzizi-suitability-card.rs"]
pub mod mzizi_suitability_card;

#[path = "generated/mzizi-user-card.rs"]
pub mod mzizi_user_card;

pub use mzizi_alert_banner::{AlertSeverity, MziziAlertBanner, MziziAlertBannerProps};
pub use mzizi_avatar_stack::{
    AvatarPerson, AvatarStackSize, MziziAvatarStack, MziziAvatarStackProps,
};
pub use mzizi_cover_header::{AvatarShape, CoverHeight, MziziCoverHeader, MziziCoverHeaderProps};
pub use mzizi_empty_state::{
    EmptyStateAction, EmptyStateDensity, MziziEmptyState, MziziEmptyStateProps,
};
pub use mzizi_escalation_card::{EscalationOption, MziziEscalationCard, MziziEscalationCardProps};
pub use mzizi_gauge_card::{GaugeMineral, MziziGaugeCard, MziziGaugeCardProps};
pub use mzizi_hero_stat::{MziziHeroStat, MziziHeroStatProps, SecondaryStat};
pub use mzizi_meta_tile::{MetaDate, MziziMetaTile, MziziMetaTileProps};
pub use mzizi_stats_row::{
    MziziStatsRow, MziziStatsRowProps, StatItem, StatsColumns, StatsLayout, TrendDirection,
};
pub use mzizi_success_screen::{MziziSuccessScreen, MziziSuccessScreenProps, SuccessAction};
pub use mzizi_suitability_card::{
    MziziSuitabilityCard, MziziSuitabilityCardProps, SuitabilityLevel,
};
pub use mzizi_user_card::{MziziUserCard, MziziUserCardProps};

/// Every component in this crate with its registry name and its contract, in registry order.
///
/// The registry name is the one `/v1/rs/{name}` and `/v1/ui/{name}` answer to.
pub const CONTRACTS: &[(&str, &str)] = &[
    ("mzizi-alert-banner", mzizi_alert_banner::CONTRACT),
    ("mzizi-avatar-stack", mzizi_avatar_stack::CONTRACT),
    ("mzizi-cover-header", mzizi_cover_header::CONTRACT),
    ("mzizi-empty-state", mzizi_empty_state::CONTRACT),
    ("mzizi-escalation-card", mzizi_escalation_card::CONTRACT),
    ("mzizi-gauge-card", mzizi_gauge_card::CONTRACT),
    ("mzizi-hero-stat", mzizi_hero_stat::CONTRACT),
    ("mzizi-meta-tile", mzizi_meta_tile::CONTRACT),
    ("mzizi-stats-row", mzizi_stats_row::CONTRACT),
    ("mzizi-success-screen", mzizi_success_screen::CONTRACT),
    ("mzizi-suitability-card", mzizi_suitability_card::CONTRACT),
    ("mzizi-user-card", mzizi_user_card::CONTRACT),
];
