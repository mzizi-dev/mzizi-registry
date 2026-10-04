"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * PreviewCanvas — a stage for one rendered image: a checkerboard surface (so
 * transparency reads as transparency), a Fit / fixed-scale zoom, a busy flag
 * for assistive technology, and an empty slot before the first render.
 *
 * Fit keeps the whole image in view at its own aspect ratio — never wider
 * than the stage, never taller than `fitHeight` — so a 9:16 story and a
 * 1400×560 tile both preview whole. A number zooms to that fraction of the
 * image's natural size, and the stage scrolls.
 */

type Zoom = "fit" | number

interface PreviewCanvasProps extends Omit<React.ComponentProps<"div">, "children"> {
  /** Image URL (an object URL from a render, or any src). Absent shows `empty`. */
  src?: string
  /** Alt text for the image. Required with `src`. */
  alt?: string
  /** "fit" or a scale factor such as 0.5 or 1. */
  zoom?: Zoom
  /** Maximum height in Fit, any CSS length. */
  fitHeight?: string
  /** Rendering in progress: sets `aria-busy` and shows `busyLabel`. */
  busy?: boolean
  busyLabel?: string
  /** Shown before there is anything to preview. */
  empty?: React.ReactNode
}

/** The inline size of the image for a zoom level and its natural width. */
function zoomStyle(zoom: Zoom, naturalWidth: number, fitHeight: string): React.CSSProperties {
  if (zoom === "fit")
    return {
      maxWidth: "100%",
      maxHeight: fitHeight,
      width: "auto",
      height: "auto",
    }
  return {
    width: Math.round(naturalWidth * zoom),
    maxWidth: "none",
    maxHeight: "none",
    height: "auto",
  }
}

function PreviewCanvas({
  src,
  alt = "",
  zoom = "fit",
  fitHeight = "min(68vh, 760px)",
  busy = false,
  busyLabel = "Rendering…",
  empty,
  className,
  ...props
}: PreviewCanvasProps) {
  const [natural, setNatural] = React.useState(0)
  return (
    <div
      data-slot="preview-canvas"
      aria-live="polite"
      aria-busy={busy}
      className={cn(
        "relative grid min-h-80 place-items-center overflow-auto bg-muted bg-[repeating-conic-gradient(var(--border)_0%_25%,transparent_0%_50%)] bg-[length:20px_20px] p-4 sm:min-h-[420px] sm:p-6",
        className
      )}
      {...props}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- a blob/object URL, not an optimisable asset
        <img
          data-slot="preview-canvas-image"
          src={src}
          alt={alt}
          onLoad={(e) => setNatural(e.currentTarget.naturalWidth)}
          className="block rounded-[7px] shadow-xl"
          style={zoomStyle(zoom, natural, fitHeight)}
        />
      ) : (
        empty
      )}
      {busy && (
        <span
          data-slot="preview-canvas-busy"
          className="pointer-events-none absolute top-4 right-4 rounded-full bg-card px-3 py-1 text-xs text-foreground shadow"
        >
          {busyLabel}
        </span>
      )}
    </div>
  )
}

export { PreviewCanvas, zoomStyle }
export type { PreviewCanvasProps, Zoom }
