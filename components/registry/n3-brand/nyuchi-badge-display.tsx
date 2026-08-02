"use client"

// ── INFRASTRUCTURE HARNESS (auto-wired) ──
// Every brand component participates in observability, motion, a11y,
// and health monitoring via the harness. Zero manual config.
import { useNyuchiHarness } from "@/lib/harness"

import * as React from "react"
import { Award, Lock } from "@/lib/icons"
import { cn } from "@/lib/utils"

interface BadgeItem {
  id: string
  name: string
  description: string
  icon?: string
  color?: string
  earnedAt?: string | Date
  rarity?: "common" | "uncommon" | "rare" | "legendary"
  locked?: boolean
}

const rarityColors = {
  common: "#6B6B66",
  uncommon: "var(--color-cobalt,#00B0FF)",
  rare: "var(--color-tanzanite,#B388FF)",
  legendary: "var(--color-gold,#FFD740)",
}

interface NyuchiBadgeDisplayProps {
  loading?: boolean
  badges: BadgeItem[]
  layout?: "grid" | "strip"
  maxVisible?: number
  className?: string
}

function NyuchiBadgeDisplay({
  loading = false,
  badges,
  layout = "grid",
  maxVisible,
  className,
}: NyuchiBadgeDisplayProps) {
  const { motion } = useNyuchiHarness("badge-display")
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
        data-slot="nyuchi-badge-display"
        data-portal="https://mzizi.dev/components/nyuchi-badge-display"
        data-loading
        role="list"
        aria-label="Badges"
        className="flex animate-pulse gap-2"
      >
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="size-12 rounded-[var(--radius-md,12px)] bg-muted" />
        ))}
      </div>
    )

  const visible = maxVisible ? badges.slice(0, maxVisible) : badges
  const remaining = maxVisible ? Math.max(badges.length - maxVisible, 0) : 0

  if (layout === "strip") {
    return (
      <div
        data-slot="nyuchi-badge-display"
        role="list"
        aria-label="Badges"
        className={cn("flex items-center gap-2", className)}
      >
        {visible.map((b) => {
          const color = b.color || rarityColors[b.rarity || "common"]
          return (
            <div
              key={b.id}
              title={`${b.name}${b.locked ? " (Locked)" : ""}`}
              className={cn(
                "flex size-9 items-center justify-center rounded-full",
                b.locked && "opacity-30"
              )}
              style={{ backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)` }}
            >
              {b.locked ? (
                <Lock className="size-4 text-muted-foreground" />
              ) : (
                <Award className="size-4" style={{ color }} />
              )}
            </div>
          )
        })}
        {remaining > 0 && (
          <span className="text-xs font-medium text-muted-foreground">+{remaining}</span>
        )}
      </div>
    )
  }

  return (
    <div
      data-slot="nyuchi-badge-display"
      style={animStyle}
      role="list"
      aria-label="Badges"
      className={cn("grid grid-cols-4 gap-3", className)}
    >
      {visible.map((b) => {
        const color = b.color || rarityColors[b.rarity || "common"]
        return (
          <div
            key={b.id}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-[var(--radius-card,14px)] bg-card p-3 text-center ring-1 ring-foreground/10",
              b.locked && "opacity-30"
            )}
          >
            <div
              className="flex size-10 items-center justify-center rounded-full"
              style={{ backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)` }}
            >
              {b.locked ? (
                <Lock className="size-5 text-muted-foreground" />
              ) : (
                <Award className="size-5" style={{ color }} />
              )}
            </div>
            <span className="line-clamp-1 text-[10px] font-medium text-foreground">{b.name}</span>
            {b.rarity && !b.locked && (
              <span className="text-[8px] font-semibold tracking-wider uppercase" style={{ color }}>
                {b.rarity}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

export { NyuchiBadgeDisplay }
export type { NyuchiBadgeDisplayProps, BadgeItem }
