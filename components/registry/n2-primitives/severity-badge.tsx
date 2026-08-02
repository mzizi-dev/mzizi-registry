"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

/* ═══════════════════════════════════════════════════════════════
   SEVERITY BADGE — Layer 2 Primitive
   Mineral-mapped severity levels.
   ✅ TOKENS  ✅ ARIA  ✅ LOADING
   ═══════════════════════════════════════════════════════════════ */

type Severity = "low" | "moderate" | "high" | "severe" | "extreme" | "cold"

const severityColors: Record<Severity, { bg: string; text: string; dot: string }> = {
  low: {
    bg: "bg-[var(--severity-low, #22C55E)]/10",
    text: "text-[var(--severity-low, #22C55E)]",
    dot: "bg-[var(--severity-low, #22C55E)]",
  },
  moderate: {
    bg: "bg-[var(--severity-moderate, #F59E0B)]/10",
    text: "text-[var(--severity-moderate, #F59E0B)]",
    dot: "bg-[var(--severity-moderate, #F59E0B)]",
  },
  high: {
    bg: "bg-[var(--severity-high,#FF7043)]/10",
    text: "text-orange-400",
    dot: "bg-[var(--severity-high,#FF7043)]",
  },
  severe: {
    bg: "bg-[var(--severity-extreme,#FF5252)]/10",
    text: "text-red-400",
    dot: "bg-[var(--severity-severe,#EF5350)]",
  },
  extreme: {
    bg: "bg-[var(--severity-extreme,#B71C1C)]/15",
    text: "text-red-300",
    dot: "bg-[var(--severity-severe,#EF5350)]",
  },
  cold: {
    bg: "bg-[var(--color-cobalt,#00B0FF)]/10",
    text: "text-[var(--color-cobalt,#00B0FF)]",
    dot: "bg-[var(--color-cobalt,#00B0FF)]",
  },
}

interface SeverityBadgeProps {
  severity: Severity
  label?: string
  showDot?: boolean
  loading?: boolean
  className?: string
}

export function SeverityBadge({
  severity,
  label,
  showDot = true,
  loading = false,
  className,
}: SeverityBadgeProps) {
  const colors = severityColors[severity]
  const displayLabel = label || severity.charAt(0).toUpperCase() + severity.slice(1)

  if (loading)
    return (
      <div
        data-slot="severity-badge"
        data-portal="https://mzizi.dev/components/severity-badge"
        data-loading
        className="h-6 w-16 animate-pulse rounded-full bg-muted"
      />
    )

  return (
    <span
      data-slot="severity-badge"
      role="status"
      aria-label={`Severity: ${displayLabel}`}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        colors.bg,
        colors.text,
        className
      )}
    >
      {showDot && <span className={cn("size-1.5 rounded-full", colors.dot)} aria-hidden="true" />}
      {displayLabel}
    </span>
  )
}
