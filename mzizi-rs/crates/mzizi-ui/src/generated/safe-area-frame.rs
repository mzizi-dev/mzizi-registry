// GENERATED — DO NOT EDIT.
//
// Copied verbatim from components/registry/n2-primitives/safe-area-frame.rs by scripts/generate-rust-components.mjs.
// That file is the one a human edits; this is the copy `cargo package` can ship,
// because a tarball only carries files under the crate root.
//
// Regenerate with `pnpm rust:generate`. CI runs `pnpm rust:generate:check`,
// which fails if this copy and its source have drifted.

//! SAFE AREA FRAME — N2 primitive, Dioxus.
//!
//! The Rust sibling of `safe-area-frame.tsx`: a canvas shape at thumbnail size, at its true
//! aspect ratio, with the platform-UI bands shaded. Same `data-slot`s, same classes, and the
//! same geometry from [`safe_area_bands`], which mirrors the TypeScript's `safeAreaBands`.
//!
//! Purely presentational: no state, no hooks. It renders identically under server-side
//! rendering and in a browser.

use dioxus::prelude::*;

/// Classes on the outer box.
pub const FRAME: &str = "grid shrink-0 place-items-center";
/// Classes on the canvas shape.
pub const CANVAS: &str =
    "relative block overflow-hidden rounded-[4px] border border-foreground/40 bg-muted";
/// Classes on a horizontal (top or bottom) band.
pub const BAND_Y: &str = "absolute inset-x-0 bg-primary/30";
/// Classes on a vertical (left or right) band.
pub const BAND_X: &str = "absolute inset-y-0 bg-primary/20";

/// Thumbnail geometry: the shape's size in CSS pixels and each band as a percentage.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct SafeAreaBands {
    /// Thumbnail width in CSS pixels, at least 6.
    pub width: u32,
    /// Thumbnail height in CSS pixels, at least 6.
    pub height: u32,
    /// Top band, percent of the height.
    pub top: f64,
    /// Right band, percent of the width.
    pub right: f64,
    /// Bottom band, percent of the height.
    pub bottom: f64,
    /// Left band, percent of the width.
    pub left: f64,
}

/// Fit a `width` × `height` canvas with `[top, right, bottom, left]` insets into a
/// `box_px` square. Percentages are rounded to two decimals, as in the TypeScript.
#[must_use]
pub fn safe_area_bands(width: u32, height: u32, safe: [u32; 4], box_px: u32) -> SafeAreaBands {
    let w = f64::from(width.max(1));
    let h = f64::from(height.max(1));
    let scale = f64::from(box_px) / w.max(h);
    let pct = |v: u32, of: f64| (f64::from(v) / of * 10_000.0).round() / 100.0;
    // Rounded, non-negative and far below u32::MAX: the casts cannot truncate.
    #[allow(clippy::cast_possible_truncation, clippy::cast_sign_loss)]
    let px = |v: f64| ((v * scale).round() as u32).max(6);
    SafeAreaBands {
        width: px(w),
        height: px(h),
        top: pct(safe[0], h),
        right: pct(safe[1], w),
        bottom: pct(safe[2], h),
        left: pct(safe[3], w),
    }
}

/// Props for [`SafeAreaFrame`].
#[derive(Props, Clone, PartialEq)]
pub struct SafeAreaFrameProps {
    /// Canvas width in pixels.
    pub width: u32,
    /// Canvas height in pixels.
    pub height: u32,
    /// Platform-UI insets `[top, right, bottom, left]` in canvas pixels.
    #[props(default)]
    pub safe: [u32; 4],
    /// The square the thumbnail fits in, in CSS pixels.
    #[props(default = 56)]
    pub box_px: u32,
    /// Extra classes, appended last.
    #[props(default)]
    pub class: String,
}

/// A canvas shape with its safe-area bands shaded.
#[component]
pub fn SafeAreaFrame(props: SafeAreaFrameProps) -> Element {
    let b = safe_area_bands(props.width, props.height, props.safe, props.box_px);
    let class = if props.class.is_empty() {
        FRAME.to_owned()
    } else {
        format!("{FRAME} {}", props.class)
    };
    let box_px = props.box_px;
    rsx! {
        span {
            "data-slot": "safe-area-frame",
            "aria-hidden": "true",
            class,
            style: "width: {box_px}px; height: {box_px}px;",
            span {
                "data-slot": "safe-area-frame-canvas",
                class: CANVAS,
                style: "width: {b.width}px; height: {b.height}px;",
                if b.top > 0.0 {
                    span { "data-band": "top", class: "{BAND_Y} top-0", style: "height: {b.top}%;" }
                }
                if b.bottom > 0.0 {
                    span { "data-band": "bottom", class: "{BAND_Y} bottom-0", style: "height: {b.bottom}%;" }
                }
                if b.left > 0.0 {
                    span { "data-band": "left", class: "{BAND_X} left-0", style: "width: {b.left}%;" }
                }
                if b.right > 0.0 {
                    span { "data-band": "right", class: "{BAND_X} right-0", style: "width: {b.right}%;" }
                }
            }
        }
    }
}
