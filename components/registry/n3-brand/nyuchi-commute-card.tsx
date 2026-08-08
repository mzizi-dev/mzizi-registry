"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { useNyuchiHarness } from "@/lib/harness"

/* ═══════════════════════════════════════════════════════════════
   NYUCHI COMMUTE CARD — Brand Component (Pre-Wired)
   Mineral: Gold (transport, movement).
   Saved commute route with quick-action departure button.
   ✅ HARNESS  ✅ TOKENS  ✅ STRICT MINERAL RULES  ✅ TOUCH 48px+
   ═══════════════════════════════════════════════════════════════ */

interface NyuchiCommuteCardProps {
  /** Renders the skeleton branch this component already implements. */
  loading?: boolean
  label: string
  origin: string
  destination: string
  mode?: "bus" | "kombi" | "taxi" | "walk" | "mixed"
  estimatedDuration?: string
  nextDeparture?: string
  frequency?: string
  onStart?: () => void
  onClick?: () => void
  className?: string
}

export function NyuchiCommuteCard({
  loading = false,
  label,
  origin,
  destination,
  mode = "bus",
  estimatedDuration,
  nextDeparture,
  frequency,
  onStart,
  onClick,
  className,
}: NyuchiCommuteCardProps) {
  const { motion } = useNyuchiHarness("commute-card")
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
        data-slot="nyuchi-commute-card"
        data-portal="https://mzizi.dev/components/nyuchi-commute-card"
        data-loading
        role="article"
        className="animate-pulse space-y-3 rounded-[var(--radius-lg,14px)] border-l-2 border-l-muted bg-card p-4"
      >
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-full bg-muted" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 w-1/3 rounded bg-muted" />
            <div className="h-2.5 w-2/3 rounded bg-muted" />
          </div>
        </div>
      </div>
    )
  const icons = { bus: "🚌", kombi: "🚐", taxi: "🚕", walk: "🚶", mixed: "🔀" }
  return (
    <div
      data-slot="nyuchi-commute-card"
      style={animStyle}
      role="article"
      onClick={onClick}
      className={cn(
        "min-h-[48px] rounded-[var(--radius-lg,14px)] border border-l-2 border-border border-l-[var(--color-gold,#FFD740)] bg-card p-4 transition-shadow hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary,#00B0FF)]",
        onClick && "cursor-pointer",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-full bg-[var(--color-gold,#FFD740)]/10 text-lg">
          {icons[mode]}
        </div>
        <div className="min-w-0 flex-1">
          <p
            className="text-sm font-semibold text-foreground"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            {label}
          </p>
          <p className="truncate text-[11px] text-muted-foreground">
            {origin} → {destination}
          </p>
        </div>
        {estimatedDuration && (
          <div className="text-right">
            <p className="text-sm font-bold text-foreground">{estimatedDuration}</p>
            <p className="text-[10px] text-muted-foreground">est.</p>
          </div>
        )}
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          {nextDeparture && <span>Next: {nextDeparture}</span>}
          {frequency && (
            <>
              <span>·</span>
              <span>{frequency}</span>
            </>
          )}
        </div>
        {onStart && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onStart()
            }}
            className="h-10 rounded-full bg-[var(--color-gold,#FFD740)] px-4 text-[12px] font-medium text-[var(--brand-accent-foreground,#0A0A0A)] transition-opacity hover:opacity-80"
          >
            Go →
          </button>
        )}
      </div>
    </div>
  )
}
