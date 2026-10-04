"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type TokenType = "MIT" | "MXT" | "NST" | "NHC"

interface WalletCardProps extends React.ComponentProps<"div"> {
  tokenType: TokenType
  balance: number
  fiatValue?: number
  fiatCurrency?: string
  address?: string
}

/**
 * Each token type is identified by one mineral, and every colour comes from N1.
 *
 * The fill runs from the mineral to its `-on-container` tone and the text is the
 * mineral's `-container` tone. Both pairs are theme-adaptive and swap together,
 * so the card stays legible in light and dark mode — deep fill with pale text in
 * light, bright fill with deep text in dark.
 */
const tokenStyles: Record<TokenType, { background: string; text: string }> = {
  MIT: {
    background:
      "linear-gradient(135deg, var(--color-tanzanite) 0%, var(--color-tanzanite-on-container) 100%)",
    text: "text-tanzanite-container",
  },
  MXT: {
    background:
      "linear-gradient(135deg, var(--color-malachite) 0%, var(--color-malachite-on-container) 100%)",
    text: "text-malachite-container",
  },
  NST: {
    background:
      "linear-gradient(135deg, var(--color-cobalt) 0%, var(--color-cobalt-on-container) 100%)",
    text: "text-cobalt-container",
  },
  NHC: {
    background:
      "linear-gradient(135deg, var(--color-gold) 0%, var(--color-gold-on-container) 100%)",
    text: "text-gold-container",
  },
}

const tokenNames: Record<TokenType, string> = {
  MIT: "Identity Token",
  MXT: "Exchange Token",
  NST: "Storage Token",
  NHC: "Honeycomb Coin",
}

function WalletCard({
  tokenType,
  balance,
  fiatValue,
  fiatCurrency = "USD",
  address,
  className,
  ...props
}: WalletCardProps) {
  return (
    <div
      data-slot="wallet-card"
      data-portal="https://mzizi.dev/components/wallet-card"
      role="article"
      className={cn(
        "overflow-hidden rounded-[var(--radius-xl,17px)] p-5",
        tokenStyles[tokenType].text,
        className
      )}
      style={{ background: tokenStyles[tokenType].background }}
      {...props}
    >
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium opacity-80">{tokenNames[tokenType]}</div>
        <div className="text-lg font-bold">{tokenType}</div>
      </div>
      <div className="mt-4">
        <div className="text-2xl font-bold tabular-nums">
          {balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </div>
        {fiatValue !== undefined && (
          <div className="mt-0.5 text-sm opacity-70">
            ≈ {fiatCurrency} {fiatValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        )}
      </div>
      {address && <div className="mt-4 truncate font-mono text-[10px] opacity-50">{address}</div>}
    </div>
  )
}

export { WalletCard }
export type { WalletCardProps }
