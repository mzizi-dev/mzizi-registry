"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { useNyuchiHarness } from "@/lib/harness"

/* ═══════════════════════════════════════════════════════════════
   NYUCHI SUITABILITY CARD — Layer 3 Brand Component (Pre-Wired)
   
   Scored recommendation card with mineral color mapping.
   ✅ HARNESS  ✅ TOKENS  ✅ ARIA  ✅ LOADING  ✅ MOTION
   ═══════════════════════════════════════════════════════════════ */

type SuitabilityLevel = "excellent" | "good" | "fair" | "poor" | "unsuitable"

const levelConfig: Record<SuitabilityLevel, { color: string; label: string }> = {
  excellent: { color: "var(--color-malachite, #64FFDA)", label: "Excellent" },
  good: { color: "var(--color-cobalt, #00B0FF)", label: "Good" },
  fair: { color: "var(--color-gold, #FFD740)", label: "Fair" },
  poor: { color: "var(--color-terracotta, #D4A574)", label: "Poor" },
  unsuitable: { color: "var(--color-destructive, #FF5252)", label: "Unsuitable" },
}

interface NyuchiSuitabilityCardProps {
  loading?: boolean
  icon?: React.ReactNode
  title: string
  description?: string
  level: SuitabilityLevel
  score?: number
  className?: string
}

export function NyuchiSuitabilityCard({
  loading = false,
  icon,
  title,
  description,
  level,
  score,
  className,
}: NyuchiSuitabilityCardProps) {
  const { motion } = useNyuchiHarness("suitability-card")
  const animStyle = React.useMemo(
    () =>
      motion.prefersReduced
        ? {}
        : {
            animation: `nyuchi-fade-slide-up ${motion.enterDuration}ms ${motion.enterEasing} both`,
          },
    [motion]
  )

  const config = levelConfig[level]

  if (loading) {
    return (
      <div
        data-slot="nyuchi-suitability-card"
        data-portal="https://mzizi.dev/components/nyuchi-suitability-card"
        data-loading
        role="article"
        className="flex animate-pulse items-center gap-3 rounded-[var(--radius-lg,14px)] bg-card p-4 ring-1 ring-foreground/10"
      >
        <div className="size-10 rounded-[var(--radius-sm,7px)] bg-muted" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3.5 w-1/2 rounded bg-muted" />
          <div className="h-2.5 w-2/3 rounded bg-muted" />
        </div>
        <div className="h-6 w-16 rounded-full bg-muted" />
      </div>
    )
  }

  return (
    <div
      data-slot="nyuchi-suitability-card"
      role="article"
      style={animStyle}
      className={cn(
        "flex items-center gap-3 rounded-[var(--radius-lg,14px)] bg-card p-4 ring-1 ring-foreground/10 transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary,#00B0FF)]",
        className
      )}
    >
      {icon && (
        <div
          className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-sm,7px)] text-lg"
          style={{
            backgroundColor: `color-mix(in srgb, ${config.color} 15%, transparent)`,
            color: config.color,
          }}
        >
          {icon}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </div>
      <span
        className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold"
        style={{
          backgroundColor: `color-mix(in srgb, ${config.color} 15%, transparent)`,
          color: config.color,
        }}
      >
        {score != null ? `${score}%` : config.label}
      </span>
    </div>
  )
}
