"use client"

// ── INFRASTRUCTURE HARNESS (auto-wired) ──
// Every brand component participates in observability, motion, a11y,
// and health monitoring via the harness. Zero manual config.
import { useNyuchiHarness } from "@/lib/harness"

import * as React from "react"
import { MapPin, Star, Navigation } from "@/lib/icons"
import { cn } from "@/lib/utils"

type PlaceVerification = "unverified" | "community" | "otp" | "government" | "licensed"

interface NyuchiPlaceCardProps {
  /** Renders the skeleton branch this component already implements. */
  loading?: boolean
  name: string
  category?: string
  address?: string
  distance?: string
  rating?: number
  reviewCount?: number
  image?: string
  openNow?: boolean
  verificationTier?: PlaceVerification
  mineral?: "malachite" | "cobalt" | "gold" | "tanzanite" | "terracotta"
  variant?: "row" | "compact"
  onClick?: () => void
  className?: string
}

const mineralColors: Record<string, string> = {
  malachite: "var(--color-malachite,#64FFDA)",
  cobalt: "var(--color-cobalt,#00B0FF)",
  gold: "var(--color-gold,#FFD740)",
  tanzanite: "var(--color-tanzanite,#B388FF)",
  terracotta: "var(--color-terracotta,#D4A574)",
}

const tierColors: Record<string, string> = {
  community: "var(--color-terracotta,#D4A574)",
  otp: "var(--color-cobalt,#00B0FF)",
  government: "var(--color-gold,#FFD740)",
  licensed: "var(--color-tanzanite,#B388FF)",
}

function NyuchiPlaceCard({
  loading = false,
  name,
  category,
  address,
  distance,
  rating,
  reviewCount,
  image,
  openNow,
  verificationTier = "unverified",
  mineral = "malachite",
  variant = "row",
  onClick,
  className,
}: NyuchiPlaceCardProps) {
  const { motion } = useNyuchiHarness("place-card")
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
        data-slot="nyuchi-place-card"
        data-portal="https://mzizi.dev/components/nyuchi-place-card"
        data-loading
        role="article"
        className="animate-pulse space-y-3 rounded-[var(--radius-lg,14px)] bg-card p-4 ring-1 ring-foreground/10"
      >
        <div className="flex gap-3">
          <div className="size-20 shrink-0 rounded-[var(--radius-md,12px)] bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-3/4 rounded bg-muted" />
            <div className="h-2.5 w-full rounded bg-muted" />
            <div className="h-2.5 w-1/3 rounded bg-muted" />
          </div>
        </div>
      </div>
    )

  const accent = mineralColors[mineral]
  const isVerified = verificationTier !== "unverified"

  if (variant === "compact") {
    return (
      <div
        data-slot="nyuchi-place-card"
        style={animStyle}
        role="article"
        tabIndex={0}
        onClick={onClick}
        className={cn(
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary,#00B0FF)]",
          "overflow-hidden rounded-[var(--radius-card,14px)] bg-card ring-1 ring-foreground/10",
          onClick && "cursor-pointer transition-shadow hover:shadow-md",
          className
        )}
      >
        {image && (
          <div className="relative aspect-[var(--aspect-media,1/1)] overflow-hidden bg-muted">
            <img src={image} alt={name} className="size-full object-cover" />
            {distance && (
              <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                <Navigation className="size-2.5" />
                {distance}
              </span>
            )}
          </div>
        )}
        <div className="p-3">
          <div className="flex items-center gap-1.5">
            <h4 className="line-clamp-1 text-sm font-medium text-foreground">{name}</h4>
            {isVerified && (
              <div
                className="size-3.5 rounded-full"
                style={{
                  backgroundColor: `color-mix(in srgb, ${tierColors[verificationTier]} 20%, transparent)`,
                }}
              />
            )}
          </div>
          {category && <span className="text-[10px] text-muted-foreground">{category}</span>}
          <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
            {rating != null && (
              <span className="flex items-center gap-0.5">
                <Star className="size-3 fill-[var(--color-gold)] text-[var(--color-gold)]" />
                {rating.toFixed(1)}
                {reviewCount != null && <span className="opacity-60">({reviewCount})</span>}
              </span>
            )}
            {openNow != null && (
              <span style={{ color: openNow ? "#4ADE80" : "#F87171" }}>
                {openNow ? "Open" : "Closed"}
              </span>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      data-slot="nyuchi-place-card"
      role="article"
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-[var(--radius-card,14px)] border-l-4 bg-card py-3 pr-4 pl-3 ring-1 ring-foreground/10",
        onClick && "cursor-pointer transition-shadow hover:shadow-md",
        className
      )}
      style={{ borderLeftColor: accent }}
    >
      {image ? (
        <div className="size-12 shrink-0 overflow-hidden rounded-[var(--radius-inner,7px)] bg-muted">
          <img src={image} alt="" className="size-full object-cover" />
        </div>
      ) : (
        <div
          className="flex size-12 shrink-0 items-center justify-center rounded-[var(--radius-inner,7px)]"
          style={{ backgroundColor: `color-mix(in srgb, ${accent} 12%, transparent)` }}
        >
          <MapPin className="size-5" style={{ color: accent }} />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="line-clamp-1 text-sm font-medium text-foreground">{name}</span>
          {isVerified && (
            <div
              className="size-3 rounded-full"
              style={{ backgroundColor: tierColors[verificationTier] }}
            />
          )}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
          {address && (
            <span className="flex items-center gap-1">
              <MapPin className="size-3" />
              {address}
            </span>
          )}
          {distance && (
            <span className="flex items-center gap-1">
              <Navigation className="size-3" />
              {distance}
            </span>
          )}
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-0.5">
        {rating != null && (
          <span className="flex items-center gap-0.5 text-xs font-semibold">
            <Star className="size-3 fill-[var(--color-gold)] text-[var(--color-gold)]" />
            {rating.toFixed(1)}
          </span>
        )}
        {openNow != null && (
          <span
            className="text-[10px] font-medium"
            style={{ color: openNow ? "#4ADE80" : "#F87171" }}
          >
            {openNow ? "Open" : "Closed"}
          </span>
        )}
      </div>
    </div>
  )
}

export { NyuchiPlaceCard }
export type { NyuchiPlaceCardProps }
