"use client"
import * as React from "react"
import { cn } from "@/lib/utils"
import { useNyuchiHarness } from "@/lib/harness"

interface FeatureFlag {
  key: string
  enabled: boolean
  source: "local" | "remote" | "default"
  variant?: string
  rolloutPercent?: number
}

interface NyuchiFeatureGateProps {
  children: React.ReactNode
  flag: FeatureFlag
  /** Show nothing when disabled (default: false shows a fallback) */
  silent?: boolean
  fallback?: React.ReactNode
  /** Show "coming soon" instead of hiding */
  showComingSoon?: boolean
  loading?: boolean
  className?: string
}

export function NyuchiFeatureGate({
  children,
  flag,
  silent = false,
  fallback,
  showComingSoon = false,
  loading = false,
  className,
}: NyuchiFeatureGateProps) {
  const { log, motion } = useNyuchiHarness("feature-gate")
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
    if (!flag.enabled) log.info(`feature_disabled: key=${flag.key}, source=${flag.source}`)
  }, [flag, log])

  if (loading)
    return (
      <div
        data-slot="nyuchi-feature-gate"
        data-portal="https://mzizi.dev/components/nyuchi-feature-gate"
        data-loading
        role="status"
        className="h-16 animate-pulse rounded-[var(--radius-lg,14px)] bg-muted"
      />
    )
  if (flag.enabled) return <>{children}</>
  if (silent) return null
  if (fallback) return <>{fallback}</>
  if (!showComingSoon) return null

  return (
    <div
      data-slot="nyuchi-feature-gate"
      role="status"
      style={animStyle}
      className={cn(
        "flex items-center gap-3 rounded-[var(--radius-lg,14px)] bg-card p-4 opacity-60 ring-1 ring-foreground/10",
        className
      )}
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--status-info,#3B82F6)]/15">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--status-info, #3B82F6)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">Coming Soon</p>
        <p className="text-xs text-muted-foreground">
          This feature is being prepared for your region.
        </p>
      </div>
    </div>
  )
}
export type { FeatureFlag, NyuchiFeatureGateProps }
