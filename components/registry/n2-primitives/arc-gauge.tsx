"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

/* ═══════════════════════════════════════════════════════════════
   ARC GAUGE — Layer 2 Primitive
   SVG radial arc gauge. 270° sweep, open at bottom.
   ✅ TOKENS  ✅ ARIA  ✅ LOADING  ✅ ANIMATION
   ═══════════════════════════════════════════════════════════════ */

const ARC_R = 26
const ARC_C = 2 * Math.PI * ARC_R
const ARC_SWEEP = 0.75
const ARC_LEN = ARC_C * ARC_SWEEP

interface ArcGaugeProps {
  /** Value as percentage (0-100) */
  percent: number
  /** Display value text (centered in the arc) */
  value: string
  /** Stroke color class or CSS color */
  strokeColor?: string
  /** Stroke class (Tailwind) — alternative to strokeColor */
  strokeClass?: string
  /** Size in pixels */
  size?: number
  /** Loading state */
  loading?: boolean
  /** Accessible label */
  ariaLabel?: string
  className?: string
}

export function ArcGauge({
  percent,
  value,
  strokeColor,
  strokeClass = "stroke-[var(--color-cobalt,#00B0FF)]",
  size = 72,
  loading = false,
  ariaLabel,
  className,
}: ArcGaugeProps) {
  const filled = (Math.max(0, Math.min(100, percent)) / 100) * ARC_LEN

  if (loading) {
    return (
      <div
        data-slot="arc-gauge"
        data-portal="https://mzizi.dev/components/arc-gauge"
        data-loading
        className={cn("animate-pulse rounded-full bg-muted", className)}
        style={{ width: size, height: size }}
      />
    )
  }

  return (
    <div
      data-slot="arc-gauge"
      role="meter"
      aria-valuenow={Math.round(percent)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel || value}
      className={cn("relative flex shrink-0 items-center justify-center", className)}
    >
      <svg
        width={size}
        height={size}
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
          className={cn("transition-all duration-500", strokeClass)}
          style={strokeColor ? { stroke: strokeColor } : undefined}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${ARC_C}`}
          transform="rotate(135 32 32)"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-foreground">
        {value}
      </span>
    </div>
  )
}
