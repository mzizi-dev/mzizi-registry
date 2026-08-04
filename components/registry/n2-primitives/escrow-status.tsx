import * as React from "react"
import { cn } from "@/lib/utils"

type EscrowState = "initiated" | "held" | "released" | "disputed" | "refunded"

interface EscrowStatusProps extends React.ComponentProps<"div"> {
  state: EscrowState
  amount: string
  currency?: string
  buyerName?: string
  sellerName?: string
  createdAt?: Date | string
}

const stateConfig: Record<EscrowState, { label: string; color: string; step: number }> = {
  initiated: { label: "Initiated", color: "var(--color-cobalt,#00B0FF)", step: 1 },
  held: { label: "Funds Held", color: "var(--color-gold,#FFD740)", step: 2 },
  released: { label: "Released", color: "var(--color-malachite,#64FFDA)", step: 3 },
  disputed: { label: "Disputed", color: "var(--color-terracotta,#D4A574)", step: 2 },
  refunded: { label: "Refunded", color: "var(--color-terracotta,#D4A574)", step: 3 },
}

function EscrowStatus({
  state,
  amount,
  currency = "MXT",
  buyerName,
  sellerName,
  createdAt,
  className,
  ...props
}: EscrowStatusProps) {
  const config = stateConfig[state]
  const steps = [
    "Initiated",
    "Held",
    state === "disputed" ? "Disputed" : state === "refunded" ? "Refunded" : "Released",
  ]

  return (
    <div
      data-slot="escrow-status"
      data-portal="https://mzizi.dev/components/escrow-status"
      role="status"
      aria-label={`Escrow ${config.label}: ${amount} ${currency}`}
      className={cn("rounded-[var(--radius-lg,14px)] border border-border bg-card p-4", className)}
      {...props}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Escrow Payment</span>
        <span className="text-sm font-bold">
          {amount} {currency}
        </span>
      </div>

      {/* Step indicator */}
      <div className="mt-3 flex items-center gap-1">
        {steps.map((label, i) => (
          <React.Fragment key={i}>
            <div className="flex flex-col items-center gap-0.5">
              <div
                className={cn("size-2.5 rounded-full", i < config.step ? "" : "bg-muted")}
                style={i < config.step ? { backgroundColor: config.color } : undefined}
              />
              <span className="text-[9px] text-muted-foreground">{label}</span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={cn("mt-[-12px] h-px flex-1", i < config.step - 1 ? "" : "bg-muted")}
                style={i < config.step - 1 ? { backgroundColor: config.color } : undefined}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {(buyerName || sellerName) && (
        <div className="mt-3 flex justify-between text-xs text-muted-foreground">
          {buyerName && <span>Buyer: {buyerName}</span>}
          {sellerName && <span>Seller: {sellerName}</span>}
        </div>
      )}

      {/* `createdAt` was destructured and never rendered. On an escrow — funds
          held pending release — how long the hold has been open is material to
          both parties, and the card dropped it. */}
      {createdAt && (
        <div className="mt-2 text-[10px] text-muted-foreground">
          Opened {new Date(createdAt).toLocaleDateString()}
        </div>
      )}
    </div>
  )
}

export { EscrowStatus }
export type { EscrowStatusProps, EscrowState }
