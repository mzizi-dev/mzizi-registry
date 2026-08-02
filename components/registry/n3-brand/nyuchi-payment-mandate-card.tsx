"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { useNyuchiHarness } from "@/lib/harness"

/* ═══════════════════════════════════════════════════════════════
   NYUCHI PAYMENT MANDATE CARD — Agentic Component (AP2, inline)

   Inline payment authorization rendered in the AI client. Selects a
   payment handler (rail) and authorizes an AP2 Payment Mandate — no
   browser checkout, no card details leaving the wallet.

   ✅ HARNESS  ✅ TOKENS  ✅ A11Y  ✅ TOUCH 48px+
   ═══════════════════════════════════════════════════════════════ */

export interface PaymentHandlerOption {
  id: string
  label: string
  kind: string
}

export interface NyuchiPaymentMandateCardProps {
  summary: string
  amount: number
  currency: string
  intentMandateId?: string
  cartMandateId?: string
  handlers: PaymentHandlerOption[]
  onAuthorize: (handlerId: string) => Promise<void>
  error?: string | null
  className?: string
}

export function NyuchiPaymentMandateCard({
  summary,
  amount,
  currency,
  intentMandateId,
  cartMandateId,
  handlers,
  onAuthorize,
  error,
  className,
}: NyuchiPaymentMandateCardProps) {
  const { log, motion } = useNyuchiHarness("payment-mandate-card")
  const [handler, setHandler] = React.useState<string>(() => handlers[0]?.id ?? "")
  const [pending, setPending] = React.useState(false)
  const fmt = new Intl.NumberFormat(undefined, { style: "currency", currency }).format(amount)

  async function authorize() {
    if (!handler || pending) return
    setPending(true)
    log.info("mandate_authorize", { handler })
    try {
      await onAuthorize(handler)
    } finally {
      setPending(false)
    }
  }

  const animStyle = motion.prefersReduced
    ? undefined
    : { animation: `nyuchi-fade-slide-up ${motion.enterDuration}ms ${motion.enterEasing} both` }

  return (
    <div
      data-slot="nyuchi-payment-mandate-card"
      data-portal="https://mzizi.dev/components/nyuchi-payment-mandate-card"
      role="dialog"
      aria-label="Authorize payment"
      aria-modal="true"
      style={animStyle}
      className={cn(
        "w-full max-w-sm rounded-[var(--radius-xl,17px)] border border-border",
        "bg-[var(--card)] p-6 text-[var(--card-foreground)] shadow-[var(--shadow-lg)]",
        className
      )}
    >
      <header className="mb-4 space-y-1">
        <h2 className="text-lg font-semibold tracking-tight">Confirm payment</h2>
        <p className="text-sm text-[var(--muted-foreground)]">{summary}</p>
      </header>

      <div className="mb-4 flex items-baseline justify-between rounded-[var(--radius,10px)] border border-border bg-[var(--background)] px-4 py-3">
        <span className="text-sm text-[var(--muted-foreground)]">Total</span>
        <span className="text-xl font-semibold">{fmt}</span>
      </div>

      <fieldset className="mb-4 grid gap-2">
        <legend className="mb-1 text-sm font-medium">Pay with</legend>
        {handlers.map((h) => {
          const active = h.id === handler
          return (
            <label
              key={h.id}
              className={cn(
                "flex min-h-[48px] cursor-pointer items-center justify-between rounded-[var(--radius,10px)] border px-4 text-sm",
                active
                  ? "border-[var(--brand-accent,var(--primary))] bg-[var(--muted)]"
                  : "border-border bg-[var(--background)] hover:bg-[var(--muted)]"
              )}
            >
              <span className="font-medium">{h.label}</span>
              <input
                type="radio"
                name="nyuchi-payment-handler"
                value={h.id}
                checked={active}
                onChange={() => setHandler(h.id)}
                className="size-4 accent-[var(--brand-accent,var(--primary))] focus-visible:ring-2 focus-visible:ring-[var(--brand-accent,var(--ring))] focus-visible:outline-none"
              />
            </label>
          )
        })}
      </fieldset>

      {(intentMandateId || cartMandateId) && (
        <p className="mb-3 text-xs text-[var(--muted-foreground)]">
          AP2 mandate chain{intentMandateId ? ` · intent ${intentMandateId.slice(0, 8)}` : ""}
          {cartMandateId ? ` · cart ${cartMandateId.slice(0, 8)}` : ""}
        </p>
      )}

      {error && (
        <p role="alert" className="mb-3 text-sm text-[var(--destructive)]">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={authorize}
        disabled={pending || !handler}
        className={cn(
          "inline-flex min-h-[48px] w-full items-center justify-center rounded-[var(--radius,10px)]",
          "bg-[var(--brand-accent,var(--primary))] px-4 text-sm font-semibold text-[var(--primary-foreground)]",
          "transition-opacity hover:opacity-90 disabled:opacity-60",
          "focus-visible:ring-2 focus-visible:ring-[var(--brand-accent,var(--ring))] focus-visible:outline-none"
        )}
      >
        {pending ? "Authorizing…" : `Authorize ${fmt}`}
      </button>

      <p className="mt-3 text-center text-xs text-[var(--muted-foreground)]">
        Signed as an AP2 Payment Mandate. No card details leave your wallet.
      </p>
    </div>
  )
}
