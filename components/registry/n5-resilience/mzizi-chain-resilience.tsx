"use client"
import * as React from "react"
import { cn } from "@/lib/utils"
import { useNyuchiHarness } from "@/lib/harness"

type ChainStatus =
  "connected" | "reconnecting" | "rpc-error" | "chain-reorg" | "wallet-disconnected"

interface NyuchiChainResilienceProps {
  children: React.ReactNode
  status: ChainStatus
  retryCount?: number
  maxRetries?: number
  onRetry?: () => void
  onReconnectWallet?: () => void
  fallback?: React.ReactNode
  className?: string
}

const STATUS_CONFIG: Record<ChainStatus, { color: string; label: string; desc: string }> = {
  connected: { color: "var(--status-success, #22C55E)", label: "Chain Connected", desc: "" },
  reconnecting: {
    color: "var(--status-info, #3B82F6)",
    label: "Reconnecting to Chain",
    desc: "Attempting to re-establish connection...",
  },
  "rpc-error": {
    color: "var(--status-warning, #F59E0B)",
    label: "RPC Error",
    desc: "Node communication failed. Retrying with backup nodes.",
  },
  "chain-reorg": {
    color: "var(--status-info, #3B82F6)",
    label: "Chain Reorganization",
    desc: "Block reorg detected. Waiting for confirmation.",
  },
  "wallet-disconnected": {
    color: "var(--connection-offline, #EF4444)",
    label: "Wallet Disconnected",
    desc: "Your wallet lost connection.",
  },
}

export function NyuchiChainResilience({
  children,
  status,
  retryCount = 0,
  maxRetries = 5,
  onRetry,
  onReconnectWallet,
  fallback,
  className,
}: NyuchiChainResilienceProps) {
  const { motion } = useNyuchiHarness("chain-resilience")
  const animStyle = React.useMemo(
    () =>
      motion.prefersReduced
        ? {}
        : {
            animation: `nyuchi-fade-slide-up ${motion.enterDuration}ms ${motion.enterEasing} both`,
          },
    [motion]
  )

  if (status === "connected") return <>{children}</>
  if (fallback && retryCount >= maxRetries) return <>{fallback}</>

  const config = STATUS_CONFIG[status]
  return (
    <div
      data-slot="nyuchi-chain-resilience"
      data-portal="https://mzizi.dev/components/nyuchi-chain-resilience"
      role="alert"
      aria-live="polite"
      style={animStyle}
      className={cn(
        "flex items-center gap-3 rounded-[var(--radius-lg,14px)] bg-card p-4 ring-1 ring-foreground/10",
        className
      )}
    >
      <div
        className="flex size-10 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: `color-mix(in srgb, ${config.color} 15%, transparent)` }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke={config.color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={status === "reconnecting" ? "animate-spin" : ""}
        >
          <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
          <path d="M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium" style={{ color: config.color }}>
          {config.label}
        </p>
        <p className="text-xs text-muted-foreground">{config.desc}</p>
        {retryCount > 0 && (
          <p className="text-xs text-muted-foreground/60">
            Attempt {retryCount}/{maxRetries}
          </p>
        )}
      </div>
      {status === "wallet-disconnected" && onReconnectWallet && (
        <button
          onClick={onReconnectWallet}
          className="min-h-[48px] rounded-full px-4 text-xs font-medium transition-colors hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary,#00B0FF)]"
          style={{
            backgroundColor: `color-mix(in srgb, ${config.color} 15%, transparent)`,
            color: config.color,
          }}
        >
          Reconnect
        </button>
      )}
      {status === "rpc-error" && onRetry && (
        <button
          onClick={onRetry}
          className="min-h-[48px] rounded-full px-4 text-xs font-medium transition-colors hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary,#00B0FF)]"
          style={{
            backgroundColor: `color-mix(in srgb, ${config.color} 15%, transparent)`,
            color: config.color,
          }}
        >
          Retry
        </button>
      )}
    </div>
  )
}
export type { ChainStatus, NyuchiChainResilienceProps }
