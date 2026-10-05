/**
 * Safe-area thumbnail geometry, shared by `SafeAreaFrame.astro` and mirroring
 * the registry's `safe-area-frame` (`safeAreaBands` in React,
 * `safe_area_bands` in the Mzizi Roots crate) — one answer in every
 * renderer.
 */

/** `[top, right, bottom, left]` insets, in the canvas's own pixels. */
export type SafeInsets = [number, number, number, number];

export interface SafeAreaBands {
  /** Thumbnail width and height in CSS pixels, at least 6 each. */
  width: number;
  height: number;
  /** Each band as a percentage of its axis, to two decimals. */
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export function safeAreaBands(
  width: number,
  height: number,
  safe: SafeInsets,
  box: number,
): SafeAreaBands {
  const w = Math.max(1, width);
  const h = Math.max(1, height);
  const scale = box / Math.max(w, h);
  const pct = (v: number, of: number) =>
    Math.round((Math.max(0, v) / of) * 10000) / 100;
  return {
    width: Math.max(6, Math.round(w * scale)),
    height: Math.max(6, Math.round(h * scale)),
    top: pct(safe[0], h),
    right: pct(safe[1], w),
    bottom: pct(safe[2], h),
    left: pct(safe[3], w),
  };
}
