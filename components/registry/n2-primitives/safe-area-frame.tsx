import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * SafeAreaFrame — a canvas shape at thumbnail size: its true aspect ratio,
 * with the bands a platform covers with its own interface shaded (a story's
 * top bar and reply bar, a reel's action rail, a video's duration badge).
 *
 * Purely presentational and server-safe. The Rust sibling,
 * `safe-area-frame.rs`, renders the same markup and classes.
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

interface SafeAreaFrameProps extends React.ComponentProps<"span"> {
  /** The canvas width in pixels, e.g. 1080. */
  width: number
  /** The canvas height in pixels, e.g. 1920. */
  height: number
  /** Platform-UI insets `[top, right, bottom, left]` in canvas pixels. */
  safe?: SafeInsets
  /** The square the thumbnail fits in, in CSS pixels. */
  box?: number
}

function SafeAreaFrame({
  width,
  height,
  safe = [0, 0, 0, 0],
  box = 56,
  className,
  ...props
}: SafeAreaFrameProps) {
  const b = safeAreaBands(width, height, safe, box)
  return (
    <span
      data-slot="safe-area-frame"
      aria-hidden="true"
      className={cn("grid shrink-0 place-items-center", className)}
      style={{ width: box, height: box }}
      {...props}
    >
      <span
        data-slot="safe-area-frame-canvas"
        className="relative block overflow-hidden rounded-[4px] border border-foreground/40 bg-muted"
        style={{ width: b.width, height: b.height }}
      >
        {b.top > 0 && (
          <span
            data-band="top"
            className="absolute inset-x-0 top-0 bg-primary/30"
            style={{ height: `${b.top}%` }}
          />
        )}
        {b.bottom > 0 && (
          <span
            data-band="bottom"
            className="absolute inset-x-0 bottom-0 bg-primary/30"
            style={{ height: `${b.bottom}%` }}
          />
        )}
        {b.left > 0 && (
          <span
            data-band="left"
            className="absolute inset-y-0 left-0 bg-primary/20"
            style={{ width: `${b.left}%` }}
          />
        )}
        {b.right > 0 && (
          <span
            data-band="right"
            className="absolute inset-y-0 right-0 bg-primary/20"
            style={{ width: `${b.right}%` }}
          />
        )}
      </span>
    </span>
  )
}

export { SafeAreaFrame, safeAreaBands }
export type { SafeAreaFrameProps }
