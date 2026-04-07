import * as React from "react"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

function SubscriptionCard({
  name,
  price,
  period,
  features,
  highlighted = false,
  onSelect,
  className,
  ...props
}: {
  name: string
  price: string
  period: string
  features: string[]
  highlighted?: boolean
  onSelect?: () => void
} & React.ComponentProps<"div">) {
  return (
    <div
      data-slot="subscription-card"
      data-highlighted={highlighted || undefined}
      className={cn(
        "flex flex-col gap-6 rounded-2xl bg-card p-6 text-card-foreground ring-1 ring-foreground/10 transition-shadow",
        highlighted && "shadow-lg ring-2 ring-[var(--color-cobalt)]",
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
            <Check className="mt-0.5 size-4 shrink-0 text-[var(--color-malachite)]" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      {onSelect && (
        <button
          type="button"
          onClick={onSelect}
          className={cn(
            "inline-flex h-10 items-center justify-center rounded-4xl px-6 text-sm font-medium transition-colors",
            highlighted
              ? "bg-[var(--color-cobalt)] text-white hover:bg-[var(--color-cobalt)]/90"
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
