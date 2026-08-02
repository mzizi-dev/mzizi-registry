"use client"
import * as React from "react"
import { useNyuchiHarness } from "@/lib/harness"

type CryptoFallbackState = "pqc-active" | "pqc-loading" | "classical-fallback" | "no-crypto"

interface NyuchiCryptoFallbackProps {
  children: React.ReactNode
  state: CryptoFallbackState
  pqcAlgorithm?: string
  classicalAlgorithm?: string
  showIndicator?: boolean
  className?: string
}

const STATE_CONFIG: Record<CryptoFallbackState, { color: string; label: string; icon: string }> = {
  "pqc-active": {
    color: "var(--crypto-quantum-safe, #22C55E)",
    label: "Quantum-Safe",
    icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  },
  "pqc-loading": {
    color: "var(--status-info, #3B82F6)",
    label: "Loading PQC...",
    icon: "M21 12a9 9 0 11-6.219-8.56",
  },
  "classical-fallback": {
    color: "var(--crypto-classical, var(--crypto-classical, #3B82F6))",
    label: "Standard Security",
    icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  },
  "no-crypto": {
    color: "var(--crypto-none, #EF4444)",
    label: "Unverified",
    icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
  },
}

export function NyuchiCryptoFallback({
  children,
  state,
  pqcAlgorithm = "CRYSTALS-Dilithium",
  classicalAlgorithm = "ECDSA",
  showIndicator = true,
  className,
}: NyuchiCryptoFallbackProps) {
  const { log } = useNyuchiHarness("crypto-fallback")

  React.useEffect(() => {
    if (state === "classical-fallback")
      log.warn("pqc_fallback", { pqc: pqcAlgorithm, classical: classicalAlgorithm })
  }, [state, pqcAlgorithm, classicalAlgorithm, log])

  const config = STATE_CONFIG[state]

  return (
    <div
      data-slot="nyuchi-crypto-fallback"
      data-portal="https://mzizi.dev/components/nyuchi-crypto-fallback"
      className={className}
    >
      {children}
      {showIndicator && state !== "pqc-active" && (
        <div
          role="status"
          className="mt-2 flex items-center gap-1.5 text-xs"
          style={{ color: config.color }}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={state === "pqc-loading" ? "animate-spin" : ""}
            aria-hidden="true"
          >
            <path d={config.icon} />
          </svg>
          <span>
            {config.label}
            {state === "classical-fallback" ? ` (${classicalAlgorithm})` : ""}
          </span>
        </div>
      )}
    </div>
  )
}
export type { CryptoFallbackState, NyuchiCryptoFallbackProps }
