"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { useNyuchiHarness } from "@/lib/harness"

/* ═══════════════════════════════════════════════════════════════
   NYUCHI TRUST GATE — Layer 4 Safety & Trust
   
   Trust score thresholds for platform features.
   ✅ HARNESS  ✅ TOKENS  ✅ ARIA  ✅ LOADING  ✅ MOTION
   ═══════════════════════════════════════════════════════════════ */

interface TrustAction {
  label: string
  description: string
  mineral: string
}

const IMPROVEMENT_ACTIONS: TrustAction[] = [
  {
    label: "Complete your profile",
    description: "Add a photo, bio, and verify your phone number",
    mineral: "var(--status-info, #3B82F6)",
  },
  {
    label: "Verify your identity",
    description: "Upload a government ID for higher trust",
    mineral: "var(--tier-government, var(--color-tanzanite, #B388FF))",
  },
  {
    label: "Engage with the community",
    description: "Post, comment, and help others to build trust",
    mineral: "var(--status-success, #22C55E)",
  },
]

interface NyuchiTrustGateProps {
  children: React.ReactNode
  requiredScore: number
  userScore: number
  featureName?: string
  fallback?: React.ReactNode
  onImprove?: () => void
  loading?: boolean
  className?: string
}

export function NyuchiTrustGate({
  children,
  requiredScore,
  userScore,
  featureName = "this feature",
  fallback,
  onImprove,
  loading = false,
  className,
}: NyuchiTrustGateProps) {
  const { log, motion } = useNyuchiHarness("trust-gate")
  const animStyle = React.useMemo(
    () =>
      motion.prefersReduced
        ? {}
        : {
            animation: `nyuchi-fade-slide-up ${motion.enterDuration}ms ${motion.enterEasing} both`,
          },
    [motion]
  )

  const hasAccess = userScore >= requiredScore
  const percent = Math.min(100, Math.round((userScore / Math.max(requiredScore, 0.01)) * 100))

  React.useEffect(() => {
    if (!hasAccess) log.info(`blocked: score=${userScore}, required=${requiredScore}`)
  }, [hasAccess, userScore, requiredScore, log])

  if (loading)
    return (
      <div
        data-slot="nyuchi-trust-gate"
        data-portal="https://mzizi.dev/components/nyuchi-trust-gate"
        data-loading
        role="status"
        className="h-40 animate-pulse rounded-[var(--radius-lg,14px)] bg-muted"
      />
    )

  if (hasAccess) return <>{children}</>
  if (fallback) return <>{fallback}</>

  return (
    <div
      data-slot="nyuchi-trust-gate"
      role="alert"
      aria-live="polite"
      style={animStyle}
      className={cn(
        "flex flex-col gap-4 rounded-[var(--radius-lg,14px)] bg-card p-6 ring-1 ring-foreground/10",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex size-12 items-center justify-center rounded-full bg-[var(--color-gold,#FFD740)]/15">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-gold, #FFD740)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M9 12l2 2 4-4" />
          </svg>
        </div>
        <div>
          <p
            className="text-base font-semibold text-foreground"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            Trust Score Required
          </p>
          <p className="text-sm text-muted-foreground">
            {featureName} requires a trust score of {requiredScore.toFixed(1)}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div className="mb-1 flex justify-between text-xs text-muted-foreground">
          <span>
            Your score: <strong className="text-foreground">{userScore.toFixed(2)}</strong>
          </span>
          <span>Required: {requiredScore.toFixed(1)}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-[var(--color-gold,#FFD740)] transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Improvement actions */}
      <div className="space-y-2">
        <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
          How to improve
        </p>
        {IMPROVEMENT_ACTIONS.map((a, i) => (
          <div key={i} className="flex items-start gap-2 text-sm">
            <div
              className="mt-0.5 size-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: a.mineral }}
            />
            <div>
              <strong className="text-foreground">{a.label}</strong>
              <span className="text-muted-foreground"> — {a.description}</span>
            </div>
          </div>
        ))}
      </div>

      {onImprove && (
        <button
          onClick={onImprove}
          className="min-h-[48px] self-start rounded-full bg-[var(--color-gold,#FFD740)] px-6 text-sm font-medium text-black transition-colors hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary,#00B0FF)]"
        >
          Improve Trust Score
        </button>
      )}
    </div>
  )
}

export type { NyuchiTrustGateProps }
