"use client"

// ── INFRASTRUCTURE HARNESS (auto-wired) ──
// Every brand component participates in observability, motion, a11y,
// and health monitoring via the harness. Zero manual config.
import { useNyuchiHarness } from "@/lib/harness"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/* ═══════════════════════════════════════════════════════════════
   MUKOKO STATS ROW — Brand Data Display Component
   
   The compact, horizontal metrics bar used on home screens,
   dashboards, and admin views. Shows 2–4 stat blocks in a
   single card with mineral-colored icon backgrounds.
   
   Two layout variants:
   - inline: single-row card with all stats side by side (mobile)
   - grid: 2×2 or responsive grid of stat cards (dashboard)
   
   Design identity markers:
   - 14px card radius, 7px icon container radius
   - Icon sits in a translucent mineral-colored square
   - Value is large/bold, label is 10px uppercase muted
   - Optional trend badge (green up, red down)
   ═══════════════════════════════════════════════════════════════ */

const layoutVariants = cva("", {
  variants: {
    layout: {
      inline:
        "flex flex-wrap items-center gap-4 rounded-[var(--radius-card,14px)] bg-card p-3 ring-1 ring-foreground/10",
      grid: "grid gap-3",
    },
  },
  defaultVariants: { layout: "inline" },
})

interface StatItem {
  /** Lucide icon component */
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  /** Short label (e.g. "Active Events") */
  label: string
  /** Display value (e.g. "12", "2.8K", "$450") */
  value: string | number
  /** Mineral color for icon background */
  color?: string
  /** Trend string (e.g. "+12%", "-3%") — auto-colored green/red */
  trend?: string
}

interface NyuchiStatsRowProps extends VariantProps<typeof layoutVariants> {
  /** Renders the skeleton branch this component already implements. */
  loading?: boolean
  stats: StatItem[]
  /** Grid columns (only for grid layout, default 2) */
  columns?: 2 | 3 | 4
  className?: string
}

const gridColsMap = {
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-2 sm:grid-cols-4",
} as const

function NyuchiStatsRow({
  loading = false,
  stats,
  layout = "inline",
  columns = 2,
  className,
}: NyuchiStatsRowProps) {
  const { motion } = useNyuchiHarness("stats-row")
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
        data-slot="nyuchi-stats-row"
        data-portal="https://mzizi.dev/components/nyuchi-stats-row"
        data-loading
        role="group"
        aria-label="Statistics"
        className="flex animate-pulse gap-4"
      >
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex-1 space-y-1.5 rounded-[var(--radius-md,12px)] bg-muted p-3">
            <div className="h-2.5 w-1/2 rounded bg-foreground/5" />
            <div className="h-5 w-2/3 rounded bg-foreground/5" />
          </div>
        ))}
      </div>
    )

  const isGrid = layout === "grid"

  return (
    <div
      data-slot="nyuchi-stats-row"
      style={animStyle}
      role="group"
      aria-label="Statistics"
      data-layout={layout}
      className={cn(layoutVariants({ layout }), isGrid && gridColsMap[columns], className)}
    >
      {stats.map((stat, i) => {
        const Icon = stat.icon
        const iconColor = stat.color || "var(--color-malachite)"
        const isPositiveTrend = stat.trend?.startsWith("+")
        const isNegativeTrend = stat.trend?.startsWith("-")

        /* ── Grid variant: each stat is its own card ─────────── */
        if (isGrid) {
          return (
            <div
              key={i}
              className="flex flex-col gap-2 rounded-[var(--radius-card,14px)] bg-card p-4 ring-1 ring-foreground/10"
            >
              <div className="flex items-start justify-between">
                <div
                  className="flex size-8 items-center justify-center rounded-[var(--radius-inner,7px)]"
                  style={{ backgroundColor: `color-mix(in srgb, ${iconColor} 20%, transparent)` }}
                >
                  <Icon className="size-4" style={{ color: iconColor }} />
                </div>
                {stat.trend && (
                  <span
                    className={cn(
                      "text-[11px] font-medium",
                      isPositiveTrend && "text-emerald-400",
                      isNegativeTrend && "text-red-400",
                      !isPositiveTrend && !isNegativeTrend && "text-muted-foreground"
                    )}
                  >
                    {stat.trend}
                  </span>
                )}
              </div>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </div>
          )
        }

        /* ── Inline variant: compact side-by-side ────────────── */
        return (
          <div key={i} className="flex min-w-[120px] items-center gap-2">
            <div
              className="flex size-8 shrink-0 items-center justify-center rounded-[var(--radius-inner,7px)]"
              style={{ backgroundColor: `color-mix(in srgb, ${iconColor} 20%, transparent)` }}
            >
              <Icon className="size-4" style={{ color: iconColor }} />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] text-muted-foreground">{stat.label}</div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[13px] font-semibold text-foreground">{stat.value}</span>
                {stat.trend && (
                  <span
                    className={cn(
                      "text-[10px] font-medium",
                      isPositiveTrend && "text-emerald-400",
                      isNegativeTrend && "text-red-400"
                    )}
                  >
                    {stat.trend}
                  </span>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export { NyuchiStatsRow }
export type { NyuchiStatsRowProps, StatItem }
