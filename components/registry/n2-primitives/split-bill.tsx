"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface Participant {
  id: string
  name: string
  avatar?: string
  amount: number
  paid?: boolean
}

interface SplitBillProps extends React.ComponentProps<"div"> {
  totalAmount: number
  currency?: string
  participants: Participant[]
  splitType?: "equal" | "custom"
  onSplitTypeChange?: (type: "equal" | "custom") => void
  onAmountChange?: (id: string, amount: number) => void
  onSend?: () => void
  tip?: number
  onTipChange?: (tip: number) => void
}

function SplitBill({
  totalAmount,
  currency = "MXT",
  participants,
  splitType = "equal",
  onSplitTypeChange,
  onAmountChange,
  onSend,
  tip = 0,
  onTipChange,
  className,
  ...props
}: SplitBillProps) {
  const subtotal = totalAmount + tip
  const equalShare = participants.length > 0 ? subtotal / participants.length : 0
  const paidCount = participants.filter((p) => p.paid).length

  return (
    <div
      data-slot="split-bill"
      data-portal="https://mzizi.dev/components/split-bill"
      role="form"
      aria-label="Split bill"
      className={cn("rounded-[var(--radius-xl,17px)] border border-border bg-card p-5", className)}
      {...props}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Split Bill</span>
        <span className="text-lg font-bold tabular-nums">
          {subtotal.toFixed(2)} {currency}
        </span>
      </div>

      {/* Split type toggle */}
      <div className="mt-3 flex gap-1 rounded-full bg-muted/30 p-0.5">
        {(["equal", "custom"] as const).map((type) => (
          <button
            key={type}
            onClick={() => onSplitTypeChange?.(type)}
            className={cn(
              "h-8 flex-1 rounded-full text-xs font-medium capitalize transition-colors",
              splitType === type
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground"
            )}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Tip */}
      {onTipChange && (
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Tip</span>
          <div className="flex items-center gap-1">
            <input
              type="text"
              inputMode="decimal"
              value={tip || ""}
              onChange={(e) => {
                const v = parseFloat(e.target.value.replace(/[^0-9.]/g, ""))
                onTipChange(isNaN(v) ? 0 : v)
              }}
              className="h-8 w-20 rounded-full border border-input bg-input/30 px-3 text-right font-mono text-xs outline-none"
            />
            <span className="text-xs text-muted-foreground">{currency}</span>
          </div>
        </div>
      )}

      {/* Participants */}
      <div className="mt-3 space-y-2">
        {participants.map((p) => (
          <div
            key={p.id}
            className={cn(
              "flex items-center gap-2.5 rounded-[var(--radius-md,12px)] px-2 py-2",
              p.paid && "opacity-60"
            )}
          >
            <div className="flex size-8 items-center justify-center rounded-full bg-muted text-[10px] font-medium">
              {p.avatar ? (
                <img src={p.avatar} alt="" className="size-full rounded-full object-cover" />
              ) : (
                p.name.charAt(0)
              )}
            </div>
            <span className="flex-1 truncate text-sm">{p.name}</span>
            {splitType === "custom" && onAmountChange ? (
              <input
                type="text"
                inputMode="decimal"
                value={p.amount || ""}
                onChange={(e) => {
                  const v = parseFloat(e.target.value.replace(/[^0-9.]/g, ""))
                  onAmountChange(p.id, isNaN(v) ? 0 : v)
                }}
                className="h-8 w-20 rounded-full border border-input bg-input/30 px-3 text-right font-mono text-xs outline-none"
              />
            ) : (
              <span className="text-sm font-medium tabular-nums">{equalShare.toFixed(2)}</span>
            )}
            {p.paid && (
              <span className="text-[10px] text-[var(--color-malachite,#64FFDA)]">Paid</span>
            )}
          </div>
        ))}
      </div>

      {/* Send request */}
      {onSend && (
        <button
          onClick={onSend}
          className="mt-4 h-12 w-full rounded-full bg-primary text-sm font-medium text-primary-foreground"
        >
          Request {currency} {equalShare.toFixed(2)} each · {paidCount}/{participants.length} paid
        </button>
      )}
    </div>
  )
}

export { SplitBill }
export type { SplitBillProps }
