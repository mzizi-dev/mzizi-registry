"use client"
import * as React from "react"
import { cn } from "@/lib/utils"
import { useNyuchiHarness } from "@/lib/harness"

type WalletStatus = "disconnected" | "connecting" | "connected" | "wrong-network"
type TokenType = "MIT" | "MXT" | "NST" | "NHC"

interface NyuchiWalletGateProps {
  children: React.ReactNode
  walletStatus: WalletStatus
  requiredToken?: TokenType
  requiredBalance?: number
  currentBalance?: number
  onConnect?: () => void
  fallback?: React.ReactNode
  loading?: boolean
  className?: string
}

const TOKEN_INFO: Record<TokenType, { label: string; color: string; desc: string }> = {
  MIT: {
    label: "MIT (Identity)",
    color: "var(--tier-government, var(--color-tanzanite, #B388FF))",
    desc: "Soulbound identity token — non-transferable",
  },
  MXT: {
    label: "MXT (Exchange)",
    color: "var(--status-warning, #F59E0B)",
    desc: "Transferable token for transactions",
  },
  NST: {
    label: "NST (Storage)",
    color: "var(--color-malachite, #64FFDA)",
    desc: "Storage allocation token",
  },
  NHC: {
    label: "NHC (Utility)",
    color: "var(--color-cobalt, #00B0FF)",
    desc: "Network utility token",
  },
}

export function NyuchiWalletGate({
  children,
  walletStatus,
  requiredToken,
  requiredBalance = 0,
  currentBalance = 0,
  onConnect,
  fallback,
  loading = false,
  className,
}: NyuchiWalletGateProps) {
  const { log, motion } = useNyuchiHarness("wallet-gate")
  const animStyle = React.useMemo(
    () =>
      motion.prefersReduced
        ? {}
        : {
            animation: `nyuchi-fade-slide-up ${motion.enterDuration}ms ${motion.enterEasing} both`,
          },
    [motion]
  )

  React.useEffect(() => {
    if (walletStatus !== "connected") log.info(`wallet_blocked: status=${walletStatus}`)
  }, [walletStatus, log])

  if (loading)
    return (
      <div
        data-slot="nyuchi-wallet-gate"
        data-portal="https://mzizi.dev/components/nyuchi-wallet-gate"
        data-loading
        role="status"
        className="h-36 animate-pulse rounded-[var(--radius-lg,14px)] bg-muted"
      />
    )
  if (walletStatus === "connected" && (!requiredToken || currentBalance >= requiredBalance))
    return <>{children}</>
  if (fallback) return <>{fallback}</>

  const tokenInfo = requiredToken ? TOKEN_INFO[requiredToken] : null
  const isBalanceIssue =
    walletStatus === "connected" && requiredToken && currentBalance < requiredBalance

  return (
    <div
      data-slot="nyuchi-wallet-gate"
      role="alert"
      aria-live="polite"
      style={animStyle}
      className={cn(
        "flex flex-col items-center gap-4 rounded-[var(--radius-lg,14px)] bg-card p-6 text-center ring-1 ring-foreground/10",
        className
      )}
    >
      <div className="flex size-14 items-center justify-center rounded-full bg-[var(--color-tanzanite,#B388FF)]/15">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--tier-government, var(--color-tanzanite, #B388FF))"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="2" y="6" width="20" height="14" rx="2" />
          <path d="M16 14h.01" />
          <path d="M2 10h20" />
        </svg>
      </div>
      <div>
        <p
          className="text-base font-semibold text-foreground"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          {walletStatus === "wrong-network"
            ? "Wrong Network"
            : isBalanceIssue
              ? "Insufficient Balance"
              : walletStatus === "connecting"
                ? "Connecting Wallet..."
                : "Wallet Required"}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {walletStatus === "wrong-network"
            ? "Please switch to the Nyuchi Network or Polygon."
            : isBalanceIssue && tokenInfo
              ? `Requires ${requiredBalance} ${tokenInfo.label}. You have ${currentBalance}.`
              : walletStatus === "connecting"
                ? "Waiting for wallet approval..."
                : "Connect your wallet to access Web3 features."}
        </p>
        {tokenInfo && !isBalanceIssue && (
          <p className="mt-1 text-xs" style={{ color: tokenInfo.color }}>
            {tokenInfo.desc}
          </p>
        )}
      </div>
      {onConnect && walletStatus !== "connecting" && (
        <button
          onClick={onConnect}
          className="min-h-[48px] rounded-full bg-[var(--color-tanzanite,#B388FF)] px-6 text-sm font-medium text-white transition-colors hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary,#00B0FF)]"
        >
          {walletStatus === "wrong-network"
            ? "Switch Network"
            : isBalanceIssue
              ? "Get Tokens"
              : "Connect Wallet"}
        </button>
      )}
    </div>
  )
}
export type { WalletStatus, TokenType, NyuchiWalletGateProps }
