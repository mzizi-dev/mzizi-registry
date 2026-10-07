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

#[path = "generated/alert.rs"]
pub mod alert;

#[path = "generated/button.rs"]
pub mod button;

#[path = "generated/badge.rs"]
pub mod badge;

#[path = "generated/card.rs"]
pub mod card;

#[path = "generated/avatar.rs"]
pub mod avatar;

#[path = "generated/input.rs"]
pub mod input;

#[path = "generated/label.rs"]
pub mod label;

#[path = "generated/progress.rs"]
pub mod progress;

#[path = "generated/separator.rs"]
pub mod separator;

#[path = "generated/skeleton.rs"]
pub mod skeleton;

#[path = "generated/chart.rs"]
pub mod chart;

#[path = "generated/status-badge.rs"]
pub mod status_badge;

#[path = "generated/safe-area-frame.rs"]
pub mod safe_area_frame;

#[path = "generated/markdown-renderer.rs"]
pub mod markdown_renderer;

#[path = "generated/device-code.rs"]
pub mod device_code;

// ── wave 1 · batch A · modules ──
// ── end wave 1 · batch A · modules ──

// ── wave 1 · batch B · modules ──
// ── end wave 1 · batch B · modules ──

// ── wave 1 · batch C · modules ──
// ── end wave 1 · batch C · modules ──

// ── wave 1 · batch D · modules ──
// ── end wave 1 · batch D · modules ──

// ── wave 1 · batch E · modules ──
// ── end wave 1 · batch E · modules ──

// ── wave 1 · batch F · modules ──
// ── end wave 1 · batch F · modules ──

// ── wave 1 · batch G · modules ──
// ── end wave 1 · batch G · modules ──

// ── wave 1 · batch H · modules ──
// ── end wave 1 · batch H · modules ──

pub use alert::{
    Alert, AlertAction, AlertDescription, AlertPartProps, AlertProps, AlertTitle, AlertVariant,
    alert_variants,
};
pub use avatar::{
    Avatar, AvatarBadge, AvatarBadgeProps, AvatarFallback, AvatarFallbackProps, AvatarGroup,
    AvatarGroupCount, AvatarGroupCountProps, AvatarGroupProps, AvatarImage, AvatarImageProps,
    AvatarProps, AvatarSize, avatar_variants,
};
pub use badge::{Badge, BadgeProps, BadgeVariant, badge_variants};
pub use button::{Button, ButtonProps, ButtonSize, ButtonVariant, button_variants};
pub use card::{Card, CardContent, CardFooter, CardHeader, CardTitle};
pub use chart::{Chart, ChartProps, chart_loading_variants, chart_variants};
pub use device_code::{
    DeviceCode, DeviceCodeProps, DeviceCodeSize, DeviceCodeStatus, QrEcc, QrMatrix,
    effective_status as device_code_effective_status, format_remaining as device_code_remaining,
    format_user_code, qr_matrix, qr_path, qr_view_box, rfc3339_to_unix_ms, spoken_user_code,
};
pub use input::{Input, InputProps, input_variants};
pub use label::{Label, LabelProps, label_variants};
pub use markdown_renderer::{
    Align as MarkdownAlign, Block as MarkdownBlock, Inline as MarkdownInline, List as MarkdownList,
    ListItem as MarkdownListItem, MarkdownLinks, MarkdownRenderer, MarkdownRendererProps,
    MarkdownSource, parse_inlines as parse_markdown_inlines, parse_markdown, safe_href,
};
pub use progress::{Progress, ProgressProps, progress_variants};
pub use safe_area_frame::{SafeAreaBands, SafeAreaFrame, SafeAreaFrameProps, safe_area_bands};
pub use separator::{Separator, SeparatorOrientation, SeparatorProps, separator_variants};
pub use skeleton::{Skeleton, SkeletonProps, skeleton_variants};
pub use status_badge::{
    STATUS_BADGE_STATUSES, StatusBadge, StatusBadgeProps, StatusBadgeStatus, status_badge_variants,
};

// ── wave 1 · batch A · exports ──
// ── end wave 1 · batch A · exports ──

// ── wave 1 · batch B · exports ──
// ── end wave 1 · batch B · exports ──

// ── wave 1 · batch C · exports ──
// ── end wave 1 · batch C · exports ──

// ── wave 1 · batch D · exports ──
// ── end wave 1 · batch D · exports ──

// ── wave 1 · batch E · exports ──
// ── end wave 1 · batch E · exports ──

// ── wave 1 · batch F · exports ──
// ── end wave 1 · batch F · exports ──

// ── wave 1 · batch G · exports ──
// ── end wave 1 · batch G · exports ──

// ── wave 1 · batch H · exports ──
// ── end wave 1 · batch H · exports ──

/// Every N2 primitive that exports a `CONTRACT`, with its registry name.
pub const CONTRACTS: &[(&str, &str)] = &[
    ("alert", alert::CONTRACT),
    ("button", button::CONTRACT),
    ("card", card::CONTRACT),
    ("device-code", device_code::CONTRACT),
    ("input", input::CONTRACT),
    ("label", label::CONTRACT),
    ("markdown-renderer", markdown_renderer::CONTRACT),
    ("safe-area-frame", safe_area_frame::CONTRACT),
    ("skeleton", skeleton::CONTRACT),
    ("status-badge", status_badge::CONTRACT),
    // ── wave 1 · batch A · contracts ──
    // ── end wave 1 · batch A · contracts ──
    // ── wave 1 · batch B · contracts ──
    // ── end wave 1 · batch B · contracts ──
    // ── wave 1 · batch C · contracts ──
    // ── end wave 1 · batch C · contracts ──
    // ── wave 1 · batch D · contracts ──
    // ── end wave 1 · batch D · contracts ──
    // ── wave 1 · batch E · contracts ──
    // ── end wave 1 · batch E · contracts ──
    // ── wave 1 · batch F · contracts ──
    // ── end wave 1 · batch F · contracts ──
    // ── wave 1 · batch G · contracts ──
    // ── end wave 1 · batch G · contracts ──
    // ── wave 1 · batch H · contracts ──
    // ── end wave 1 · batch H · contracts ──
];

/// The N1 token module, re-exported so a consumer takes one dependency.
pub use mzizi_tokens as tokens;
