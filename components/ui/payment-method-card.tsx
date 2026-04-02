"use client"

import * as React from "react"
import { CreditCard } from "lucide-react"

import { cn } from "@/lib/utils"

function PaymentMethodCard({
  brand,
  lastFour,
  expiry,
  isDefault = false,
  onSetDefault,
  className,
  ...props
}: {
  brand: string
  lastFour: string
  expiry: string
  isDefault?: boolean
  onSetDefault?: () => void
} & React.ComponentProps<"div">) {
  return (
    <div
      data-slot="payment-method-card"
      data-default={isDefault || undefined}
      className={cn(
        "ring-foreground/10 bg-card flex items-center gap-4 rounded-xl p-4 ring-1 transition-shadow",
        isDefault && "ring-[var(--color-cobalt)]/40 ring-2",
        className
      )}
      {...props}
    >
      <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
        <CreditCard className="size-5 text-muted-foreground" />
      </div>
      <div className="flex flex-1 flex-col gap-0.5 min-w-0">
        <span className="text-sm font-medium text-foreground">{brand}</span>
        <span className="font-mono text-xs text-muted-foreground">
          {"•••• ".repeat(3)}{lastFour}
        </span>
      </div>
      <span className="text-xs text-muted-foreground tabular-nums">{expiry}</span>
      {isDefault ? (
        <span className="rounded-4xl bg-[var(--color-cobalt)]/15 px-2 py-0.5 text-xs font-medium text-[var(--color-cobalt)]">
          Default
        </span>
      ) : (
        onSetDefault && (
          <button
            type="button"
            onClick={onSetDefault}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            Set default
          </button>
        )
      )}
    </div>
  )
}

export { PaymentMethodCard }
