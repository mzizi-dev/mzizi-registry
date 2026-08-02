"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface TokenBalance {
  symbol: "MIT" | "MXT" | "NST" | "NHC"
  name: string
  balance: number
  fiatValue?: number
  fiatCurrency?: string
  change24h?: number
}

interface TokenBalanceCardProps extends React.ComponentProps<"div"> {
  tokens: TokenBalance[]
  totalFiatValue?: number
  fiatCurrency?: string
}

const tokenColors: Record<string, string> = {
  MIT: "var(--color-tanzanite, #B388FF)",
  MXT: "var(--color-malachite, #64FFDA)",
  NST: "var(--color-cobalt, #00B0FF)",
  NHC: "var(--color-gold, #FFD740)",
}

function TokenBalanceCard({
  tokens,
  totalFiatValue,
  fiatCurrency = "USD",
  className,
  ...props
}: TokenBalanceCardProps) {
  // `fiatCurrency` was destructured and never read while both value sites
  // hardcoded "$". A consumer setting `fiatCurrency="ZWL"` was shown dollars —
  // on a balance card that is not a cosmetic slip, it misstates the amount.
  const fiat = (value: number) =>
    new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: fiatCurrency,
      minimumFractionDigits: 2,
    }).format(value)

  return (
    <div
      data-slot="token-balance-card"
      data-portal="https://mzizi.dev/components/token-balance-card"
      role="article"
      className={cn("rounded-[var(--radius-xl,17px)] border border-border bg-card p-5", className)}
      {...props}
    >
      {totalFiatValue !== undefined && (
        <div className="mb-4">
          <div className="text-xs text-muted-foreground">Total Portfolio</div>
          <div className="text-2xl font-bold tabular-nums">{fiat(totalFiatValue)}</div>
        </div>
      )}
      <div className="space-y-3">
        {tokens.map((token) => (
          <div key={token.symbol} className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className="flex size-8 items-center justify-center rounded-full text-[10px] font-bold"
                style={{
                  backgroundColor: `${tokenColors[token.symbol]}20`,
                  color: tokenColors[token.symbol],
                }}
              >
                {token.symbol.charAt(0)}
              </div>
              <div>
                <div className="text-sm font-medium">{token.symbol}</div>
                <div className="text-[10px] text-muted-foreground">{token.name}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium tabular-nums">
                {token.balance.toLocaleString()}
              </div>
              {token.fiatValue !== undefined && (
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <span>{fiat(token.fiatValue)}</span>
                  {token.change24h !== undefined && (
                    <span
                      className={
                        token.change24h >= 0
                          ? "text-[var(--color-malachite,#64FFDA)]"
                          : "text-destructive"
                      }
                    >
                      {token.change24h >= 0 ? "+" : ""}
                      {token.change24h.toFixed(1)}%
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export { TokenBalanceCard }
export type { TokenBalanceCardProps, TokenBalance }
