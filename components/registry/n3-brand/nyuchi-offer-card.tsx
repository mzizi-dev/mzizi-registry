"use client"

// ── INFRASTRUCTURE HARNESS (auto-wired) ──
// Every brand component participates in observability, motion, a11y,
// and health monitoring via the harness. Zero manual config.
import { useNyuchiHarness } from "@/lib/harness"

import * as React from "react"
import { ShoppingBag, MessageCircle, Shield } from "@/lib/icons"
import { cn } from "@/lib/utils"

interface NyuchiOfferCardProps {
  /** Renders the skeleton branch this component already implements. */
  loading?: boolean
  title: string
  image?: string
  price: number
  originalPrice?: number
  currency?: string
  sellerName?: string
  sellerVerified?: boolean
  category?: string
  condition?: "new" | "used" | "refurbished"
  mineral?: "malachite" | "cobalt" | "gold" | "tanzanite" | "terracotta"
  onInquire?: () => void
  onClick?: () => void
  className?: string
}

function NyuchiOfferCard({
  loading = false,
  title,
  image,
  price,
  originalPrice,
  currency = "USD",
  sellerName,
  sellerVerified,
  category,
  condition,
  mineral = "malachite",
  onInquire,
  onClick,
  className,
}: NyuchiOfferCardProps) {
  const { motion } = useNyuchiHarness("offer-card")
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
        data-slot="nyuchi-offer-card"
        data-portal="https://mzizi.dev/components/nyuchi-offer-card"
        data-loading
        role="article"
        className="animate-pulse space-y-3 rounded-[var(--radius-lg,14px)] bg-card p-4 ring-1 ring-foreground/10"
      >
        <div className="flex gap-3">
          <div className="size-20 shrink-0 rounded-[var(--radius-md,12px)] bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-3/4 rounded bg-muted" />
            <div className="h-2.5 w-1/2 rounded bg-muted" />
            <div className="h-4 w-1/3 rounded bg-muted" />
          </div>
        </div>
      </div>
    )

  const formatter = new Intl.NumberFormat(undefined, { style: "currency", currency })
  const hasDiscount = originalPrice != null && originalPrice > price
  const discountPercent = hasDiscount ? Math.round((1 - price / originalPrice!) * 100) : 0

  const mineralColors: Record<string, string> = {
    malachite: "var(--color-malachite,#64FFDA)",
    cobalt: "var(--color-cobalt,#00B0FF)",
    gold: "var(--color-gold,#FFD740)",
    tanzanite: "var(--color-tanzanite,#B388FF)",
    terracotta: "var(--color-terracotta,#D4A574)",
  }
  const accent = mineralColors[mineral]

  return (
    <div
      data-slot="nyuchi-offer-card"
      style={animStyle}
      role="article"
      tabIndex={0}
      onClick={onClick}
      className={cn(
        "min-h-[48px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary,#00B0FF)]",
        "overflow-hidden rounded-[var(--radius-card,14px)] bg-card ring-1 ring-foreground/10",
        onClick && "cursor-pointer transition-shadow hover:shadow-md",
        className
      )}
    >
      {/* Image */}
      {image && (
        <div className="relative aspect-[var(--aspect-media,1/1)] overflow-hidden bg-muted">
          <img
            src={image}
            alt={title}
            className="size-full object-cover transition-transform hover:scale-105"
          />
          {hasDiscount && (
            <span
              className="absolute top-2 left-2 rounded-full px-2 py-0.5 text-[10px] font-bold text-background"
              style={{ backgroundColor: accent }}
            >
              -{discountPercent}%
            </span>
          )}
          {condition && condition !== "new" && (
            <span className="absolute top-2 right-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-medium text-white capitalize backdrop-blur-sm">
              {condition}
            </span>
          )}
        </div>
      )}
      <div className="p-3">
        {category && (
          <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
            {category}
          </span>
        )}
        <h4 className="mt-0.5 line-clamp-2 text-sm font-medium text-foreground">{title}</h4>
        {/* Price */}
        <div className="mt-1.5 flex items-baseline gap-2">
          <span className="text-base font-bold text-foreground">{formatter.format(price)}</span>
          {hasDiscount && (
            <span className="text-xs text-muted-foreground line-through">
              {formatter.format(originalPrice!)}
            </span>
          )}
        </div>
        {/* Seller info */}
        {sellerName && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShoppingBag className="size-3" />
            <span>{sellerName}</span>
            {sellerVerified && <Shield className="size-3 text-[var(--color-gold)]" />}
          </div>
        )}
        {/* Inquiry CTA */}
        {onInquire && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onInquire()
            }}
            className="mt-3 flex h-9 w-full items-center justify-center gap-1.5 rounded-full text-xs font-semibold text-background transition-colors"
            style={{ backgroundColor: accent }}
          >
            <MessageCircle className="size-3.5" />
            Inquire
          </button>
        )}
      </div>
    </div>
  )
}

export { NyuchiOfferCard }
export type { NyuchiOfferCardProps }
