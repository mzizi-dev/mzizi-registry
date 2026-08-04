"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { useNyuchiHarness } from "@/lib/harness"

/* ═══════════════════════════════════════════════════════════════
   NYUCHI PAYMENT SUMMARY — Universal Brand Component (Pre-Wired)
   
   The branded checkout/payment confirmation used ecosystem-wide.
   Multi-currency, MIT token support, escrow indicator.
   Dynamic mineral accent via --brand-accent.
   ✅ HARNESS  ✅ TOKENS  ✅ STRICT MINERAL RULES  ✅ TOUCH 48px+
   ═══════════════════════════════════════════════════════════════ */

interface LineItem {
  label: string
  amount: string
  type?: "item" | "discount" | "fee" | "tax"
}
interface NyuchiPaymentSummaryProps {
  /** Renders the skeleton branch this component already implements. */
  loading?: boolean
  /** What is being purchased */
  title: string
  /** Additional context (seller, event name, route) */
  subtitle?: string
  /** Line items */
  items: LineItem[]
  /** Total amount */
  total: string
  /** Currency code */
  currency?: string
  /** Payment method label */
  paymentMethod?: string
  /** Whether payment is escrow-backed */
  escrow?: boolean
  /** Confirm button label */
  confirmLabel?: string
  /** Confirm handler */
  onConfirm?: () => void
  /** Cancel handler */
  onCancel?: () => void
  /** Processing state */
  processing?: boolean
  className?: string
}

export function NyuchiPaymentSummary({
  loading = false,
  title,
  subtitle,
  items,
  total,
  currency = "USD",
  paymentMethod,
  escrow,
  confirmLabel = "Pay Now",
  onConfirm,
  onCancel,
  processing = false,
  className,
}: NyuchiPaymentSummaryProps) {
  const { motion } = useNyuchiHarness("payment-summary")
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
        data-slot="nyuchi-payment-summary"
        data-portal="https://mzizi.dev/components/nyuchi-payment-summary"
        data-loading
        role="region"
        aria-label="Payment summary"
        className="animate-pulse overflow-hidden rounded-[var(--radius-lg,14px)] bg-card ring-1 ring-foreground/10"
      >
        <div className="space-y-1.5 border-b border-border px-4 py-3">
          <div className="h-3.5 w-1/3 rounded bg-muted" />
          <div className="h-2.5 w-1/4 rounded bg-muted" />
        </div>
        <div className="space-y-2 px-4 py-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex justify-between">
              <div className="h-3 w-1/3 rounded bg-muted" />
              <div className="h-3 w-16 rounded bg-muted" />
            </div>
          ))}
        </div>
        <div className="flex justify-between border-t border-border px-4 py-3">
          <div className="h-3.5 w-12 rounded bg-muted" />
          <div className="h-5 w-24 rounded bg-muted" />
        </div>
        <div className="border-t border-border p-4">
          <div className="h-14 rounded-full bg-muted" />
        </div>
      </div>
    )

  return (
    <div
      data-slot="nyuchi-payment-summary"
      style={animStyle}
      role="region"
      aria-label="Payment summary"
      className={cn(
        "overflow-hidden rounded-[var(--radius-lg,14px)] border border-border bg-card",
        className
      )}
    >
      {/* Header */}
      <div className="border-b border-border px-4 py-3">
        <h3
          className="text-sm font-semibold text-foreground"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          {title}
        </h3>
        {subtitle && <p className="mt-0.5 text-[11px] text-muted-foreground">{subtitle}</p>}
      </div>

      {/* Line items */}
      <div className="space-y-2 px-4 py-3">
        {items.map((item, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <span
              className={cn(
                item.type === "discount"
                  ? "text-[var(--color-malachite,#64FFDA)]"
                  : item.type === "fee" || item.type === "tax"
                    ? "text-muted-foreground"
                    : "text-foreground"
              )}
            >
              {item.label}
            </span>
            <span
              className={cn(
                "font-medium",
                item.type === "discount"
                  ? "text-[var(--color-malachite,#64FFDA)]"
                  : "text-foreground"
              )}
            >
              {item.type === "discount" ? "-" : ""}
              {item.amount}
            </span>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="flex items-center justify-between border-t border-border px-4 py-3">
        <span className="text-sm font-semibold text-foreground">Total</span>
        <span className="text-lg font-bold text-foreground">
          {new Intl.NumberFormat(undefined, {
            style: "currency",
            currency: currency || "USD",
          }).format(Number(total) || 0)}
        </span>
      </div>

      {/* Payment method + escrow */}
      {(paymentMethod || escrow) && (
        <div className="flex items-center justify-between border-t border-border px-4 py-2.5 text-[11px] text-muted-foreground">
          {paymentMethod && <span>💳 {paymentMethod}</span>}
          {escrow && (
            <span className="rounded-full bg-[var(--color-malachite,#64FFDA)]/10 px-2 py-0.5 font-medium text-[var(--color-malachite,#64FFDA)]">
              🔒 Escrow protected
            </span>
          )}
        </div>
      )}

      {/* Actions */}
      {(onConfirm || onCancel) && (
        <div className="space-y-2 border-t border-border p-4">
          {onConfirm && (
            <button
              onClick={onConfirm}
              disabled={processing}
              className={cn(
                "flex h-14 w-full items-center justify-center rounded-full text-[15px] font-semibold transition-opacity",
                processing
                  ? "cursor-not-allowed bg-muted text-muted-foreground"
                  : "bg-[var(--brand-accent,var(--color-malachite,#64FFDA))] text-[var(--brand-accent-foreground,#0A0A0A)] hover:opacity-80"
              )}
            >
              {processing ? "Processing..." : confirmLabel}
            </button>
          )}
          {onCancel && (
            <button
              onClick={onCancel}
              className="flex h-12 w-full items-center justify-center rounded-full bg-muted text-sm font-medium text-foreground hover:bg-muted/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary,#00B0FF)]"
            >
              Cancel
            </button>
          )}
        </div>
      )}
    </div>
  )
}
