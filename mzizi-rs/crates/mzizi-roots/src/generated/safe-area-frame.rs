// GENERATED — DO NOT EDIT.
//
// Copied verbatim from components/registry/n2-primitives/safe-area-frame.rs by scripts/generate-rust-components.mjs.
// That file is the one a human edits; this is the copy `cargo package` can ship,
// because a tarball only carries files under the crate root.
//
// Regenerate with `pnpm rust:generate`. CI runs `pnpm rust:generate:check`,
// which fails if this copy and its source have drifted.

//! SAFE AREA FRAME — N2 primitive, Mzizi Roots.
//!
//! The Rust build of `contracts/ui/safe-area-frame.contract.json`: a canvas shape at thumbnail
//! size, at its true aspect ratio, with the platform-UI bands shaded. The same SVG as
//! `safe-area-frame.astro` and `safe-area-frame.tsx`, sized by geometry, and the same numbers from
//! [`safe_area_bands`], which mirrors the TypeScript's `safeAreaBands`.
//!
//! Unstyled: no class names. Each part carries a `data-slot` (`safe-area-frame`,
//! `safe-area-frame-canvas`, `safe-area-frame-canvas-fill`, `safe-area-frame-band`,
//! `safe-area-frame-outline`) and each band a `data-band`, so a stylesheet picks the fills and the
//! outline. The geometry (sizes and positions) stays as attributes, because it is the shape itself.
//!
//! Purely presentational: no state, no hooks. It renders the same under server-side rendering and
//! in a browser.

use crate::node::{Node, render_to_string};

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

/// Fit a `width` × `height` canvas with `[top, right, bottom, left]` insets into a `box_px`
/// square. Percentages are rounded to two decimals, as in the TypeScript.
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

/// The props a safe-area frame render takes.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RenderProps {
    /// Canvas width in pixels.
    pub width: u32,
    /// Canvas height in pixels.
    pub height: u32,
    /// Platform-UI insets `[top, right, bottom, left]` in canvas pixels.
    pub safe: [u32; 4],
    /// The square the thumbnail fits in, in CSS pixels.
    pub box_px: u32,
    /// Extra classes, passed through as the `class` attribute when not empty.
    pub class: String,
}

/// An SVG element with the given tag, attributes and children.
fn svg(tag: &'static str, attrs: &[(&str, &str)], children: Vec<Node>) -> Node {
    Node::element(tag, attrs, children)
}

/// The safe-area frame as a node tree.
#[must_use]
pub fn node(props: &RenderProps) -> Node {
    let b = safe_area_bands(props.width, props.height, props.safe, props.box_px);
    let box_px = props.box_px;
    let x = (f64::from(box_px.saturating_sub(b.width)) / 2.0).to_string();
    let y = (f64::from(box_px.saturating_sub(b.height)) / 2.0).to_string();
    let bottom_y = (100.0 - b.bottom).to_string();
    let right_x = (100.0 - b.right).to_string();
    let box_s = box_px.to_string();
    let view = format!("0 0 {box_s} {box_s}");
    let (w, h) = (b.width.to_string(), b.height.to_string());
    let (top, right, bottom, left) = (
        b.top.to_string(),
        b.right.to_string(),
        b.bottom.to_string(),
        b.left.to_string(),
    );

    let mut bands = Vec::new();
    if b.top > 0.0 {
        bands.push(svg(
            "rect",
            &[
                ("data-slot", "safe-area-frame-band"),
                ("data-band", "top"),
                ("width", "100"),
                ("height", top.as_str()),
            ],
            vec![],
        ));
    }
    if b.bottom > 0.0 {
        bands.push(svg(
            "rect",
            &[
                ("data-slot", "safe-area-frame-band"),
                ("data-band", "bottom"),
                ("y", bottom_y.as_str()),
                ("width", "100"),
                ("height", bottom.as_str()),
            ],
            vec![],
        ));
    }
    if b.left > 0.0 {
        bands.push(svg(
            "rect",
            &[
                ("data-slot", "safe-area-frame-band"),
                ("data-band", "left"),
                ("width", left.as_str()),
                ("height", "100"),
            ],
            vec![],
        ));
    }
    if b.right > 0.0 {
        bands.push(svg(
            "rect",
            &[
                ("data-slot", "safe-area-frame-band"),
                ("data-band", "right"),
                ("x", right_x.as_str()),
                ("width", right.as_str()),
                ("height", "100"),
            ],
            vec![],
        ));
    }

    let mut children = vec![svg(
        "rect",
        &[
            ("data-slot", "safe-area-frame-canvas-fill"),
            ("width", "100"),
            ("height", "100"),
        ],
        vec![],
    )];
    children.extend(bands);
    children.push(svg(
        "rect",
        &[
            ("data-slot", "safe-area-frame-outline"),
            ("width", "100"),
            ("height", "100"),
            ("fill", "none"),
            ("vector-effect", "non-scaling-stroke"),
        ],
        vec![],
    ));

    let canvas = svg(
        "svg",
        &[
            ("data-slot", "safe-area-frame-canvas"),
            ("x", x.as_str()),
            ("y", y.as_str()),
            ("width", w.as_str()),
            ("height", h.as_str()),
            ("viewBox", "0 0 100 100"),
            ("preserveAspectRatio", "none"),
        ],
        children,
    );

    let mut attrs = vec![
        ("data-slot", "safe-area-frame"),
        ("aria-hidden", "true"),
        ("focusable", "false"),
        ("width", box_s.as_str()),
        ("height", box_s.as_str()),
        ("viewBox", view.as_str()),
    ];
    if !props.class.is_empty() {
        attrs.push(("class", props.class.as_str()));
    }
    svg("svg", &attrs, vec![canvas])
}

/// Render a safe-area frame to an HTML string, with no Dioxus and no WASM.
#[must_use]
pub fn render(props: &RenderProps) -> String {
    render_to_string(&[node(props)])
}

/// The contract this build implements, copied by `pnpm contracts:sync` from
/// `contracts/ui/safe-area-frame.contract.json`, the one contract the Astro, React and Rust
/// builds share: edit the contract file, never this copy.
pub const CONTRACT: &str = r#"contract
  slot is "safe-area-frame"
  uses safe-area-frame-canvas
  when rail slot is "safe-area-frame"
  when plain class contains "opacity-80"
end"#;
