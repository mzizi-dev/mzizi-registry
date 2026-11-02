"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { useMziziHarness } from "@/lib/harness"

/* ═══════════════════════════════════════════════════════════════
   NYUCHI PERMISSION GATE — Layer 4 Safety & Trust
   
   Checks verification tier BEFORE content renders.
   Composes Layer 3 brand components for its UI.
   ✅ HARNESS  ✅ TOKENS  ✅ ARIA  ✅ LOADING  ✅ MOTION
   ═══════════════════════════════════════════════════════════════ */

type VerificationTier = "unverified" | "community" | "otp" | "government" | "licensed"

const TIER_ORDER: Record<VerificationTier, number> = {
  unverified: 0,
  community: 1,
  otp: 2,
  government: 3,
  licensed: 4,
}

const TIER_LABELS: Record<VerificationTier, string> = {
  unverified: "Unverified",
  community: "Community Verified",
  otp: "Contact Verified",
  government: "Government Verified",
  licensed: "Licensed Professional",
}

const TIER_MINERALS: Record<VerificationTier, string> = {
  unverified: "var(--tier-unverified, var(--status-neutral))",
  community: "var(--tier-community, var(--color-terracotta))",
  otp: "var(--tier-otp, var(--color-cobalt))",
  government: "var(--tier-government, var(--color-gold))",
  licensed: "var(--tier-licensed, var(--color-tanzanite))",
}

interface MziziPermissionGateProps {
  children: React.ReactNode
  /** The minimum tier required to see the content */
  requiredTier: VerificationTier
  /** The user's current verification tier */
  userTier: VerificationTier
  /** Custom fallback instead of the default upgrade CTA */
  fallback?: React.ReactNode
  /** Feature name shown in the upgrade CTA */
  featureName?: string
  /** Callback when user taps the upgrade button */
  onUpgrade?: () => void
  loading?: boolean
  className?: string
}

export function MziziPermissionGate({
  children,
  requiredTier,
  userTier,
  fallback,
  featureName = "this feature",
  onUpgrade,
  loading = false,
  className,
}: MziziPermissionGateProps) {
  const { log, motion } = useMziziHarness("permission-gate")
  const animStyle = React.useMemo(
    () =>
      motion.prefersReduced
        ? {}
        : {
            animation: `nyuchi-fade-slide-up ${motion.enterDuration}ms ${motion.enterEasing} both`,
          },
    [motion]
  )

  const hasAccess = TIER_ORDER[userTier] >= TIER_ORDER[requiredTier]

  React.useEffect(() => {
    if (!hasAccess) log.info(`blocked: user=${userTier}, required=${requiredTier}`)
  }, [hasAccess, userTier, requiredTier, log])

  if (loading) {
    return (
      <div
        data-slot="mzizi-permission-gate"
        data-portal="https://mzizi.dev/components/mzizi-permission-gate"
        data-loading
        role="status"
        className="h-32 animate-pulse rounded-[var(--radius-lg,14px)] bg-muted"
      />
    )
  }

  if (hasAccess) return <>{children}</>

  if (fallback) return <>{fallback}</>

  const requiredColor = TIER_MINERALS[requiredTier]

  return (
    <div
      data-slot="mzizi-permission-gate"
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
        style={{ backgroundColor: `color-mix(in srgb, ${requiredColor} 15%, transparent)` }}
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke={requiredColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      </div>
      <div>
        <p
          className="text-base font-semibold text-foreground"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          Verification Required
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {featureName} requires{" "}
          <strong style={{ color: requiredColor }}>{TIER_LABELS[requiredTier]}</strong> status. You
          are currently <strong>{TIER_LABELS[userTier]}</strong>.
        </p>
      </div>
      {/* The action is the brand's primary pair: `--primary-foreground` is "text and icons on
          `primary`", held to body contrast by the role set in every theme and brand overlay
          (18.4:1 light, 16.0:1 dark on the default pack). The white-on-cobalt it replaces was
          2.4:1 on dark cobalt #00B0FF, under WCAG AA. */}
      {onUpgrade && (
        <button
          onClick={onUpgrade}
          type="button"
          data-slot="mzizi-permission-gate-upgrade"
          className="min-h-[48px] rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          Upgrade Verification
        </button>
      )}
    </div>
  )
}

export type { VerificationTier, MziziPermissionGateProps }
