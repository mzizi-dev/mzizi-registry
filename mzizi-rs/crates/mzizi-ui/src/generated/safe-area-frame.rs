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
//! The Rust build of `contracts/ui/safe-area-frame.contract.json`: a canvas shape at thumbnail
//! size, at its true aspect ratio, with the platform-UI bands shaded. The same SVG as
//! `safe-area-frame.astro` and `safe-area-frame.tsx`, sized by geometry and never a `style`
//! attribute, and the same numbers from [`safe_area_bands`], which mirrors the TypeScript's
//! `safeAreaBands`.
//!
//! Purely presentational: no state, no hooks. It renders identically under server-side
//! rendering and in a browser.

use dioxus::prelude::*;

/// Classes on the outer `<svg>`.
pub const FRAME: &str = "block shrink-0";
/// Classes on the canvas `<svg>`.
pub const CANVAS: &str = "overflow-hidden";
/// Fill of the canvas.
pub const CANVAS_FILL: &str = "fill-muted";
/// Fill of a horizontal (top or bottom) band.
pub const BAND_Y: &str = "fill-primary/30";
/// Fill of a vertical (left or right) band.
pub const BAND_X: &str = "fill-primary/20";
/// Stroke of the canvas outline.
pub const OUTLINE: &str = "stroke-foreground/40";

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

/// A canvas shape with its safe-area bands shaded. The canvas is a nested `<svg>` centred in
/// the box; its bands are drawn in a 100×100 user space stretched to the canvas, so each band's
/// percentage is its rect's size.
#[component]
pub fn SafeAreaFrame(props: SafeAreaFrameProps) -> Element {
    let b = safe_area_bands(props.width, props.height, props.safe, props.box_px);
    let class = if props.class.is_empty() {
        FRAME.to_owned()
    } else {
        format!("{FRAME} {}", props.class)
    };
    let box_px = props.box_px;
    let x = f64::from(box_px.saturating_sub(b.width)) / 2.0;
    let y = f64::from(box_px.saturating_sub(b.height)) / 2.0;
    let bottom_y = 100.0 - b.bottom;
    let right_x = 100.0 - b.right;
    rsx! {
        svg {
            "data-slot": "safe-area-frame",
            "aria-hidden": "true",
            "focusable": "false",
            class,
            "width": "{box_px}",
            "height": "{box_px}",
            "viewBox": "0 0 {box_px} {box_px}",
            svg {
                "data-slot": "safe-area-frame-canvas",
                "x": "{x}",
                "y": "{y}",
                "width": "{b.width}",
                "height": "{b.height}",
                "viewBox": "0 0 100 100",
                "preserveAspectRatio": "none",
                class: CANVAS,
                rect { "width": "100", "height": "100", class: CANVAS_FILL }
                if b.top > 0.0 {
                    rect { "data-band": "top", "width": "100", "height": "{b.top}", class: BAND_Y }
                }
                if b.bottom > 0.0 {
                    rect {
                        "data-band": "bottom",
                        "y": "{bottom_y}",
                        "width": "100",
                        "height": "{b.bottom}",
                        class: BAND_Y,
                    }
                }
                if b.left > 0.0 {
                    rect { "data-band": "left", "width": "{b.left}", "height": "100", class: BAND_X }
                }
                if b.right > 0.0 {
                    rect {
                        "data-band": "right",
                        "x": "{right_x}",
                        "width": "{b.right}",
                        "height": "100",
                        class: BAND_X,
                    }
                }
                rect {
                    "width": "100",
                    "height": "100",
                    "fill": "none",
                    "vector-effect": "non-scaling-stroke",
                    class: OUTLINE,
                }
            }
        }
    }
}

/// The contract this build implements, copied by `pnpm contracts:sync` from
/// `contracts/ui/safe-area-frame.contract.json`, the one contract the Astro, React and Rust
/// builds share: edit the contract file, never this copy. `tests/contracts_json.rs` renders
/// every state the contract declares and evaluates every clause and check against the markup.
pub const CONTRACT: &str = r#"contract
  slot is "safe-area-frame"
  uses safe-area-frame-canvas
  when rail slot is "safe-area-frame"
  when plain class contains "opacity-80"
end"#;
