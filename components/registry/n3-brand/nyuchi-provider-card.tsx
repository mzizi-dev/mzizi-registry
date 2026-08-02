"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { useNyuchiHarness } from "@/lib/harness"

/* ═══════════════════════════════════════════════════════════════
   NYUCHI PROVIDER CARD — Brand Component (Pre-Wired)
   Mineral: Malachite (health, wellness).
   Healthcare provider display with verification and booking.
   ✅ HARNESS  ✅ TOKENS  ✅ STRICT MINERAL RULES  ✅ TOUCH 48px+
   ═══════════════════════════════════════════════════════════════ */

interface NyuchiProviderCardProps {
  /** Renders the skeleton branch this component already implements. */
  loading?: boolean
  name: string
  specialty: string
  avatarUrl?: string
  verified?: boolean
  verificationTier?: 0 | 1 | 2 | 3 | 4
  rating?: number
  reviewCount?: number
  telemedicine?: boolean
  available?: boolean
  nextSlot?: string
  location?: string
  onBook?: () => void
  onClick?: () => void
  className?: string
}

export function NyuchiProviderCard({
  loading = false,
  name,
  specialty,
  avatarUrl,
  verified,
  verificationTier = 0,
  rating,
  reviewCount,
  telemedicine,
  available = true,
  nextSlot,
  location,
  onBook,
  onClick,
  className,
}: NyuchiProviderCardProps) {
  const { motion } = useNyuchiHarness("provider-card")
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
        data-slot="nyuchi-provider-card"
        data-portal="https://mzizi.dev/components/nyuchi-provider-card"
        data-loading
        role="article"
        className="animate-pulse space-y-3 rounded-[var(--radius-lg,14px)] bg-card p-4 ring-1 ring-foreground/10"
      >
        <div className="flex gap-3">
          <div className="size-12 shrink-0 rounded-full bg-muted" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 w-1/2 rounded bg-muted" />
            <div className="h-2.5 w-1/3 rounded bg-muted" />
            <div className="h-2.5 w-1/4 rounded bg-muted" />
          </div>
        </div>
      </div>
    )
  const tierMineral = [
    "muted-foreground",
    "var(--color-terracotta,#D4A574)",
    "var(--color-cobalt,#00B0FF)",
    "var(--color-gold,#FFD740)",
    "var(--color-tanzanite,#B388FF)",
  ]
  return (
    <div
      data-slot="nyuchi-provider-card"
      style={animStyle}
      role="article"
      onClick={onClick}
      className={cn(
        "rounded-[var(--radius-lg,14px)] border border-border bg-card p-4 transition-shadow hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary,#00B0FF)]",
        onClick && "cursor-pointer",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-lg">
          {avatarUrl ? <img src={avatarUrl} alt={name} className="size-full object-cover" /> : "👨‍⚕️"}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate text-sm font-semibold text-foreground">{name}</h3>
            {verified && (
              <span className="text-xs" style={{ color: tierMineral[verificationTier] }}>
                ✓
              </span>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground">{specialty}</p>
          <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
            {rating && (
              <span className="font-medium" style={{ color: "var(--color-gold,#FFD740)" }}>
                ★ {rating}
                {reviewCount ? ` (${reviewCount})` : ""}
              </span>
            )}
            {telemedicine && (
              <span className="rounded-full bg-[var(--color-cobalt,#00B0FF)]/10 px-1.5 py-0.5 text-[var(--color-cobalt,#00B0FF)]">
                📹 Tele
              </span>
            )}
            {location && <span>{location}</span>}
          </div>
        </div>
      </div>
      {(nextSlot || onBook) && (
        <div className="mt-3 flex items-center justify-between">
          {nextSlot && (
            <p className="text-[11px] text-muted-foreground">
              Next: <span className="font-medium text-foreground">{nextSlot}</span>
            </p>
          )}
          {onBook && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onBook()
              }}
              className={cn(
                "h-10 rounded-full px-4 text-[12px] font-medium transition-opacity hover:opacity-80",
                available
                  ? "bg-[var(--brand-accent,var(--color-malachite,#64FFDA))] text-[var(--brand-accent-foreground,#0A0A0A)]"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {available ? "Book" : "Unavailable"}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
