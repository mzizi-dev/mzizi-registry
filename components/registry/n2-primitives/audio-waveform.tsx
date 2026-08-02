"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface AudioWaveformProps extends React.ComponentProps<"div"> {
  /** Normalized amplitude data (0-1) */
  data?: number[]
  /** Number of bars when no data provided */
  bars?: number
  /** Playback progress (0-1) */
  progress?: number
  /** Color for played portion */
  activeColor?: string
  /** Color for unplayed portion */
  inactiveColor?: string
  /** Height of the waveform */
  height?: number
  /** Click to seek */
  onSeek?: (position: number) => void
}

function AudioWaveform({
  data,
  bars = 40,
  progress = 0,
  activeColor = "var(--color-malachite,#64FFDA)",
  inactiveColor = "var(--color-malachite,#64FFDA)33",
  height = 32,
  onSeek,
  className,
  ...props
}: AudioWaveformProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)

  /* Generate pseudo-random amplitudes from a seed when no data provided */
  const amplitudes = React.useMemo(() => {
    if (data) return data
    return Array.from(
      { length: bars },
      (_, i) => 0.2 + Math.abs(Math.sin(i * 0.8)) * 0.6 + Math.random() * 0.2
    )
  }, [data, bars])

  const handleClick = (e: React.MouseEvent) => {
    if (!onSeek || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const pos = (e.clientX - rect.left) / rect.width
    onSeek(Math.max(0, Math.min(1, pos)))
  }

  return (
    <div
      data-slot="audio-waveform"
      data-portal="https://mzizi.dev/components/audio-waveform"
      ref={containerRef}
      onClick={handleClick}
      role={onSeek ? "slider" : "img"}
      aria-valuenow={onSeek ? Math.round(progress * 100) : undefined}
      aria-valuemin={onSeek ? 0 : undefined}
      aria-valuemax={onSeek ? 100 : undefined}
      aria-label="Audio waveform"
      className={cn("flex items-center gap-[1px]", onSeek && "cursor-pointer", className)}
      style={{ height }}
      {...props}
    >
      {amplitudes.map((amp, i) => {
        const filled = i / amplitudes.length <= progress
        return (
          <div
            key={i}
            className="flex-1 rounded-full transition-colors"
            style={{
              height: `${Math.max(8, amp * 100)}%`,
              backgroundColor: filled ? activeColor : inactiveColor,
              minWidth: 2,
            }}
          />
        )
      })}
    </div>
  )
}

export { AudioWaveform }
export type { AudioWaveformProps }
