"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

/* ═══════════════════════════════════════════════════════════════
   NYUCHI CREATE PAGE — Layer 6 Page Orchestrator
   
   Standard creation flow. Cancel/Title/Submit header pattern.
   Stepped or single-form layout with section cards.
   ✅ HARNESS  ✅ TOKENS  ✅ RESPONSIVE  ✅ TOUCH 48px+
   ═══════════════════════════════════════════════════════════════ */

interface NyuchiCreatePageProps {
  title: string
  onCancel?: () => void
  onSubmit?: () => void
  submitLabel?: string
  submitting?: boolean
  /** Step indicator for multi-step flows */
  currentStep?: number
  totalSteps?: number
  /** Cover/theme picker area */
  coverSlot?: React.ReactNode
  /** Form sections */
  children: React.ReactNode
  className?: string
}

export function NyuchiCreatePage({
  title,
  onCancel,
  onSubmit,
  submitLabel = "Publish",
  submitting = false,
  currentStep,
  totalSteps,
  coverSlot,
  children,
  className,
}: NyuchiCreatePageProps) {
  return (
    <div
      data-slot="nyuchi-create-page"
      data-portal="https://mzizi.dev/components/nyuchi-create-page"
      role="main"
      aria-label="Create"
      className={cn("min-h-screen bg-background pb-28", className)}
    >
      {/* Header bar */}
      <div className="sticky top-0 z-50 flex h-14 items-center justify-between gap-2 border-b border-border bg-card/90 px-4 backdrop-blur-xl">
        {onCancel && (
          <button
            onClick={onCancel}
            className="min-h-[48px] px-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
        )}
        <h2 className="flex-1 truncate text-center text-sm font-semibold text-foreground">
          {title}
        </h2>
        {onSubmit && (
          <button
            onClick={onSubmit}
            disabled={submitting}
            className={cn(
              "min-h-[48px] rounded-full px-4 py-1.5 text-sm font-semibold",
              submitting
                ? "text-muted-foreground"
                : "text-[var(--brand-accent,var(--status-success, var(--color-malachite, #64FFDA)))]"
            )}
          >
            {submitting ? "Saving..." : submitLabel}
          </button>
        )}
      </div>

      {/* Step indicator */}
      {currentStep != null && totalSteps != null && totalSteps > 1 && (
        <div className="flex gap-1 px-4 pt-3">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                i <= (currentStep ?? 0)
                  ? "bg-[var(--brand-accent,var(--status-success, var(--color-malachite, #64FFDA)))]"
                  : "bg-muted"
              )}
            />
          ))}
        </div>
      )}

      {/* Cover/theme picker slot */}
      {coverSlot}

      {/* Form sections */}
      <div className="mx-auto max-w-2xl space-y-4 px-4 py-6 sm:px-6">{children}</div>

      {/* Sticky bottom submit (mobile) */}
      {onSubmit && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/90 px-4 py-3 pb-[env(safe-area-inset-bottom,12px)] backdrop-blur-xl md:hidden">
          <button
            onClick={onSubmit}
            disabled={submitting}
            className={cn(
              "flex h-14 w-full items-center justify-center rounded-full text-[15px] font-semibold transition-opacity",
              submitting
                ? "bg-muted text-muted-foreground"
                : "bg-[var(--brand-accent,var(--status-success, var(--color-malachite, #64FFDA)))] text-[#0A0A0A] hover:opacity-80"
            )}
          >
            {submitting ? "Saving..." : submitLabel}
          </button>
        </div>
      )}
    </div>
  )
}
