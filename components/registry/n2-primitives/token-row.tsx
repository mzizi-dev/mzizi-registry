"use client"
import * as React from "react"
import { cn } from "@/lib/utils"

interface TokenRowProps {
  symbol: string
  name?: string
  icon?: React.ReactNode
  balance: number
  value?: number
  valueCurrency?: string
  change?: number
  onClick?: () => void
  className?: string
}

export function TokenRow({
  symbol,
  name,
  icon,
  balance,
  value,
  valueCurrency = "USD",
  change,
  onClick,
  className,
}: TokenRowProps) {
  const Comp = onClick ? "button" : "div"
  return (
    <Comp
      data-slot="token-row"
      data-portal="https://mzizi.dev/components/token-row"
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-between px-4 py-3 text-left",
        onClick && "cursor-pointer transition-colors hover:bg-muted",
        className
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        {icon && (
          <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-medium">{symbol}</p>
          {name && <p className="truncate text-xs text-muted-foreground">{name}</p>}
        </div>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-sm font-medium tabular-nums">{balance.toLocaleString()}</p>
        {value != null && (
          <p className="text-xs text-muted-foreground tabular-nums">
            {new Intl.NumberFormat(undefined, {
              style: "currency",
              currency: valueCurrency,
            }).format(value)}
          </p>
        )}
        {change != null && (
          <p
            className={cn(
              "text-xs tabular-nums",
              change >= 0
                ? "text-[var(--status-success,#64FFDA)]"
                : "text-[var(--status-error,#FF5252)]"
            )}
          >
            {change >= 0 ? "+" : ""}
            {change.toFixed(1)}%
          </p>
        )}
      </div>
    </Comp>
  )
}
export type { TokenRowProps }
