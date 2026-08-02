import * as React from "react"
import { cn } from "@/lib/utils"

type StatusType = "online" | "offline" | "busy" | "away" | "live"

interface StatusIndicatorProps {
  /** Status type */
  status: StatusType
  /** Optional label text */
  label?: string
  /** Show pulse animation for live/online status (default true) */
  pulse?: boolean
  /** Size of the indicator dot */
  size?: "sm" | "md" | "lg"
  className?: string
}

const STATUS_STYLES: Record<StatusType, string> = {
  online: "bg-[var(--status-success, var(--color-malachite, #64FFDA))]",
  live: "bg-[var(--status-success, var(--color-malachite, #64FFDA))]",
  offline: "bg-muted-foreground",
  busy: "bg-destructive",
  away: "bg-[var(--status-warning, var(--color-gold, #FFD740))]",
}

const STATUS_LABELS: Record<StatusType, string> = {
  online: "Online",
  offline: "Offline",
  busy: "Busy",
  away: "Away",
  live: "Live",
}

const SIZE_STYLES: Record<string, string> = {
  sm: "size-2",
  md: "size-2.5",
  lg: "size-3",
}

function StatusIndicator({
  status,
  label,
  pulse = true,
  size = "md",
  className,
}: StatusIndicatorProps) {
  const shouldPulse = pulse && (status === "online" || status === "live")
  const displayLabel = label ?? STATUS_LABELS[status]

  return (
    <div
      data-slot="status-indicator"
      data-portal="https://mzizi.dev/components/status-indicator"
      className={cn("inline-flex items-center gap-1.5", className)}
    >
      <span className="relative flex">
        <span className={cn("rounded-full", SIZE_STYLES[size], STATUS_STYLES[status])} />
        {shouldPulse && (
          <span
            className={cn(
              "absolute inset-0 animate-ping rounded-full opacity-75",
              STATUS_STYLES[status]
            )}
          />
        )}
      </span>
      {displayLabel && <span className="text-xs text-muted-foreground">{displayLabel}</span>}
    </div>
  )
}

export { StatusIndicator }
export type { StatusIndicatorProps, StatusType }
