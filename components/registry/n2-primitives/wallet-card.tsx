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

const tokenGradients: Record<TokenType, string> = {
  MIT: "linear-gradient(135deg, #4B0082 0%, #B388FF 100%)",
  MXT: "linear-gradient(135deg, #004D40 0%, #64FFDA 100%)",
  NST: "linear-gradient(135deg, #0047AB 0%, #00B0FF 100%)",
  NHC: "linear-gradient(135deg, #5D4037 0%, #FFD740 100%)",
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
      className={cn("overflow-hidden rounded-[var(--radius-xl,17px)] p-5 text-white", className)}
      style={{ background: tokenGradients[tokenType] }}
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
