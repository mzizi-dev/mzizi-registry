"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { useNyuchiHarness } from "@/lib/harness"

/* ═══════════════════════════════════════════════════════════════
   NYUCHI EMPTY STATE — Universal Brand Component (Pre-Wired)
   
   The branded empty state for the entire ecosystem. Every app,
   every feed, every list uses this when content is absent.
   Dynamic mineral accent via --brand-accent.
   
   ✅ HARNESS  ✅ TOKENS  ✅ STRICT MINERAL RULES  ✅ TOUCH 48px+
   
   npx shadcn@latest add https://mzizi.dev/api/v1/ui/nyuchi-empty-state
   ═══════════════════════════════════════════════════════════════ */

interface NyuchiEmptyStateProps {
  /** Illustration or emoji shown above the title */
  icon?: React.ReactNode
  /** Primary message — what is empty */
  title: string
  /** Supporting explanation — what the user can do */
  description?: string
  /** Primary CTA label */
  actionLabel?: string
  /** Primary CTA handler */
  onAction?: () => void
  /** Secondary action label */
  secondaryLabel?: string
  /** Secondary action handler */
  onSecondary?: () => void
  /** Compact mode for inline empty states within cards */
  compact?: boolean
  className?: string
}

export function NyuchiEmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
  compact = false,
  className,
}: NyuchiEmptyStateProps) {
  const { motion } = useNyuchiHarness("empty-state")
  const animStyle = React.useMemo(
    () =>
      motion.prefersReduced
        ? {}
        : {
            animation: `nyuchi-fade-slide-up ${motion.enterDuration}ms ${motion.enterEasing} both`,
          },
    [motion]
  )

  return (
    <div
      data-slot="nyuchi-empty-state"
      style={animStyle}
      data-portal="https://mzizi.dev/components/nyuchi-empty-state"
      role="status"
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "px-4 py-8" : "px-6 py-16",
        className
      )}
    >
      {icon && (
        <div
          className={cn(
            "flex items-center justify-center rounded-full bg-[var(--brand-accent,var(--color-malachite,#64FFDA))]/10",
            compact ? "mb-3 size-12 text-xl" : "mb-4 size-16 text-2xl"
          )}
        >
          {icon}
        </div>
      )}

      <h3
        className={cn("font-semibold text-foreground", compact ? "text-sm" : "text-base")}
        style={{ fontFamily: "var(--font-serif)" }}
      >
        {title}
      </h3>

      {description && (
        <p
          className={cn(
            "max-w-[280px] leading-relaxed text-muted-foreground",
            compact ? "mt-1 text-xs" : "mt-2 text-sm"
          )}
        >
          {description}
        </p>
      )}

      {(onAction || onSecondary) && (
        <div className={cn("flex items-center gap-2", compact ? "mt-4" : "mt-6")}>
          {onAction && actionLabel && (
            <button
              onClick={onAction}
              className="h-12 rounded-full bg-[var(--brand-accent,var(--color-malachite,#64FFDA))] px-6 text-[13px] font-medium text-[var(--brand-accent-foreground,#0A0A0A)] transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary,#00B0FF)]"
            >
              {actionLabel}
            </button>
          )}
          {onSecondary && secondaryLabel && (
            <button
              onClick={onSecondary}
              className="h-12 rounded-full border border-border bg-muted px-6 text-[13px] font-medium text-foreground transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary,#00B0FF)]"
            >
              {secondaryLabel}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
