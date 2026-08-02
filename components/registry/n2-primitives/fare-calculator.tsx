import * as React from "react"
import { cn } from "@/lib/utils"

interface FareSegment {
  label: string
  amount: number
}

interface FareCalculatorProps extends React.ComponentProps<"div"> {
  segments: FareSegment[]
  currency?: string
  discount?: { label: string; amount: number }
  total?: number
}

function FareCalculator({
  segments,
  currency = "MXT",
  discount,
  total,
  className,
  ...props
}: FareCalculatorProps) {
  const computedTotal =
    total ?? segments.reduce((sum, s) => sum + s.amount, 0) - (discount?.amount ?? 0)

  return (
    <div
      data-slot="fare-calculator"
      data-portal="https://mzizi.dev/components/fare-calculator"
      role="article"
      className={cn("rounded-[var(--radius-lg,14px)] border border-border bg-card p-4", className)}
      {...props}
    >
      <div className="text-xs font-medium text-muted-foreground">Fare breakdown</div>
      <div className="mt-2 space-y-1.5">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{seg.label}</span>
            <span className="tabular-nums">
              {seg.amount.toFixed(2)} {currency}
            </span>
          </div>
        ))}
        {discount && (
          <div className="flex items-center justify-between text-sm text-[var(--color-malachite,#64FFDA)]">
            <span>{discount.label}</span>
            <span className="tabular-nums">
              -{discount.amount.toFixed(2)} {currency}
            </span>
          </div>
        )}
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
        <span className="text-sm font-medium">Total</span>
        <span className="text-base font-bold tabular-nums">
          {computedTotal.toFixed(2)} {currency}
        </span>
      </div>
    </div>
  )
}

export { FareCalculator }
export type { FareCalculatorProps }
