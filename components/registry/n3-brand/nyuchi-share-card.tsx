"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { useNyuchiHarness } from "@/lib/harness"

/* ═══════════════════════════════════════════════════════════════
   NYUCHI SHARE CARD — Universal Brand Component (Pre-Wired)
   
   The branded sharing experience for the ecosystem. Every
   shareable entity uses this: listings, articles, profiles,
   places, events, videos, groups.
   
   Includes "Share to Campfire" as a first-class option —
   internal sharing is prioritised over external platforms.
   
   Dynamic mineral accent via --brand-accent.
   ✅ HARNESS  ✅ TOKENS  ✅ STRICT MINERAL RULES  ✅ TOUCH 48px+
   ═══════════════════════════════════════════════════════════════ */

interface ShareTarget {
  id: string
  label: string
  icon: React.ReactNode
  onShare: () => void
}

interface NyuchiShareCardProps {
  /** Content title */
  title: string
  /** Content description or subtitle */
  subtitle?: string
  /** Preview image URL */
  imageUrl?: string
  /** Source app name (e.g., "Nhimbe", "BushTrade") */
  sourceApp?: string
  /** Whether the sheet is open */
  open: boolean
  /** Close handler */
  onClose: () => void
  /** Copy link handler */
  onCopyLink?: () => void
  /** Share to Campfire handler */
  onShareToCampfire?: () => void
  /** Native share handler (Web Share API) */
  onNativeShare?: () => void
  /** Additional share targets */
  targets?: ShareTarget[]
  /** Whether the link has been copied */
  copied?: boolean
  className?: string
}

export function NyuchiShareCard({
  title,
  subtitle,
  imageUrl,
  sourceApp,
  open,
  onClose,
  onCopyLink,
  onShareToCampfire,
  onNativeShare,
  targets = [],
  copied = false,
  className,
}: NyuchiShareCardProps) {
  const { motion } = useNyuchiHarness("share-card")
  const animStyle = React.useMemo(
    () =>
      motion.prefersReduced
        ? {}
        : {
            animation: `nyuchi-fade-slide-up ${motion.enterDuration}ms ${motion.enterEasing} both`,
          },
    [motion]
  )

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-50 bg-[var(--scrim,rgba(0,0,0,0.6))]" onClick={onClose} />
      <div
        data-slot="nyuchi-share-card"
        style={animStyle}
        data-portal="https://mzizi.dev/components/nyuchi-share-card"
        role="dialog"
        aria-label="Share"
        aria-modal="true"
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 rounded-t-[var(--radius-xl,17px)] border-t border-border bg-[var(--overlay,var(--card))] pb-[env(safe-area-inset-bottom)]",
          className
        )}
      >
        <div className="flex justify-center py-3">
          <div className="h-1 w-10 rounded-full bg-muted-foreground/20" />
        </div>

        {/* Content preview */}
        <div className="mx-4 mb-4 flex gap-3 rounded-[var(--radius-md,12px)] bg-muted p-3">
          {imageUrl && (
            <div className="size-12 shrink-0 overflow-hidden rounded-[var(--radius-sm,7px)] bg-background">
              <img src={imageUrl} alt="" className="size-full object-cover" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">{title}</p>
            {subtitle && <p className="truncate text-[11px] text-muted-foreground">{subtitle}</p>}
            {sourceApp && (
              <p className="mt-0.5 text-[10px] text-muted-foreground">via {sourceApp}</p>
            )}
          </div>
        </div>

        {/* Share options */}
        <div className="space-y-1 px-4 pb-2">
          {onShareToCampfire && (
            <button
              onClick={() => {
                onShareToCampfire()
                onClose()
              }}
              className="flex min-h-[48px] w-full items-center gap-3 rounded-[var(--radius-md,12px)] px-4 py-3.5 text-sm font-medium text-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary,#00B0FF)]"
            >
              <span className="text-base">🔥</span> Share to Campfire
            </button>
          )}
          {onCopyLink && (
            <button
              onClick={onCopyLink}
              className="flex min-h-[48px] w-full items-center gap-3 rounded-[var(--radius-md,12px)] px-4 py-3.5 text-sm font-medium text-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary,#00B0FF)]"
            >
              <span className="text-base">{copied ? "✅" : "🔗"}</span>{" "}
              {copied ? "Link copied!" : "Copy link"}
            </button>
          )}
          {onNativeShare && (
            <button
              onClick={() => {
                onNativeShare()
                onClose()
              }}
              className="flex min-h-[48px] w-full items-center gap-3 rounded-[var(--radius-md,12px)] px-4 py-3.5 text-sm font-medium text-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary,#00B0FF)]"
            >
              <span className="text-base">📤</span> Share via...
            </button>
          )}
          {targets.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                t.onShare()
                onClose()
              }}
              className="flex min-h-[48px] w-full items-center gap-3 rounded-[var(--radius-md,12px)] px-4 py-3.5 text-sm font-medium text-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary,#00B0FF)]"
            >
              <span className="text-base">{t.icon}</span> {t.label}
            </button>
          ))}
        </div>

        <div className="px-4 pb-3">
          <button
            onClick={onClose}
            className="flex h-12 w-full items-center justify-center rounded-[var(--radius-md,12px)] bg-muted text-sm font-medium text-foreground hover:bg-muted/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary,#00B0FF)]"
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  )
}
