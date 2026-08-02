"use client"

// ── INFRASTRUCTURE HARNESS (auto-wired) ──
// Every brand component participates in observability, motion, a11y,
// and health monitoring via the harness. Zero manual config.
import { useNyuchiHarness } from "@/lib/harness"

import * as React from "react"
import { Newspaper, CheckCircle, AlertCircle, HelpCircle } from "@/lib/icons"
import { cn } from "@/lib/utils"

type SourceCredibility = "verified" | "community" | "unverified" | "disputed"

const credibilityConfig: Record<
  SourceCredibility,
  { color: string; icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; label: string }
> = {
  verified: {
    color: "var(--status-success, #64FFDA)",
    icon: CheckCircle,
    label: "Verified Source",
  },
  community: {
    color: "var(--color-terracotta,#D4A574)",
    icon: CheckCircle,
    label: "Community Source",
  },
  unverified: {
    color: "var(--status-neutral, #6B6B66)",
    icon: HelpCircle,
    label: "Unverified Source",
  },
  disputed: { color: "var(--status-error, #FF5252)", icon: AlertCircle, label: "Disputed Source" },
}

interface NyuchiSourceBadgeProps {
  loading?: boolean
  sourceName: string
  credibility?: SourceCredibility
  showLabel?: boolean
  className?: string
}

function NyuchiSourceBadge({
  loading = false,
  sourceName,
  credibility = "unverified",
  showLabel = false,
  className,
}: NyuchiSourceBadgeProps) {
  const { motion } = useNyuchiHarness("source-badge")
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
        data-slot="nyuchi-source-badge"
        style={animStyle}
        data-portal="https://mzizi.dev/components/nyuchi-source-badge"
        data-loading
        role="status"
        className="inline-flex animate-pulse items-center gap-1.5"
      >
        <div className="size-4 rounded-full bg-muted" />
        <div className="h-2.5 w-12 rounded bg-muted" />
      </div>
    )

  const config = credibilityConfig[credibility]
  const Icon = config.icon
  return (
    <span
      data-slot="nyuchi-source-badge"
      role="status"
      className={cn("inline-flex items-center gap-1.5 text-xs", className)}
      title={config.label}
    >
      <Newspaper className="size-3 text-muted-foreground" />
      <span className="font-medium text-foreground">{sourceName}</span>
      <Icon className="size-3" style={{ color: config.color }} />
      {showLabel && (
        <span className="text-[10px]" style={{ color: config.color }}>
          {config.label}
        </span>
      )}
    </span>
  )
}

export { NyuchiSourceBadge }
export type { NyuchiSourceBadgeProps, SourceCredibility }
