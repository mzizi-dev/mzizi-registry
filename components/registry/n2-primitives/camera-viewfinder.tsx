"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type CameraMode = "photo" | "video" | "story"

interface CameraViewfinderProps extends React.ComponentProps<"div"> {
  /** Camera mode */
  mode?: CameraMode
  /** Whether recording is active */
  recording?: boolean
  /** Recording elapsed seconds */
  elapsed?: number
  /** Called when record button pressed */
  onCapture?: () => void
  /** Called when camera flip is pressed */
  onFlip?: () => void
  /** Called to open effects */
  onEffects?: () => void
  /** Aspect ratio */
  aspectRatio?: "9/16" | "1/1" | "4/3"
}

function CameraViewfinder({
  mode = "video",
  recording = false,
  elapsed = 0,
  onCapture,
  onFlip,
  onEffects,
  aspectRatio = "9/16",
  className,
  ...props
}: CameraViewfinderProps) {
  const m = Math.floor(elapsed / 60)
  const s = elapsed % 60
  const timeStr = `${m}:${s.toString().padStart(2, "0")}`

  return (
    <div
      data-slot="camera-viewfinder"
      data-portal="https://mzizi.dev/components/camera-viewfinder"
      className={cn("relative overflow-hidden rounded-[var(--radius-xl,17px)] bg-black", className)}
      style={{ aspectRatio }}
      {...props}
    >
      {/* Camera preview placeholder */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />

      {/* Top bar: recording indicator + timer + flip */}
      <div className="absolute top-0 right-0 left-0 flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          {recording && (
            <>
              <div className="size-2 animate-pulse rounded-full bg-destructive" />
              <span className="font-mono text-xs font-medium text-white tabular-nums">
                {timeStr}
              </span>
            </>
          )}
        </div>
        {onFlip && (
          <button
            onClick={onFlip}
            aria-label="Flip camera"
            className="flex size-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm"
          >
            ↺
          </button>
        )}
      </div>

      {/* Bottom bar: effects + capture + mode */}
      <div className="absolute right-0 bottom-0 left-0 flex items-center justify-center gap-6 pb-6">
        {onEffects && (
          <button
            onClick={onEffects}
            aria-label="Effects"
            className="flex size-10 items-center justify-center rounded-full bg-white/10 text-xs text-white backdrop-blur-sm"
          >
            ✨
          </button>
        )}

        {/* Capture button — the iconic record/shutter button */}
        <button
          onClick={onCapture}
          aria-label={recording ? "Stop" : mode === "photo" ? "Take photo" : "Record"}
          className="flex size-[72px] items-center justify-center rounded-full border-[3px] border-white"
        >
          {mode === "photo" ? (
            <div className="size-[56px] rounded-full bg-white" />
          ) : recording ? (
            <div className="size-6 rounded-[var(--radius-sm,7px)] bg-destructive" />
          ) : (
            <div className="size-[56px] rounded-full bg-destructive" />
          )}
        </button>

        <div className="flex size-10 items-center justify-center text-[10px] font-medium text-white/60 capitalize">
          {mode}
        </div>
      </div>
    </div>
  )
}

export { CameraViewfinder }
export type { CameraViewfinderProps }
