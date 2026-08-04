"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { useNyuchiHarness } from "@/lib/harness"

/* ═══════════════════════════════════════════════════════════════
   NYUCHI GROUP CARD — Brand Component (Pre-Wired)
   Mineral: Terracotta (community, Ubuntu, connection).
   ✅ HARNESS  ✅ TOKENS  ✅ STRICT MINERAL RULES  ✅ TOUCH 48px+
   ═══════════════════════════════════════════════════════════════ */

interface CircleMember {
  name: string
  avatarUrl?: string
}

interface NyuchiGroupCardProps {
  loading?: boolean
  name: string
  description?: string
  memberCount: number
  members?: CircleMember[]
  topics?: string[]
  joined?: boolean
  activity?: "quiet" | "active" | "buzzing"
  privacy?: "open" | "closed" | "secret"
  coverUrl?: string
  onJoin?: () => void
  onClick?: () => void
  className?: string
}

const activityDot = {
  quiet: "bg-muted-foreground/40",
  active: "bg-[var(--color-malachite,#64FFDA)]",
  buzzing: "bg-[var(--color-gold,#FFD740)]",
} as const

export function NyuchiGroupCard({
  loading = false,
  name,
  description,
  memberCount,
  members = [],
  topics = [],
  joined = false,
  activity = "active",
  privacy = "open",
  coverUrl,
  onJoin,
  onClick,
  className,
}: NyuchiGroupCardProps) {
  const { motion } = useNyuchiHarness("group-card")
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
        data-slot="nyuchi-group-card"
        data-loading
        role="article"
        className="animate-pulse overflow-hidden rounded-[var(--radius-lg,14px)] bg-card ring-1 ring-foreground/10"
      >
        <div className="h-20 bg-muted" />
        <div className="space-y-2 p-4">
          <div className="h-4 w-1/2 rounded bg-muted" />
          <div className="h-2.5 w-2/3 rounded bg-muted" />
          <div className="mt-2 flex gap-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="size-6 rounded-full bg-muted" />
            ))}
          </div>
        </div>
      </div>
    )
  return (
    <div
      data-slot="nyuchi-group-card"
      role="article"
      onClick={onClick}
      style={animStyle}
      className={cn(
        "group/circle overflow-hidden rounded-[var(--radius-lg,14px)] border border-border bg-card text-card-foreground transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary,#00B0FF)]",
        onClick && "cursor-pointer",
        className
      )}
    >
      <div
        className="relative h-20 bg-gradient-to-br from-[var(--brand-accent,var(--color-terracotta,#D4A574))]/20 to-[var(--brand-accent,var(--color-terracotta,#D4A574))]/5"
        style={
          coverUrl
            ? {
                backgroundImage: `url(${coverUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : undefined
        }
      >
        <span className="absolute top-3 right-3 rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-medium text-muted-foreground backdrop-blur-sm">
          {privacy === "secret" ? "🔒 Secret" : privacy === "closed" ? "🔐 Closed" : "🌍 Open"}
        </span>
      </div>
      <div className="space-y-3 p-4">
        <div>
          <h3
            className="truncate text-sm font-semibold text-foreground"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            {name}
          </h3>
          <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className={cn("size-1.5 rounded-full", activityDot[activity])} />
            <span>{activity}</span>
            <span>·</span>
            <span>{memberCount.toLocaleString()} members</span>
          </div>
        </div>
        {description && (
          <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
        {members.length > 0 && (
          <div className="flex items-center -space-x-2">
            {members.slice(0, 5).map((m, i) => (
              <div
                key={i}
                className="flex size-7 items-center justify-center overflow-hidden rounded-full border-2 border-card bg-muted text-[9px] font-bold text-muted-foreground"
              >
                {m.avatarUrl ? (
                  <img src={m.avatarUrl} alt={m.name} className="size-full object-cover" />
                ) : (
                  m.name.charAt(0).toUpperCase()
                )}
              </div>
            ))}
            {memberCount > 5 && (
              <div className="flex size-7 items-center justify-center rounded-full border-2 border-card bg-muted text-[9px] font-medium text-muted-foreground">
                +{Math.min(memberCount - 5, 99)}
              </div>
            )}
          </div>
        )}
        {topics.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {topics.slice(0, 3).map((t) => (
              <span
                key={t}
                className="rounded-full bg-[var(--brand-accent,var(--color-terracotta,#D4A574))]/10 px-2 py-0.5 text-[10px] font-medium text-[var(--brand-accent,var(--color-terracotta,#D4A574))]"
              >
                {t}
              </span>
            ))}
          </div>
        )}
        {onJoin && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onJoin()
            }}
            className={cn(
              "flex h-12 w-full items-center justify-center rounded-full text-[13px] font-medium transition-opacity hover:opacity-80",
              joined
                ? "border border-border bg-muted text-foreground"
                : "bg-[var(--brand-accent,var(--color-terracotta,#D4A574))] text-[var(--brand-accent-foreground,#0A0A0A)]"
            )}
          >
            {joined ? "Joined" : "Join Circle"}
          </button>
        )}
      </div>
    </div>
  )
}
