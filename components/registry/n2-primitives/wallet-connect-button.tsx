"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface WalletConnectButtonProps extends React.ComponentProps<"button"> {
  address?: string
  connected?: boolean
  onConnect?: () => void
  onDisconnect?: () => void
  network?: string
  variant?: "default" | "compact"
}

function truncateAddress(addr: string): string {
  if (addr.length <= 12) return addr
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

function WalletConnectButton({
  address,
  connected = false,
  onConnect,
  onDisconnect,
  network,
  variant = "default",
  className,
  ...props
}: WalletConnectButtonProps) {
  return (
    <button
      data-slot="wallet-connect-button"
      data-portal="https://mzizi.dev/components/wallet-connect-button"
      role="button"
      aria-label="Connect wallet"
      onClick={connected ? onDisconnect : onConnect}
      className={cn(
        "inline-flex items-center gap-2 rounded-full font-medium transition-colors",
        variant === "compact" ? "h-8 px-3 text-xs" : "h-12 px-5 text-sm",
        connected
          ? "border border-border bg-card hover:bg-muted"
          : "bg-primary text-primary-foreground hover:bg-primary/80",
        className
      )}
      {...props}
    >
      {connected ? (
        <>
          <div className="size-2 rounded-full bg-[var(--color-malachite,#64FFDA)]" />
          <span className="font-mono text-xs">
            {address ? truncateAddress(address) : "Connected"}
          </span>
          {network && <span className="text-[10px] text-muted-foreground">({network})</span>}
        </>
      ) : (
        <span>Connect Wallet</span>
      )}
    </button>
  )
}

export { WalletConnectButton }
export type { WalletConnectButtonProps }
