"use client"

import * as React from "react"
import { CreditCard } from "@/lib/icons"

import { cn } from "@/lib/utils"

function PaymentMethodCard({
  loading = false,
  brand,
  lastFour,
  expiry,
  isDefault = false,
  onSetDefault,
  className,
  ...props
}: {
  /** Render the skeleton instead of the content. */
  loading?: boolean
  brand: string
  lastFour: string
  expiry: string
  isDefault?: boolean
  onSetDefault?: () => void
} & React.ComponentProps<"div">) {
  if (loading)
    return (
      <div
        data-slot="payment-method-card"
        data-portal="https://mzizi.dev/components/payment-method-card"
        role="article"
        data-loading
        className="animate-pulse space-y-3 rounded-[var(--radius-lg,14px)] bg-card p-4 ring-1 ring-foreground/10"
      >
        <div className="h-4 w-2/3 rounded bg-muted" />
        <div className="h-3 w-full rounded bg-muted" />
        <div className="h-3 w-1/2 rounded bg-muted" />
      </div>
    )

  return (
    <div
      data-slot="payment-method-card"
      role="article"
      data-default={isDefault || undefined}
      className={cn(
        "flex items-center gap-4 rounded-[var(--radius-xl,17px)] bg-card p-4 ring-1 ring-foreground/10 transition-shadow",
        isDefault && "ring-[var(--color-primary, var(--color-cobalt, #00B0FF))]/40 ring-2",
        className
      )}
      {...props}
    >
      <div className="flex size-10 items-center justify-center rounded-[var(--radius-lg,14px)] bg-muted">
        <CreditCard className="size-5 text-muted-foreground" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-sm font-medium text-foreground">{brand}</span>
        <span className="font-mono text-xs text-muted-foreground">
          {"•••• ".repeat(3)}
          {lastFour}
        </span>
      </div>
      <span className="text-xs text-muted-foreground tabular-nums">{expiry}</span>
      {isDefault ? (
        <span className="bg-[var(--color-primary, var(--color-cobalt, #00B0FF))]/15 text-[var(--color-primary, var(--color-cobalt, #00B0FF))] rounded-full px-2 py-0.5 text-xs font-medium">
          Default
        </span>
      ) : (
        onSetDefault && (
          <button
            type="button"
            onClick={onSetDefault}
            className="rounded-[var(--radius-lg,14px)] px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Set default
          </button>
        )
      )}
    </div>
  )
}

export { PaymentMethodCard }
