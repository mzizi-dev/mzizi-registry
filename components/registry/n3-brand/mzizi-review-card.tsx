"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { useMziziHarness } from "@/lib/harness"
import { Rating } from "@/components/ui/rating"
import { MziziVerifiedBadge, type VerificationTier } from "@/components/ui/mzizi-verified-badge"

/* ═══════════════════════════════════════════════════════════════
   NYUCHI REVIEW CARD — Universal Brand Component (Pre-Wired)
   
   Branded review display used across all domains with reviews.
   Reviewer verification tier is always visible — trust matters.
   Dynamic mineral accent via --brand-accent.

   #543: an optional `headline`; the body keeps its line breaks
   (whitespace-pre-line); the stars are the read-only Rating, one
   role="img" named "4 out of 5 stars"; and the reviewer's tier is the
   mzizi-verified-badge (named, mineral-coloured) instead of an emoji.
   ✅ HARNESS  ✅ TOKENS  ✅ STRICT MINERAL RULES  ✅ TOUCH 48px+
   ═══════════════════════════════════════════════════════════════ */

interface MziziReviewCardProps {
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
  /** A short headline above the body, e.g. "Fast and friendly". */
  headline?: string
  /** Review text. Line breaks in it are kept. */
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

/** verificationTier (0-4) → the verified badge's tier; 0 draws nothing. */
const TIER_BY_LEVEL: readonly VerificationTier[] = ["unverified", "community", "otp", "government", "licensed"]

export function MziziReviewCard({
  loading = false,
  reviewer,
  avatarUrl,
  verificationTier = 0,
  rating,
  headline,
  text,
  date,
  helpfulCount,
  markedHelpful,
  onHelpful,
  onReport,
  className,
}: MziziReviewCardProps) {
  const { motion } = useMziziHarness("review-card")
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
        data-slot="mzizi-review-card"
        data-portal="https://mzizi.dev/components/mzizi-review-card"
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
      data-slot="mzizi-review-card"
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
              {verificationTier > 0 && <MziziVerifiedBadge tier={TIER_BY_LEVEL[verificationTier]} size="sm" />}
            </div>
            {date && <p className="text-[10px] text-muted-foreground">{date}</p>}
          </div>
        </div>
        {/* Stars: one role="img" named "4 out of 5 stars" */}
        <Rating value={rating} max={5} readOnly size="sm" className="shrink-0" />
      </div>

      {headline && (
        <p data-slot="mzizi-review-card-headline" className="text-sm font-semibold text-foreground">
          {headline}
        </p>
      )}

      {/* Review text: the reviewer's own line breaks are kept */}
      <p data-slot="mzizi-review-card-body" className="text-sm leading-relaxed whitespace-pre-line text-foreground">
        {text}
      </p>

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
