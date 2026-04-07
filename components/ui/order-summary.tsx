import * as React from "react"

import { cn } from "@/lib/utils"

interface OrderSummaryItem {
  label: string
  amount: number
}

function OrderSummary({
  items,
  total,
  currency = "USD",
  className,
  ...props
}: {
  items: OrderSummaryItem[]
  total: number
  currency?: string
} & React.ComponentProps<"div">) {
  const formatter = new Intl.NumberFormat(undefined, { style: "currency", currency })

  return (
    <div data-slot="order-summary" className={cn("flex flex-col gap-3", className)} {...props}>
      {items.map((item) => (
        <div key={item.label} className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{item.label}</span>
          <span className="text-foreground tabular-nums">{formatter.format(item.amount)}</span>
        </div>
      ))}
      <div className="h-px bg-border" role="separator" />
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">Total</span>
        <span className="text-base font-bold text-foreground tabular-nums">
          {formatter.format(total)}
        </span>
      </div>
    </div>
  )
}

export { OrderSummary, type OrderSummaryItem }
