"use client"
import * as React from "react"
import { cn } from "@/lib/utils"
import { useNyuchiHarness } from "@/lib/harness"

type DIDStatus = "verified" | "locally-verified" | "expired" | "revoked" | "missing" | "checking"

interface VerifiableCredential {
  type: string
  issuer: string
  issuanceDate: string
  expirationDate?: string
  status: DIDStatus
}

interface NyuchiDIDGateProps {
  children: React.ReactNode
  credential: VerifiableCredential | null
  requiredType?: string
  onVerify?: () => void
  fallback?: React.ReactNode
  loading?: boolean
  className?: string
}

const STATUS_CONFIG: Record<DIDStatus, { color: string; label: string; icon: string }> = {
  verified: {
    color: "var(--status-success, #22C55E)",
    label: "Verified",
    icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  "locally-verified": {
    color: "var(--status-warning, #F59E0B)",
    label: "Locally Verified — awaiting server confirmation",
    icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  expired: {
    color: "var(--status-warning, #F59E0B)",
    label: "Credential Expired",
    icon: "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  revoked: {
    color: "var(--status-error, #EF4444)",
    label: "Credential Revoked",
    icon: "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636",
  },
  missing: {
    color: "var(--color-muted-foreground, #6B6B66)",
    label: "No Credential Found",
    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  },
  checking: {
    color: "var(--status-info, #3B82F6)",
    label: "Checking credential...",
    icon: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
  },
}

export function NyuchiDIDGate({
  children,
  credential,
  requiredType,
  onVerify,
  fallback,
  loading = false,
  className,
}: NyuchiDIDGateProps) {
  const { motion } = useNyuchiHarness("did-gate")
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
        data-slot="nyuchi-did-gate"
        data-portal="https://mzizi.dev/components/nyuchi-did-gate"
        data-loading
        role="status"
        className="h-36 animate-pulse rounded-[var(--radius-lg,14px)] bg-muted"
      />
    )

  const status = credential?.status ?? "missing"
  const isAccessible = status === "verified" || status === "locally-verified"
  const typeMatch = !requiredType || credential?.type === requiredType

  if (isAccessible && typeMatch) return <>{children}</>
  if (fallback) return <>{fallback}</>

  const config = STATUS_CONFIG[status]
  return (
    <div
      data-slot="nyuchi-did-gate"
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
          className={status === "checking" ? "animate-spin" : ""}
        >
          <path d={config.icon} />
        </svg>
      </div>
      <div>
        <p
          className="text-base font-semibold text-foreground"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          Digital Credential Required
        </p>
        <p className="mt-1 text-sm" style={{ color: config.color }}>
          {config.label}
        </p>
        {requiredType && (
          <p className="mt-1 text-xs text-muted-foreground">Required: {requiredType}</p>
        )}
        {credential?.issuer && (
          <p className="mt-1 text-xs text-muted-foreground">Issuer: {credential.issuer}</p>
        )}
      </div>
      {onVerify && status !== "checking" && (
        <button
          onClick={onVerify}
          className="min-h-[48px] rounded-full bg-muted px-6 text-sm font-medium text-foreground transition-colors hover:bg-muted/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary,#00B0FF)]"
        >
          {status === "missing"
            ? "Get Credential"
            : status === "expired"
              ? "Renew Credential"
              : "Verify Again"}
        </button>
      )}
    </div>
  )
}
export type { DIDStatus, VerifiableCredential, NyuchiDIDGateProps }
