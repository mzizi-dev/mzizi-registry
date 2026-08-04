"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type CallStatus = "connecting" | "active" | "paused" | "ended"

interface TelemedicineWidgetProps extends React.ComponentProps<"div"> {
  providerName: string
  providerAvatar?: string
  status?: CallStatus
  elapsed?: number
  micOn?: boolean
  cameraOn?: boolean
  onToggleMic?: () => void
  onToggleCamera?: () => void
  onEndCall?: () => void
}

function formatElapsed(s: number): string {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, "0")}`
}

function TelemedicineWidget({
  providerName,
  providerAvatar,
  status = "connecting",
  elapsed = 0,
  micOn = true,
  cameraOn = true,
  onToggleMic,
  onToggleCamera,
  onEndCall,
  className,
  ...props
}: TelemedicineWidgetProps) {
  return (
    <div
      data-slot="telemedicine-widget"
      data-portal="https://mzizi.dev/components/telemedicine-widget"
      className={cn(
        "overflow-hidden rounded-[var(--radius-xl,17px)] border border-border bg-[var(--muted,#050504)]",
        className
      )}
      {...props}
    >
      {/* Video area */}
      <div className="relative flex aspect-video items-center justify-center bg-[var(--card,#100F0E)]">
        <div className="flex flex-col items-center gap-2">
          <div className="flex size-16 items-center justify-center rounded-full bg-muted text-xl font-medium text-white/70">
            {providerAvatar ? (
              <img src={providerAvatar} alt="" className="size-full rounded-full object-cover" />
            ) : (
              providerName.charAt(0)
            )}
          </div>
          <span className="text-sm font-medium text-white/80">{providerName}</span>
          <span className="text-xs text-white/40">
            {status === "connecting"
              ? "Connecting…"
              : status === "active"
                ? formatElapsed(elapsed)
                : status === "paused"
                  ? "On hold"
                  : "Call ended"}
          </span>
        </div>

        {/* Connection pulse */}
        {status === "connecting" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="absolute size-24 animate-ping rounded-full bg-[var(--color-malachite,#64FFDA)]/10" />
          </div>
        )}

        {/* Self preview (bottom right) */}
        {status === "active" && cameraOn && (
          <div className="absolute right-3 bottom-3 h-20 w-28 rounded-[var(--radius-md,12px)] border border-white/10 bg-[#2A2A2A]" />
        )}
      </div>

      {/* Controls bar */}
      <div className="flex items-center justify-center gap-3 py-4">
        <button
          onClick={onToggleMic}
          aria-label={micOn ? "Mute" : "Unmute"}
          className={cn(
            "flex size-12 items-center justify-center rounded-full text-white transition-colors",
            micOn ? "bg-white/10 hover:bg-white/20" : "bg-destructive/80 hover:bg-destructive"
          )}
        >
          {micOn ? "🎤" : "🔇"}
        </button>
        <button
          onClick={onToggleCamera}
          aria-label={cameraOn ? "Camera off" : "Camera on"}
          className={cn(
            "flex size-12 items-center justify-center rounded-full text-white transition-colors",
            cameraOn ? "bg-white/10 hover:bg-white/20" : "bg-white/20"
          )}
        >
          {cameraOn ? "📷" : "📷̸"}
        </button>
        <button
          onClick={onEndCall}
          aria-label="End call"
          className="flex size-14 items-center justify-center rounded-full bg-destructive text-lg text-white shadow-lg hover:bg-destructive/80"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

export { TelemedicineWidget }
export type { TelemedicineWidgetProps }
