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
      data-portal="https://mzizi.dev/components/price-display"
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
        <span className="rounded-full bg-[var(--status-success,var(--color-malachite,#64FFDA))]/15 px-2 py-0.5 text-xs font-medium text-[var(--status-success,var(--color-malachite,#64FFDA))]">
          {discount}
        </span>
      )}
    </div>
  )
}

export { PriceDisplay }
