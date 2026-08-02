"use client"
import * as React from "react"
import { cn } from "@/lib/utils"
import { useNyuchiHarness } from "@/lib/harness"

type ChainId =
  "nyuchi-mainnet" | "nyuchi-testnet" | "polygon" | "polygon-amoy" | "ethereum" | "unknown"

const CHAIN_INFO: Record<ChainId, { label: string; color: string }> = {
  "nyuchi-mainnet": { label: "Nyuchi Network", color: "var(--connection-online, #22C55E)" },
  "nyuchi-testnet": { label: "Nyuchi Testnet", color: "var(--connection-cached, #F59E0B)" },
  polygon: { label: "Polygon", color: "var(--status-info, #3B82F6)" },
  "polygon-amoy": { label: "Polygon Amoy", color: "var(--status-info, #3B82F6)" },
  ethereum: { label: "Ethereum", color: "#627EEA" },
  unknown: { label: "Unknown Network", color: "var(--color-muted-foreground)" },
}

interface NyuchiChainGateProps {
  children: React.ReactNode
  currentChain: ChainId
  requiredChains: ChainId[]
  onSwitch?: (chain: ChainId) => void
  fallback?: React.ReactNode
  loading?: boolean
  className?: string
}

export function NyuchiChainGate({
  children,
  currentChain,
  requiredChains,
  onSwitch,
  fallback,
  loading = false,
  className,
}: NyuchiChainGateProps) {
  const { motion } = useNyuchiHarness("chain-gate")
  const animStyle = React.useMemo(
    () =>
      motion.prefersReduced
        ? {}
        : {
            animation: `nyuchi-fade-slide-up ${motion.enterDuration}ms ${motion.enterEasing} both`,
          },
    [motion]
  )

  if (loading)
    return (
      <div
        data-slot="nyuchi-chain-gate"
        data-portal="https://mzizi.dev/components/nyuchi-chain-gate"
        data-loading
        role="status"
        className="h-32 animate-pulse rounded-[var(--radius-lg,14px)] bg-muted"
      />
    )
  if (requiredChains.includes(currentChain)) return <>{children}</>
  if (fallback) return <>{fallback}</>

  return (
    <div
      data-slot="nyuchi-chain-gate"
      role="alert"
      aria-live="polite"
      style={animStyle}
      className={cn(
        "flex flex-col items-center gap-4 rounded-[var(--radius-lg,14px)] bg-card p-6 text-center ring-1 ring-foreground/10",
        className
      )}
    >
      <div className="bg-[var(--status-info, #3B82F6)]/15 flex size-14 items-center justify-center rounded-full">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--status-info, #3B82F6)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
          <path d="M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      </div>
      <div>
        <p
          className="text-base font-semibold text-foreground"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          Wrong Network
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Currently on <strong>{CHAIN_INFO[currentChain].label}</strong>. Switch to:
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {requiredChains.map((chain) => (
          <button
            key={chain}
            onClick={() => onSwitch?.(chain)}
            className="min-h-[48px] rounded-full px-4 text-sm font-medium transition-colors hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary,#00B0FF)]"
            style={{
              backgroundColor: `color-mix(in srgb, ${CHAIN_INFO[chain].color} 15%, transparent)`,
              color: CHAIN_INFO[chain].color,
            }}
          >
            {CHAIN_INFO[chain].label}
          </button>
        ))}
      </div>
    </div>
  )
}
export type { ChainId, NyuchiChainGateProps }
