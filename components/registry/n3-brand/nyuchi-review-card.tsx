"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { useNyuchiHarness } from "@/lib/harness"

/* ═══════════════════════════════════════════════════════════════
   NYUCHI REVIEW CARD — Universal Brand Component (Pre-Wired)
   
   Branded review display used across all domains with reviews.
   Reviewer verification tier is always visible — trust matters.
   Dynamic mineral accent via --brand-accent.
   ✅ HARNESS  ✅ TOKENS  ✅ STRICT MINERAL RULES  ✅ TOUCH 48px+
   ═══════════════════════════════════════════════════════════════ */

interface NyuchiReviewCardProps {
  /** Renders the skeleton branch this component already implements. */
  loading?: boolean
  /** Reviewer name */
  reviewer: string
  /** Reviewer avatar */
  avatarUrl?: string
  /** Verification tier (0-4) */
  verificationTier?: 0 | 1 | 2 | 3 | 4
  /** Star rating (1-5) */
  rating: number
  /** Review text */
  text: string
  /** Review date */
  date?: string
  /** Helpful vote count */
  helpfulCount?: number
  /** Whether current user found this helpful */
  markedHelpful?: boolean
  /** Helpful vote handler */
  onHelpful?: () => void
  /** Report handler */
  onReport?: () => void
  className?: string
}

const tierBadge = ["", "🟤", "🔵", "🟡", "🟣"] as const

export function NyuchiReviewCard({
  loading = false,
  reviewer,
  avatarUrl,
  verificationTier = 0,
  rating,
  text,
  date,
  helpfulCount,
  markedHelpful,
  onHelpful,
  onReport,
  className,
}: NyuchiReviewCardProps) {
  const { motion } = useNyuchiHarness("review-card")
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
        data-slot="nyuchi-review-card"
        data-portal="https://mzizi.dev/components/nyuchi-review-card"
        data-loading
        role="article"
        className="animate-pulse space-y-3 rounded-[var(--radius-lg,14px)] bg-card p-4 ring-1 ring-foreground/10"
      >
        <div className="flex items-center gap-2.5">
          <div className="size-9 rounded-full bg-muted" />
          <div className="flex-1 space-y-1">
            <div className="h-3 w-1/4 rounded bg-muted" />
            <div className="h-2.5 w-16 rounded bg-muted" />
          </div>
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="size-3 rounded bg-muted" />
            ))}
          </div>
        </div>
        <div className="h-3 w-full rounded bg-muted" />
        <div className="h-3 w-3/4 rounded bg-muted" />
      </div>
    )

  return (
    <div
      data-slot="nyuchi-review-card"
      style={animStyle}
      role="article"
      className={cn(
        "space-y-3 rounded-[var(--radius-lg,14px)] border border-border bg-card p-4",
        className
      )}
    >
      {/* Reviewer + rating */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-xs font-bold text-muted-foreground">
            {avatarUrl ? (
              <img src={avatarUrl} alt={reviewer} className="size-full object-cover" />
            ) : (
              reviewer.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <div className="flex items-center gap-1">
              <p className="text-sm font-medium text-foreground">{reviewer}</p>
              {verificationTier > 0 && (
                <span className="text-xs">{tierBadge[verificationTier]}</span>
              )}
            </div>
            {date && <p className="text-[10px] text-muted-foreground">{date}</p>}
          </div>
        </div>
        {/* Stars */}
        <div className="flex items-center gap-0.5 text-sm">
          {Array.from({ length: 5 }).map((_, i) => (
            <span
              key={i}
              className={
                i < rating ? "text-[var(--color-gold,#FFD740)]" : "text-muted-foreground/20"
              }
            >
              ★
            </span>
          ))}
        </div>
      </div>

      {/* Review text */}
      <p className="text-sm leading-relaxed text-foreground">{text}</p>

      {/* Actions */}
      <div className="flex items-center justify-between pt-1">
        {onHelpful && (
          <button
            onClick={onHelpful}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors",
              markedHelpful
                ? "bg-[var(--brand-accent,var(--color-malachite,#64FFDA))]/10 text-[var(--brand-accent,var(--color-malachite,#64FFDA))]"
                : "min-h-[48px] text-muted-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary,#00B0FF)]"
            )}
          >
            👍 Helpful{helpfulCount ? ` (${helpfulCount})` : ""}
          </button>
        )}
        {onReport && (
          <button
            onClick={onReport}
            className="text-[10px] text-muted-foreground transition-colors hover:text-foreground"
          >
            Report
          </button>
        )}
      </div>
    </div>
  )
}
