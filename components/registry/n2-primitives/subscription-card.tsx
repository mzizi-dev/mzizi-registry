"use client"

import * as React from "react"
import { Check } from "@/lib/icons"

import { cn } from "@/lib/utils"

function SubscriptionCard({
  loading = false,
  name,
  price,
  period,
  features,
  highlighted = false,
  onSelect,
  className,
  ...props
}: {
  /** Render the skeleton instead of the content. */
  loading?: boolean
  name: string
  price: string
  period: string
  features: string[]
  highlighted?: boolean
  onSelect?: () => void
} & React.ComponentProps<"div">) {
  if (loading)
    return (
      <div
        data-slot="subscription-card"
        data-portal="https://mzizi.dev/components/subscription-card"
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
      data-slot="subscription-card"
      role="article"
      data-highlighted={highlighted || undefined}
      className={cn(
        "flex flex-col gap-6 rounded-[var(--radius-lg,14px)] bg-card p-6 text-card-foreground ring-1 ring-foreground/10 transition-shadow",
        highlighted && "ring-[var(--color-primary, var(--color-cobalt, #00B0FF))] shadow-lg ring-2",
        className
      )}
      {...props}
    >
      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-semibold text-foreground">{name}</h3>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-foreground">{price}</span>
          <span className="text-sm text-muted-foreground">/{period}</span>
        </div>
      </div>
      <ul className="flex flex-1 flex-col gap-2.5">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm text-foreground">
            <Check className="text-[var(--status-success, var(--color-malachite, #64FFDA))] mt-0.5 size-4 shrink-0" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      {onSelect && (
        <button
          type="button"
          onClick={onSelect}
          className={cn(
            "inline-flex h-10 items-center justify-center rounded-full px-6 text-sm font-medium transition-colors",
            highlighted
              ? "bg-[var(--color-primary, var(--color-cobalt, #00B0FF))] hover:bg-[var(--color-primary, var(--color-cobalt, #00B0FF))]/90 text-white"
              : "border border-border bg-input/30 text-foreground hover:bg-input/50"
          )}
        >
          Get started
        </button>
      )}
    </div>
  )
}

export { SubscriptionCard }
