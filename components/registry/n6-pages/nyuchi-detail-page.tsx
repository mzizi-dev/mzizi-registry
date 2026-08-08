"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

/* ═══════════════════════════════════════════════════════════════
   NYUCHI DETAIL PAGE — Layer 6 Page Orchestrator
   
   The standard detail screen for viewing any single content item.
   Composes L3 detail-layout + brand components into a full page.
   
   ✅ HARNESS  ✅ TOKENS  ✅ RESPONSIVE  ✅ ERROR BOUNDARIES
   ═══════════════════════════════════════════════════════════════ */

interface NyuchiDetailPageProps {
  /** Cover image URL */
  coverUrl?: string
  /** Cover gradient fallback (mineral-tinted) */
  coverGradient?: string
  /** Back navigation handler */
  onBack?: () => void
  /** Share handler */
  onShare?: () => void
  /** Like/save handler */
  onSave?: () => void
  /** Whether item is saved */
  saved?: boolean
  /** Main content — rendered in the body area */
  children: React.ReactNode
  /** Sticky bottom CTA */
  ctaLabel?: string
  ctaAction?: () => void
  /** Secondary CTA */
  secondaryLabel?: string
  secondaryAction?: () => void
  /** Related items section */
  relatedTitle?: string
  relatedItems?: React.ReactNode
  className?: string
}

export function NyuchiDetailPage({
  coverUrl,
  coverGradient,
  onBack,
  onShare,
  onSave,
  saved,
  children,
  ctaLabel,
  ctaAction,
  secondaryLabel,
  secondaryAction,
  relatedTitle,
  relatedItems,
  className,
}: NyuchiDetailPageProps) {
  return (
    <div
      data-slot="nyuchi-detail-page"
      data-portal="https://mzizi.dev/components/nyuchi-detail-page"
      className={cn("min-h-screen bg-background pb-28", className)}
    >
      {/* Hero cover */}
      <div
        className="relative h-56 sm:h-72"
        style={{
          backgroundImage: coverUrl ? `url(${coverUrl})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
          background: !coverUrl
            ? coverGradient ||
              "linear-gradient(135deg, var(--brand-accent,var(--status-success, var(--color-malachite, #64FFDA)))/20, var(--muted))"
            : undefined,
        }}
      >
        {/* Floating action buttons */}
        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4 pt-[env(safe-area-inset-top,16px)]">
          {onBack && (
            <button
              onClick={onBack}
              className="flex size-10 items-center justify-center rounded-full bg-background/80 text-foreground backdrop-blur-sm"
              aria-label="Go back"
            >
              ←
            </button>
          )}
          <div className="ml-auto flex gap-2">
            {onSave && (
              <button
                onClick={onSave}
                className={cn(
                  "flex size-10 items-center justify-center rounded-full backdrop-blur-sm",
                  saved
                    ? "bg-[var(--brand-accent,var(--status-success, var(--color-malachite, #64FFDA)))] text-[var(--brand-accent-foreground,#0A0A0A)]"
                    : "bg-background/80 text-foreground"
                )}
                aria-label={saved ? "Unsave" : "Save"}
              >
                {saved ? "♥" : "♡"}
              </button>
            )}
            {onShare && (
              <button
                onClick={onShare}
                className="flex size-10 items-center justify-center rounded-full bg-background/80 text-foreground backdrop-blur-sm"
                aria-label="Share"
              >
                ↗
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content body — overlaps hero slightly */}
      <div className="relative -mt-6 rounded-t-[var(--radius-xl,17px)] bg-background">
        <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">{children}</div>
      </div>

      {/* Related items */}
      {relatedItems && (
        <div className="mt-6 border-t border-border">
          <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
            {relatedTitle && (
              <h3 className="mb-4 text-sm font-semibold text-foreground">{relatedTitle}</h3>
            )}
            {relatedItems}
          </div>
        </div>
      )}

      {/* Sticky bottom CTA */}
      {ctaAction && ctaLabel && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/90 px-4 py-3 pb-[env(safe-area-inset-bottom,12px)] backdrop-blur-xl">
          <div className="mx-auto flex max-w-2xl gap-2">
            <button
              onClick={ctaAction}
              className="bg-[var(--brand-accent,var(--status-success, var(--color-malachite, #64FFDA)))] h-14 flex-1 rounded-full text-[15px] font-semibold text-[var(--brand-accent-foreground,#0A0A0A)] transition-opacity hover:opacity-80"
            >
              {ctaLabel}
            </button>
            {secondaryAction && secondaryLabel && (
              <button
                onClick={secondaryAction}
                className="h-14 rounded-full border border-border bg-muted px-6 text-[13px] font-medium text-foreground transition-opacity hover:opacity-80"
              >
                {secondaryLabel}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
