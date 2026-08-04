"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface TimeTrackerProps extends React.ComponentProps<"div"> {
  /** Initial elapsed seconds */
  initialSeconds?: number
  /** Called when timer state changes */
  onStateChange?: (state: "running" | "paused" | "stopped", elapsed: number) => void
  /** Label for what is being tracked */
  label?: string
  /** Compact inline mode */
  compact?: boolean
}

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
  return `${m}:${s.toString().padStart(2, "0")}`
}

function TimeTracker({
  initialSeconds = 0,
  onStateChange,
  label,
  compact = false,
  className,
  ...props
}: TimeTrackerProps) {
  const [elapsed, setElapsed] = React.useState(initialSeconds)
  const [state, setState] = React.useState<"running" | "paused" | "stopped">("stopped")
  const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null)

  React.useEffect(() => {
    if (state === "running") {
      intervalRef.current = setInterval(() => setElapsed((e) => e + 1), 1000)
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [state])

  const toggle = () => {
    const next = state === "running" ? "paused" : "running"
    setState(next)
    onStateChange?.(next, elapsed)
  }

  const stop = () => {
    setState("stopped")
    onStateChange?.("stopped", elapsed)
    setElapsed(0)
  }

  return (
    <div
      data-slot="time-tracker"
      data-portal="https://mzizi.dev/components/time-tracker"
      role="timer"
      aria-label="Time tracker"
      className={cn(
        compact
          ? "inline-flex items-center gap-2"
          : "flex items-center gap-3 rounded-[var(--radius-lg,14px)] border border-border bg-card px-4 py-3",
        className
      )}
      {...props}
    >
      {label && !compact && <span className="text-xs text-muted-foreground">{label}</span>}
      <span className={cn("font-mono tabular-nums", compact ? "text-sm" : "text-lg font-bold")}>
        {formatElapsed(elapsed)}
      </span>
      <div className="flex gap-1">
        <button
          onClick={toggle}
          className={cn(
            "rounded-full px-3 text-xs font-medium",
            compact ? "h-7" : "h-8",
            state === "running"
              ? "bg-[var(--color-gold,#FFD740)]/15 text-[var(--color-gold,#FFD740)]"
              : "bg-[var(--color-malachite,#64FFDA)]/15 text-[var(--color-malachite,#64FFDA)]"
          )}
        >
          {state === "running" ? "Pause" : "Start"}
        </button>
        {(state === "running" || state === "paused") && (
          <button
            onClick={stop}
            className={cn(
              "rounded-full bg-muted px-3 text-xs font-medium text-muted-foreground",
              compact ? "h-7" : "h-8"
            )}
          >
            Stop
          </button>
        )}
      </div>
    </div>
  )
}

export { TimeTracker }
export type { TimeTrackerProps }
