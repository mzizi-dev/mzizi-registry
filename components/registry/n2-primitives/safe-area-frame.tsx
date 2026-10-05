import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * SafeAreaFrame — a canvas shape at thumbnail size: its true aspect ratio,
 * with the bands a platform covers with its own interface shaded (a story's
 * top bar and reply bar, a reel's action rail, a video's duration badge).
 *
 * Purely presentational and server-safe. One contract for every build:
 * `contracts/ui/safe-area-frame.contract.json`; the Astro and Rust builds render the
 * same SVG.
 */

/** `[top, right, bottom, left]` insets, in the canvas's own pixels. */
export type SafeInsets = [number, number, number, number]

export interface SafeAreaBands {
  /** Thumbnail width and height in CSS pixels, at least 6 each. */
  width: number
  height: number
  /** Each band as a percentage of its axis. */
  top: number
  right: number
  bottom: number
  left: number
}

/**
 * The thumbnail geometry for a `width` × `height` canvas fitted into a
 * `box` × `box` square. Pure, so both renderers share one answer.
 */
function safeAreaBands(
  width: number,
  height: number,
  safe: SafeInsets,
  box: number
): SafeAreaBands {
  const w = Math.max(1, width)
  const h = Math.max(1, height)
  const scale = box / Math.max(w, h)
  const pct = (v: number, of: number) => Math.round((Math.max(0, v) / of) * 10000) / 100
  return {
    width: Math.max(6, Math.round(w * scale)),
    height: Math.max(6, Math.round(h * scale)),
    top: pct(safe[0], h),
    right: pct(safe[1], w),
    bottom: pct(safe[2], h),
    left: pct(safe[3], w),
  }
}

interface SafeAreaFrameProps extends Omit<React.ComponentProps<"svg">, "width" | "height"> {
  /** The canvas width in pixels, e.g. 1080. */
  width: number
  /** The canvas height in pixels, e.g. 1920. */
  height: number
  /** Platform-UI insets `[top, right, bottom, left]` in canvas pixels. */
  safe?: SafeInsets
  /** The square the thumbnail fits in, in CSS pixels. */
  box?: number
}

/**
 * Sized by SVG geometry, never a `style` attribute, so a page can keep
 * `style-src 'self'` (the contract's no-inline-style rule). The canvas is a
 * nested <svg> centred in the box; its bands are drawn in a 100×100 user space
 * stretched to the canvas, so each band's percentage is its rect's size. The
 * same markup as `safe-area-frame.astro` and `safe-area-frame.rs`.
 */
function SafeAreaFrame({
  width,
  height,
  safe = [0, 0, 0, 0],
  box = 56,
  className,
  ...props
}: SafeAreaFrameProps) {
  const b = safeAreaBands(width, height, safe, box)
  const x = (box - b.width) / 2
  const y = (box - b.height) / 2
  return (
    <svg
      data-slot="safe-area-frame"
      aria-hidden="true"
      focusable="false"
      className={cn("block shrink-0", className)}
      width={box}
      height={box}
      viewBox={`0 0 ${box} ${box}`}
      {...props}
    >
      <svg
        data-slot="safe-area-frame-canvas"
        x={x}
        y={y}
        width={b.width}
        height={b.height}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="overflow-hidden"
      >
        <rect width="100" height="100" className="fill-muted" />
        {b.top > 0 && <rect data-band="top" width="100" height={b.top} className="fill-primary/30" />}
        {b.bottom > 0 && (
          <rect
            data-band="bottom"
            y={100 - b.bottom}
            width="100"
            height={b.bottom}
            className="fill-primary/30"
          />
        )}
        {b.left > 0 && <rect data-band="left" width={b.left} height="100" className="fill-primary/20" />}
        {b.right > 0 && (
          <rect
            data-band="right"
            x={100 - b.right}
            width={b.right}
            height="100"
            className="fill-primary/20"
          />
        )}
        <rect
          width="100"
          height="100"
          fill="none"
          vectorEffect="non-scaling-stroke"
          className="stroke-foreground/40"
        />
      </svg>
    </svg>
  )
}

export { SafeAreaFrame, safeAreaBands }
export type { SafeAreaFrameProps }
