"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type RecordingState = "idle" | "recording" | "paused"

interface RecordingControlsProps extends React.ComponentProps<"div"> {
  state?: RecordingState
  elapsed?: number
  onRecord?: () => void
  onPause?: () => void
  onStop?: () => void
  onResume?: () => void
  variant?: "video" | "audio"
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, "0")}`
}

function RecordingControls({
  state = "idle",
  elapsed = 0,
  onRecord,
  onPause,
  onStop,
  onResume,
  variant = "video",
  className,
  ...props
}: RecordingControlsProps) {
  return (
    // `variant` ("video" | "audio") was destructured and never read. The
    // controls are identical for both, so it surfaces as `data-variant` — the
    // §6.3 convention — which is what lets a consumer style or target the two
    // cases. The aria-label names the medium so a screen reader gets it too.
    <div
      data-slot="recording-controls"
      data-portal="https://mzizi.dev/components/recording-controls"
      data-variant={variant}
      className={cn("flex items-center justify-center gap-4", className)}
      role="toolbar"
      aria-label={`${variant === "audio" ? "Audio" : "Video"} recording controls`}
      {...props}
    >
      {state === "recording" && (
        <div className="flex items-center gap-2">
          <div className="size-2 animate-pulse rounded-full bg-destructive" />
          <span className="font-mono text-sm font-medium text-destructive tabular-nums">
            {formatTime(elapsed)}
          </span>
        </div>
      )}
      {state === "paused" && (
        <span className="font-mono text-sm font-medium text-[var(--color-gold,#FFD740)] tabular-nums">
          {formatTime(elapsed)} (Paused)
        </span>
      )}

      <div className="flex items-center gap-2">
        {state === "idle" && (
          <button
            onClick={onRecord}
            aria-label="Start recording"
            className="flex size-14 items-center justify-center rounded-full bg-destructive text-white shadow-lg"
          >
            <div className="size-5 rounded-full bg-white" />
          </button>
        )}
        {state === "recording" && (
          <>
            <button
              onClick={onPause}
              aria-label="Pause"
              className="flex size-12 items-center justify-center rounded-full bg-muted text-foreground"
            >
              ⏸
            </button>
            <button
              onClick={onStop}
              aria-label="Stop"
              className="flex size-14 items-center justify-center rounded-full bg-destructive text-white shadow-lg"
            >
              <div className="size-5 rounded-[var(--radius-sm,7px)] bg-white" />
            </button>
          </>
        )}
        {state === "paused" && (
          <>
            <button
              onClick={onResume}
              aria-label="Resume"
              className="flex size-14 items-center justify-center rounded-full bg-destructive text-white shadow-lg"
            >
              <div className="size-5 rounded-full bg-white" />
            </button>
            <button
              onClick={onStop}
              aria-label="Stop"
              className="flex size-12 items-center justify-center rounded-full bg-muted text-foreground"
            >
              ■
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export { RecordingControls }
export type { RecordingControlsProps }
