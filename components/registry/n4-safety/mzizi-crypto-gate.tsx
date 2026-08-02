"use client"
import * as React from "react"
import { cn } from "@/lib/utils"
import { useNyuchiHarness } from "@/lib/harness"

type CryptoLevel = "quantum-safe" | "classical" | "weak" | "none" | "checking"

interface NyuchiCryptoGateProps {
  children: React.ReactNode
  currentLevel: CryptoLevel
  requiredLevel?: CryptoLevel
  algorithmInfo?: { classical?: string; pqc?: string }
  onUpgrade?: () => void
  fallback?: React.ReactNode
  loading?: boolean
  className?: string
}

const LEVEL_ORDER: Record<CryptoLevel, number> = {
  none: 0,
  weak: 1,
  classical: 2,
  "quantum-safe": 3,
  checking: -1,
}
const LEVEL_CONFIG: Record<CryptoLevel, { color: string; label: string; desc: string }> = {
  "quantum-safe": {
    color: "var(--crypto-quantum-safe, #22C55E)",
    label: "Quantum Safe",
    desc: "Dual-signature: CRYSTALS-Dilithium + ECDSA",
  },
  classical: {
    color: "var(--crypto-classical, #3B82F6)",
    label: "Standard Security",
    desc: "Classical ECDSA signatures — secure today",
  },
  weak: {
    color: "var(--crypto-weak, #F59E0B)",
    label: "Reduced Security",
    desc: "Weak or deprecated algorithm detected",
  },
  none: {
    color: "var(--crypto-none, #EF4444)",
    label: "No Cryptographic Verification",
    desc: "Unsigned or unverified content",
  },
  checking: {
    color: "var(--color-muted-foreground)",
    label: "Verifying...",
    desc: "Checking cryptographic signatures",
  },
}

export function NyuchiCryptoGate({
  children,
  currentLevel,
  requiredLevel = "classical",
  algorithmInfo,
  onUpgrade,
  fallback,
  loading = false,
  className,
}: NyuchiCryptoGateProps) {
  const { motion } = useNyuchiHarness("crypto-gate")
  const animStyle = React.useMemo(
    () =>
      motion.prefersReduced
        ? {}
        : {
            animation: `nyuchi-fade-slide-up ${motion.enterDuration}ms ${motion.enterEasing} both`,
          },
    [motion]
  )

  if (loading || currentLevel === "checking")
    return (
      <div
        data-slot="nyuchi-crypto-gate"
        data-portal="https://mzizi.dev/components/nyuchi-crypto-gate"
        data-loading
        role="status"
        className="h-28 animate-pulse rounded-[var(--radius-lg,14px)] bg-muted"
      />
    )
  if (LEVEL_ORDER[currentLevel] >= LEVEL_ORDER[requiredLevel]) {
    if (currentLevel === "classical" && requiredLevel !== "quantum-safe") {
      return <>{children}</>
    }
    return <>{children}</>
  }
  if (fallback) return <>{fallback}</>

  const config = LEVEL_CONFIG[currentLevel]
  const required = LEVEL_CONFIG[requiredLevel]
  return (
    <div
      data-slot="nyuchi-crypto-gate"
      role="alert"
      aria-live="polite"
      style={animStyle}
      className={cn(
        "flex flex-col items-center gap-4 rounded-[var(--radius-lg,14px)] bg-card p-6 text-center ring-1 ring-foreground/10",
        className
      )}
    >
      <div
        className="flex size-14 items-center justify-center rounded-full"
        style={{ backgroundColor: `color-mix(in srgb, ${config.color} 15%, transparent)` }}
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke={config.color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0110 0v4" />
        </svg>
      </div>
      <div>
        <p
          className="text-base font-semibold text-foreground"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          Security Level Insufficient
        </p>
        <p className="mt-1 text-sm" style={{ color: config.color }}>
          Current: {config.label}
        </p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Required: <strong style={{ color: required.color }}>{required.label}</strong>
        </p>
        {algorithmInfo?.classical && (
          <p className="mt-1 text-xs text-muted-foreground">Classical: {algorithmInfo.classical}</p>
        )}
        {algorithmInfo?.pqc && (
          <p className="text-xs text-muted-foreground">PQC: {algorithmInfo.pqc}</p>
        )}
      </div>
      {onUpgrade && (
        <button
          onClick={onUpgrade}
          className="min-h-[48px] rounded-full bg-muted px-6 text-sm font-medium text-foreground transition-colors hover:bg-muted/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary,#00B0FF)]"
        >
          Upgrade Security
        </button>
      )}
    </div>
  )
}
export type { CryptoLevel, NyuchiCryptoGateProps }
