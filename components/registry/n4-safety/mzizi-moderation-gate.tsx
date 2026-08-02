"use client"
import * as React from "react"
import { cn } from "@/lib/utils"
import { useNyuchiHarness } from "@/lib/harness"

type ModerationStatus = "approved" | "pending" | "reviewing" | "flagged" | "rejected"

const STATUS_CONFIG: Record<
  ModerationStatus,
  { color: string; label: string; showContent: boolean }
> = {
  approved: { color: "var(--moderation-approved, #22C55E)", label: "Approved", showContent: true },
  pending: {
    color: "var(--moderation-pending, #F59E0B)",
    label: "Under Review",
    showContent: false,
  },
  reviewing: {
    color: "var(--moderation-pending, #3B82F6)",
    label: "Being Reviewed",
    showContent: false,
  },
  flagged: {
    color: "var(--moderation-flagged, #F97316)",
    label: "Flagged for Review",
    showContent: false,
  },
  rejected: {
    color: "var(--moderation-rejected, #EF4444)",
    label: "Content Removed",
    showContent: false,
  },
}

interface NyuchiModerationGateProps {
  children: React.ReactNode
  status: ModerationStatus
  moderationSource?: "device" | "edge" | "cloud"
  reason?: string
  estimatedWait?: string
  onAppeal?: () => void
  loading?: boolean
  className?: string
}

export function NyuchiModerationGate({
  children,
  status,
  moderationSource,
  reason,
  estimatedWait,
  onAppeal,
  loading = false,
  className,
}: NyuchiModerationGateProps) {
  const { motion } = useNyuchiHarness("moderation-gate")
  const animStyle = React.useMemo(
    () =>
      motion.prefersReduced
        ? {}
        : {
            animation: `nyuchi-fade-slide-up ${motion.enterDuration}ms ${motion.enterEasing} both`,
          },
    [motion]
  )

  if (loading)
    return (
      <div
        data-slot="nyuchi-moderation-gate"
        data-portal="https://mzizi.dev/components/nyuchi-moderation-gate"
        data-loading
        role="status"
        className="h-28 animate-pulse rounded-[var(--radius-lg,14px)] bg-muted"
      />
    )

  const config = STATUS_CONFIG[status]
  if (config.showContent) return <>{children}</>

  return (
    <div
      data-slot="nyuchi-moderation-gate"
      role="status"
      aria-live="polite"
      style={animStyle}
      className={cn(
        "flex flex-col items-center gap-3 rounded-[var(--radius-lg,14px)] bg-card p-5 text-center ring-1 ring-foreground/10",
        className
      )}
    >
      <div
        className="flex size-12 items-center justify-center rounded-full"
        style={{ backgroundColor: `color-mix(in srgb, ${config.color} 15%, transparent)` }}
      >
        {status === "reviewing" || status === "pending" ? (
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke={config.color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="animate-spin"
          >
            <path d="M21 12a9 9 0 11-6.219-8.56" />
          </svg>
        ) : (
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke={config.color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        )}
      </div>
      <p className="text-sm font-semibold" style={{ color: config.color }}>
        {config.label}
      </p>
      {reason && <p className="text-xs text-muted-foreground">{reason}</p>}
      {estimatedWait && (status === "pending" || status === "reviewing") && (
        <p className="text-xs text-muted-foreground">Estimated wait: {estimatedWait}</p>
      )}
      {moderationSource && (
        <p className="text-xs text-muted-foreground/60">
          Checked by:{" "}
          {moderationSource === "device"
            ? "On-device AI"
            : moderationSource === "edge"
              ? "Edge AI"
              : "Shamwari Cloud"}
        </p>
      )}
      {onAppeal && status === "rejected" && (
        <button
          onClick={onAppeal}
          className="min-h-[48px] rounded-full bg-muted px-5 text-xs font-medium text-foreground transition-colors hover:bg-muted/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary,#00B0FF)]"
        >
          Appeal Decision
        </button>
      )}
    </div>
  )
}
export type { ModerationStatus, NyuchiModerationGateProps }
