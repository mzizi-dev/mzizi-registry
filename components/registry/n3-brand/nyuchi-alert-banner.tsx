"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

/* ═══════════════════════════════════════════════════════════════
   NYUCHI ALERT BANNER — Brand Component (Pre-Wired)
   Universal mineral-coded severity alert. Used for weather, security, trust, system alerts.
   Cross-app alert displayed across the entire ecosystem.
   ✅ HARNESS  ✅ TOKENS  ✅ STRICT MINERAL RULES  ✅ TOUCH 48px+
   ═══════════════════════════════════════════════════════════════ */

interface NyuchiWeatherAlertProps {
  type: string
  severity: "watch" | "moderate" | "severe"
  headline: string
  description?: string
  areas?: string[]
  validFrom?: string
  validUntil?: string
  instructions?: string
  onDismiss?: () => void
  onDetails?: () => void
  className?: string
}

const severityConfig = {
  watch: {
    mineral: "var(--severity-cold, #3B82F6)",
    bg: "var(--color-cobalt,#00B0FF)",
    icon: "👁",
    label: "Watch",
  },
  moderate: {
    mineral: "var(--severity-high,var(--color-terracotta,#D4A574))",
    bg: "var(--color-terracotta,#D4A574)",
    icon: "⚠️",
    label: "Moderate",
  },
  severe: {
    mineral: "var(--severity-severe, #EF4444)",
    bg: "var(--color-gold,#FFD740)",
    icon: "🚨",
    label: "Severe",
  },
} as const

export function NyuchiWeatherAlert({
  type,
  severity,
  headline,
  description,
  areas,
  validFrom,
  validUntil,
  instructions,
  onDismiss,
  onDetails,
  className,
}: NyuchiWeatherAlertProps) {
  const config = severityConfig[severity]
  return (
    <div
      data-slot="nyuchi-alert-banner"
      data-portal="https://mzizi.dev/components/nyuchi-alert-banner"
      role="alert"
      className={cn("space-y-2 rounded-[var(--radius-lg,14px)] border-l-[3px] p-4", className)}
      style={{
        borderLeftColor: config.mineral,
        backgroundColor: `color-mix(in srgb, ${config.bg} 8%, var(--card))`,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span>{config.icon}</span>
          <span
            className="text-xs font-bold tracking-wider uppercase"
            style={{ color: config.mineral }}
          >
            {config.label} — {type}
          </span>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="min-h-[48px] text-sm text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary,#00B0FF)]"
            aria-label="Dismiss"
          >
            ✕
          </button>
        )}
      </div>
      <p
        className="text-sm font-semibold text-foreground"
        style={{ fontFamily: "var(--font-serif)" }}
      >
        {headline}
      </p>
      {description && (
        <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
      )}
      {areas && areas.length > 0 && (
        <p className="text-[11px] text-muted-foreground">Areas: {areas.join(", ")}</p>
      )}
      {(validFrom || validUntil) && (
        <p className="text-[10px] text-muted-foreground">
          {validFrom && `From ${validFrom}`}
          {validUntil && ` until ${validUntil}`}
        </p>
      )}
      {instructions && (
        <div className="rounded-[var(--radius-sm,7px)] bg-muted p-2.5">
          <p className="text-xs leading-relaxed text-foreground">⚡ {instructions}</p>
        </div>
      )}
      {onDetails && (
        <button
          onClick={onDetails}
          className="h-10 rounded-full px-4 text-[12px] font-medium transition-opacity hover:opacity-80"
          style={{ backgroundColor: config.mineral, color: "var(--foreground, #0A0A0A)" }}
        >
          View Details
        </button>
      )}
    </div>
  )
}
