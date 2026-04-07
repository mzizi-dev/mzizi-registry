import * as React from "react"

import { cn } from "@/lib/utils"

function PriceDisplay({
  amount,
  currency = "USD",
  originalAmount,
  discount,
  className,
  ...props
}: {
  amount: number
  currency?: string
  originalAmount?: number
  discount?: string
} & React.ComponentProps<"div">) {
  const formatter = new Intl.NumberFormat(undefined, { style: "currency", currency })

  return (
    <div
      data-slot="price-display"
      className={cn("flex flex-wrap items-baseline gap-2", className)}
      {...props}
    >
      <span className="text-2xl font-bold text-foreground">{formatter.format(amount)}</span>
      {originalAmount != null && originalAmount > amount && (
        <span className="text-sm text-muted-foreground line-through">
          {formatter.format(originalAmount)}
        </span>
      )}
      {discount && (
        <span className="rounded-4xl bg-[var(--color-malachite)]/15 px-2 py-0.5 text-xs font-medium text-[var(--color-malachite)]">
          {discount}
        </span>
      )}
    </div>
  )
}

export { PriceDisplay }
