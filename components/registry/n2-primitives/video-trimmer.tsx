"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface VideoTrimmerProps extends React.ComponentProps<"div"> {
  /** Total duration in seconds */
  duration: number
  /** Start trim point (seconds) */
  startTime?: number
  /** End trim point (seconds) */
  endTime?: number
  /** Current playhead position (seconds) */
  currentTime?: number
  /** Thumbnail URLs for frame preview strip */
  thumbnails?: string[]
  onStartChange?: (time: number) => void
  onEndChange?: (time: number) => void
  onPlayheadChange?: (time: number) => void
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, "0")}`
}

function VideoTrimmer({
  duration,
  startTime = 0,
  endTime,
  currentTime = 0,
  thumbnails,
  onStartChange,
  onEndChange,
  onPlayheadChange,
  className,
  ...props
}: VideoTrimmerProps) {
  const end = endTime ?? duration
  const containerRef = React.useRef<HTMLDivElement>(null)

  const handleTrackClick = (e: React.MouseEvent) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    onPlayheadChange?.(pct * duration)
  }

  const startPct = (startTime / duration) * 100
  const endPct = (end / duration) * 100
  const playheadPct = (currentTime / duration) * 100

  return (
    <div
      data-slot="video-trimmer"
      data-portal="https://mzizi.dev/components/video-trimmer"
      className={cn("space-y-2", className)}
      {...props}
    >
      {/* Time display */}
      <div className="flex items-center justify-between font-mono text-xs text-muted-foreground tabular-nums">
        <span>{formatTime(startTime)}</span>
        <span className="font-medium text-foreground">{formatTime(end - startTime)} selected</span>
        <span>{formatTime(end)}</span>
      </div>

      {/* Track */}
      <div
        ref={containerRef}
        onClick={handleTrackClick}
        className="relative h-14 cursor-pointer overflow-hidden rounded-[var(--radius-md,12px)] bg-muted"
        role="slider"
        aria-label="Video timeline"
        aria-valuenow={Math.round(currentTime)}
        aria-valuemin={0}
        aria-valuemax={Math.round(duration)}
      >
        {/* Thumbnail strip */}
        {thumbnails && thumbnails.length > 0 ? (
          <div className="absolute inset-0 flex">
            {thumbnails.map((url, i) => (
              <div
                key={i}
                className="h-full flex-1 bg-cover bg-center"
                style={{ backgroundImage: `url(${url})` }}
              />
            ))}
          </div>
        ) : (
          /* Generated placeholder frames */
          <div className="absolute inset-0 flex">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="h-full flex-1 border-r border-border/20"
                style={{ backgroundColor: `hsl(${160 + i * 5}, 30%, ${20 + i * 2}%)` }}
              />
            ))}
          </div>
        )}

        {/* Inactive overlay on either side of selection */}
        <div className="absolute inset-y-0 left-0 bg-black/50" style={{ width: `${startPct}%` }} />
        <div
          className="absolute inset-y-0 right-0 bg-black/50"
          style={{ width: `${100 - endPct}%` }}
        />

        {/* Selection border highlights */}
        <div
          className="absolute inset-y-0 border-x-2 border-[var(--color-malachite,#64FFDA)]"
          style={{ left: `${startPct}%`, width: `${endPct - startPct}%` }}
        />

        {/* Playhead */}
        <div
          className="absolute inset-y-0 w-0.5 bg-white shadow-md"
          style={{ left: `${playheadPct}%` }}
        >
          <div className="absolute -top-1 left-1/2 size-2 -translate-x-1/2 rounded-full bg-white shadow" />
        </div>

        {/* Drag handles */}
        <div
          className="absolute inset-y-0 w-3 cursor-ew-resize rounded-l-sm bg-[var(--color-malachite,#64FFDA)]"
          style={{ left: `calc(${startPct}% - 6px)` }}
        />
        <div
          className="absolute inset-y-0 w-3 cursor-ew-resize rounded-r-sm bg-[var(--color-malachite,#64FFDA)]"
          style={{ left: `calc(${endPct}% - 6px)` }}
        />
      </div>

      {/* Range inputs for keyboard accessibility */}
      <div className="flex gap-4">
        <label className="flex-1 text-[10px] text-muted-foreground">
          Start
          <input
            type="range"
            min={0}
            max={duration}
            step={0.1}
            value={startTime}
            onChange={(e) => onStartChange?.(parseFloat(e.target.value))}
            className="mt-0.5 h-1 w-full accent-[var(--color-malachite,#64FFDA)]"
          />
        </label>
        <label className="flex-1 text-[10px] text-muted-foreground">
          End
          <input
            type="range"
            min={0}
            max={duration}
            step={0.1}
            value={end}
            onChange={(e) => onEndChange?.(parseFloat(e.target.value))}
            className="mt-0.5 h-1 w-full accent-[var(--color-malachite,#64FFDA)]"
          />
        </label>
      </div>
    </div>
  )
}

export { VideoTrimmer }
export type { VideoTrimmerProps }
