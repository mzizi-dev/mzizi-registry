"use client"
import * as React from "react"
import { cn } from "@/lib/utils"
import { useNyuchiHarness } from "@/lib/harness"

interface GeoRestriction {
  allowed: boolean
  userCountry: string
  requiredJurisdictions?: string[]
  regulation?: string
  reason?: string
}

interface NyuchiGeoGateProps {
  children: React.ReactNode
  restriction: GeoRestriction
  fallback?: React.ReactNode
  onLearnMore?: () => void
  loading?: boolean
  className?: string
}

export function NyuchiGeoGate({
  children,
  restriction,
  fallback,
  onLearnMore,
  loading = false,
  className,
}: NyuchiGeoGateProps) {
  const { motion } = useNyuchiHarness("geo-gate")
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
        data-slot="nyuchi-geo-gate"
        data-portal="https://mzizi.dev/components/nyuchi-geo-gate"
        data-loading
        role="status"
        className="h-28 animate-pulse rounded-[var(--radius-lg,14px)] bg-muted"
      />
    )
  if (restriction.allowed) return <>{children}</>
  if (fallback) return <>{fallback}</>

  return (
    <div
      data-slot="nyuchi-geo-gate"
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
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
        </svg>
      </div>
      <div>
        <p
          className="text-base font-semibold text-foreground"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          Region Restricted
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {restriction.reason || "This content is not available in your region."}
        </p>
        {restriction.regulation && (
          <p className="mt-1 text-xs text-muted-foreground">Regulation: {restriction.regulation}</p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">
          Your location: {restriction.userCountry}
        </p>
      </div>
      {onLearnMore && (
        <button
          onClick={onLearnMore}
          className="min-h-[48px] rounded-full bg-muted px-6 text-sm font-medium text-foreground transition-colors hover:bg-muted/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary,#00B0FF)]"
        >
          Learn More
        </button>
      )}
    </div>
  )
}
export type { GeoRestriction, NyuchiGeoGateProps }
