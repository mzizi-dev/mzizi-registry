"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { useNyuchiHarness } from "@/lib/harness"

/* ═══════════════════════════════════════════════════════════════
   NYUCHI GAUGE CARD — Layer 3 Brand Component (Pre-Wired)
   
   Radial arc gauge with value, label, and context.
   Universal pattern from mukoko-weather MetricCard.
   ✅ HARNESS  ✅ TOKENS  ✅ ARIA  ✅ LOADING  ✅ MOTION
   ═══════════════════════════════════════════════════════════════ */

const ARC_R = 26,
  ARC_C = 2 * Math.PI * ARC_R,
  ARC_LEN = ARC_C * 0.75

interface NyuchiGaugeCardProps {
  loading?: boolean
  icon?: React.ReactNode
  label: string
  value: string
  percent: number
  context?: string
  contextColor?: string
  strokeColor?: string
  mineral?: "cobalt" | "tanzanite" | "malachite" | "gold" | "terracotta"
  className?: string
}

const mineralStrokes: Record<string, string> = {
  cobalt: "var(--color-cobalt, #00B0FF)",
  tanzanite: "var(--color-tanzanite, #B388FF)",
  malachite: "var(--color-malachite, #64FFDA)",
  gold: "var(--color-gold, #FFD740)",
  terracotta: "var(--color-terracotta, #D4A574)",
}

export function NyuchiGaugeCard({
  loading = false,
  icon,
  label,
  value,
  percent,
  context,
  contextColor,
  strokeColor,
  mineral = "cobalt",
  className,
}: NyuchiGaugeCardProps) {
  const { motion } = useNyuchiHarness("gauge-card")
  const animStyle = React.useMemo(
    () =>
      motion.prefersReduced
        ? {}
        : {
            animation: `nyuchi-fade-slide-up ${motion.enterDuration}ms ${motion.enterEasing} both`,
          },
    [motion]
  )

  const color = strokeColor || mineralStrokes[mineral]
  const filled = (Math.max(0, Math.min(100, percent)) / 100) * ARC_LEN

  if (loading) {
    return (
      <div
        data-slot="nyuchi-gauge-card"
        data-portal="https://mzizi.dev/components/nyuchi-gauge-card"
        data-loading
        role="article"
        className="flex animate-pulse flex-col items-center gap-3 rounded-[var(--radius-lg,14px)] bg-card p-4 ring-1 ring-foreground/10"
      >
        <div className="size-16 rounded-full bg-muted" />
        <div className="h-3 w-16 rounded bg-muted" />
        <div className="h-2.5 w-24 rounded bg-muted" />
      </div>
    )
  }

  return (
    <div
      data-slot="nyuchi-gauge-card"
      role="article"
      style={animStyle}
      className={cn(
        "flex flex-col items-center gap-2 rounded-[var(--radius-lg,14px)] bg-card p-4 text-center ring-1 ring-foreground/10 transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary,#00B0FF)]",
        className
      )}
    >
      {/* Arc gauge */}
      <div
        className="relative flex shrink-0 items-center justify-center"
        role="meter"
        aria-valuenow={Math.round(percent)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={value}
      >
        <svg
          width="72"
          height="72"
          viewBox="0 0 64 64"
          className="overflow-visible"
          aria-hidden="true"
        >
          <circle
            cx="32"
            cy="32"
            r={ARC_R}
            fill="none"
            className="stroke-muted-foreground/15"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={`${ARC_LEN} ${ARC_C}`}
            transform="rotate(135 32 32)"
          />
          <circle
            cx="32"
            cy="32"
            r={ARC_R}
            fill="none"
            style={{ stroke: color }}
            className="transition-all duration-500"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={`${filled} ${ARC_C}`}
            transform="rotate(135 32 32)"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-base font-bold text-foreground">
          {value}
        </span>
      </div>
      {/* Label */}
      <div className="min-w-0">
        <div className="flex items-center justify-center gap-1.5">
          {icon && (
            <span className="text-muted-foreground" aria-hidden="true">
              {icon}
            </span>
          )}
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
        </div>
        {context && (
          <p className={cn("mt-1 text-sm", contextColor || "text-muted-foreground")}>{context}</p>
        )}
      </div>
    </div>
  )
}
