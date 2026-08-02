"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface ExchangeRateProps extends React.ComponentProps<"div"> {
  fromCurrency: string
  toCurrency: string
  rate: number
  change24h?: number
  lastUpdated?: Date | string
}

function ExchangeRate({
  fromCurrency,
  toCurrency,
  rate,
  change24h,
  lastUpdated,
  className,
  ...props
}: ExchangeRateProps) {
  const isPositive = change24h !== undefined && change24h >= 0

  return (
    <div
      data-slot="exchange-rate"
      data-portal="https://mzizi.dev/components/exchange-rate"
      role="article"
      className={cn(
        "flex items-center justify-between rounded-[var(--radius-lg,14px)] border border-border bg-card px-4 py-3",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{fromCurrency}</span>
        <span className="text-muted-foreground">→</span>
        <span className="text-sm font-medium">{toCurrency}</span>
      </div>
      <div className="text-right">
        <div className="text-sm font-bold tabular-nums">{rate.toFixed(4)}</div>
        {change24h !== undefined && (
          <div
            className={cn(
              "text-[10px] font-medium",
              isPositive ? "text-[var(--color-malachite,#64FFDA)]" : "text-destructive"
            )}
          >
            {isPositive ? "+" : ""}
            {change24h.toFixed(2)}%
          </div>
        )}
        {/* `lastUpdated` was destructured and never rendered, which is the worst
            omission on this particular card: an FX rate with no timestamp looks
            live no matter how stale it is. */}
        {lastUpdated && (
          <div className="text-[9px] text-muted-foreground">
            {new Date(lastUpdated).toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  )
}

export { ExchangeRate }
export type { ExchangeRateProps }
