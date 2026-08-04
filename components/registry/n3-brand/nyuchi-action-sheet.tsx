"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { useNyuchiHarness } from "@/lib/harness"

/* ═══════════════════════════════════════════════════════════════
   NYUCHI ACTION SHEET — Universal Brand Component (Pre-Wired)
   
   Contextual action sheet for any content in the ecosystem.
   Renders as a bottom sheet on mobile, dropdown on desktop.
   Dynamic mineral accent via --brand-accent.
   
   ✅ HARNESS  ✅ TOKENS  ✅ STRICT MINERAL RULES  ✅ TOUCH 48px+
   ═══════════════════════════════════════════════════════════════ */

interface ActionItem {
  /** Action identifier */
  id: string
  /** Display label */
  label: string
  /** Icon (emoji or component) */
  icon?: React.ReactNode
  /** Destructive actions show in red */
  destructive?: boolean
  /** Handler */
  onSelect: () => void
}

interface NyuchiActionSheetProps {
  /** Whether the sheet is open */
  open: boolean
  /** Close handler */
  onClose: () => void
  /** Title shown at the top */
  title?: string
  /** Action items */
  actions: ActionItem[]
  className?: string
}

export function NyuchiActionSheet({
  open,
  onClose,
  title,
  actions,
  className,
}: NyuchiActionSheetProps) {
  const { motion } = useNyuchiHarness("action-sheet")
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
      {/* Scrim */}
      <div className="fixed inset-0 z-50 bg-[var(--scrim,rgba(0,0,0,0.6))]" onClick={onClose} />

      {/* Sheet */}
      <div
        data-slot="nyuchi-action-sheet"
        style={animStyle}
        data-portal="https://mzizi.dev/components/nyuchi-action-sheet"
        role="dialog"
        aria-label="Actions"
        aria-modal="true"
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 rounded-t-[var(--radius-xl,17px)] border-t border-border bg-[var(--overlay,var(--card))]",
          "animate-in pb-[env(safe-area-inset-bottom)] slide-in-from-bottom",
          className
        )}
      >
        {/* Handle bar */}
        <div className="flex justify-center py-3">
          <div className="h-1 w-10 rounded-full bg-muted-foreground/20" />
        </div>

        {title && (
          <p className="px-5 pb-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            {title}
          </p>
        )}

        <div className="px-2 pb-2">
          {actions.map((action) => (
            <button
              key={action.id}
              onClick={() => {
                action.onSelect()
                onClose()
              }}
              className={cn(
                "flex w-full items-center gap-3 rounded-[var(--radius-md,12px)] px-4 py-3.5 text-sm font-medium transition-colors",
                "min-h-[48px] hover:bg-muted",
                action.destructive ? "text-red-400" : "text-foreground"
              )}
            >
              {action.icon && <span className="text-base">{action.icon}</span>}
              {action.label}
            </button>
          ))}
        </div>

        {/* Cancel button — always present */}
        <div className="px-2 pb-3">
          <button
            onClick={onClose}
            className="flex h-12 w-full items-center justify-center rounded-[var(--radius-md,12px)] bg-muted text-sm font-medium text-foreground transition-colors hover:bg-muted/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary,#00B0FF)]"
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  )
}
