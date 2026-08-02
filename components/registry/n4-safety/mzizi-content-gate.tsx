"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { useNyuchiHarness } from "@/lib/harness"

/* ═══════════════════════════════════════════════════════════════
   NYUCHI CONTENT GATE — Layer 4 Safety & Trust
   
   Age gates, location gates, content sensitivity filters.
   ✅ HARNESS  ✅ TOKENS  ✅ ARIA  ✅ LOADING  ✅ MOTION
   ═══════════════════════════════════════════════════════════════ */

type GateType = "age" | "location" | "sensitivity" | "custom"

interface GateCheck {
  type: GateType
  passed: boolean
  reason?: string
  /** Minimum age required (for age gates) */
  minAge?: number
  /** Sensitivity level (for sensitivity gates) */
  level?: "mild" | "moderate" | "mature" | "restricted"
}

interface NyuchiContentGateProps {
  children: React.ReactNode
  checks: GateCheck[]
  fallback?: React.ReactNode
  /** Whether to show which specific check failed */
  showReason?: boolean
  onAction?: (failedCheck: GateCheck) => void
  loading?: boolean
  className?: string
}

const GATE_ICONS: Record<GateType, string> = {
  age: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  location: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z",
  sensitivity:
    "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243",
  custom:
    "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z",
}

const GATE_LABELS: Record<GateType, string> = {
  age: "Age Restriction",
  location: "Location Restricted",
  sensitivity: "Content Warning",
  custom: "Access Restricted",
}

export function NyuchiContentGate({
  children,
  checks,
  fallback,
  showReason = true,
  onAction,
  loading = false,
  className,
}: NyuchiContentGateProps) {
  const { log, motion } = useNyuchiHarness("content-gate")
  const animStyle = React.useMemo(
    () =>
      motion.prefersReduced
        ? {}
        : {
            animation: `nyuchi-fade-slide-up ${motion.enterDuration}ms ${motion.enterEasing} both`,
          },
    [motion]
  )

  const failedCheck = checks.find((c) => !c.passed)

  React.useEffect(() => {
    if (failedCheck)
      log.info(`blocked: type=${failedCheck.type}, reason=${failedCheck.reason || "unspecified"}`)
  }, [failedCheck, log])

  if (loading)
    return (
      <div
        data-slot="nyuchi-content-gate"
        data-portal="https://mzizi.dev/components/nyuchi-content-gate"
        data-loading
        role="status"
        className="h-32 animate-pulse rounded-[var(--radius-lg,14px)] bg-muted"
      />
    )

  if (!failedCheck) return <>{children}</>
  if (fallback) return <>{fallback}</>

  const icon = GATE_ICONS[failedCheck.type]
  const label = GATE_LABELS[failedCheck.type]

  return (
    <div
      data-slot="nyuchi-content-gate"
      role="alert"
      aria-live="polite"
      style={animStyle}
      className={cn(
        "flex flex-col items-center gap-4 rounded-[var(--radius-lg,14px)] bg-card p-6 text-center ring-1 ring-foreground/10",
        className
      )}
    >
      <div className="flex size-14 items-center justify-center rounded-full bg-[var(--status-warning,#F59E0B)]/15">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--status-warning, #F59E0B)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d={icon} />
        </svg>
      </div>
      <div>
        <p
          className="text-base font-semibold text-foreground"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          {label}
        </p>
        {showReason && failedCheck.reason && (
          <p className="mt-1 text-sm text-muted-foreground">{failedCheck.reason}</p>
        )}
        {failedCheck.type === "age" && failedCheck.minAge && (
          <p className="mt-1 text-sm text-muted-foreground">
            You must be at least {failedCheck.minAge} years old to view this content.
          </p>
        )}
      </div>
      {onAction && (
        <button
          onClick={() => onAction(failedCheck)}
          className="min-h-[48px] rounded-full bg-muted px-6 text-sm font-medium text-foreground transition-colors hover:bg-muted/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary,#00B0FF)]"
        >
          {failedCheck.type === "age"
            ? "Verify Age"
            : failedCheck.type === "location"
              ? "Change Location"
              : "Learn More"}
        </button>
      )}
    </div>
  )
}

export type { GateType, GateCheck, NyuchiContentGateProps }
