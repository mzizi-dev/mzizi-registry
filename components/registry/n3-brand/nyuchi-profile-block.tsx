"use client"

// ── INFRASTRUCTURE HARNESS (auto-wired) ──
// Every brand component participates in observability, motion, a11y,
// and health monitoring via the harness. Zero manual config.
import { useNyuchiHarness } from "@/lib/harness"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Shield, Activity, Star, TrendingUp } from "@/lib/icons"

/* ═══════════════════════════════════════════════════════════════
   MUKOKO PROFILE BLOCK — Brand Identity Component
   
   The profile header is the ONE place where all three trust
   axes are shown in full detail (not just as compact badges):
   
   1. VERIFIED BADGE — Mineral-colored tier icon next to name
   2. STATUS PILL — Platform lifecycle indicator
   3. TRUST SCORE — Visual meter showing composite score
   
   Everywhere else in the app, trust is communicated through
   the compact verified badge only. But on the profile, users
   can see the full picture: why their trust score is what it
   is, what tier they are, and what their platform status is.
   
   Design identity markers:
   - Centered layout (always)
   - Avatar with initials fallback in brand accent
   - Name in Noto Serif with inline verified badge
   - Three trust indicators below the name
   - Stats row at the bottom
   ═══════════════════════════════════════════════════════════════ */

/* ── Type imports from nyuchi-verified-badge ──────────────── */
type VerificationTier = "unverified" | "community" | "otp" | "government" | "licensed"
type PlatformStatus =
  | "pre_verification"
  | "living"
  | "liveness_pending"
  | "suspended"
  | "presumed_ancestral"
  | "verified_ancestral"

/* ── Tier display config (mirrors nyuchi-verified-badge) ──── */
const TIER_DISPLAY: Record<
  VerificationTier,
  { label: string; mineral: string | null; fg: string; bg: string; icon: string }
> = {
  unverified: {
    label: "Unverified",
    mineral: null,
    fg: "#6B6B66",
    bg: "rgba(107,107,102,0.15)",
    icon: "circle",
  },
  community: {
    label: "Community Verified",
    mineral: "Terracotta",
    fg: "var(--color-terracotta,#D4A574)",
    bg: "rgba(212,165,116,0.15)",
    icon: "users",
  },
  otp: {
    label: "Contact Verified",
    mineral: "Cobalt",
    fg: "var(--color-cobalt,#00B0FF)",
    bg: "rgba(0,176,255,0.15)",
    icon: "phone",
  },
  government: {
    label: "Government Verified",
    mineral: "Gold",
    fg: "var(--color-gold,#FFD740)",
    bg: "rgba(255,215,64,0.15)",
    icon: "shield-check",
  },
  licensed: {
    label: "Licensed Professional",
    mineral: "Tanzanite",
    fg: "var(--color-tanzanite,#B388FF)",
    bg: "rgba(179,136,255,0.15)",
    icon: "award",
  },
}

/* ── Status display config ───────────────────────────────── */
const STATUS_DISPLAY: Record<PlatformStatus, { label: string; color: string; bg: string }> = {
  pre_verification: {
    label: "New",
    color: "var(--status-neutral, #6B6B66)",
    bg: "rgba(107,107,102,0.12)",
  },
  living: { label: "Active", color: "var(--status-success, #64FFDA)", bg: "rgba(74,222,128,0.12)" },
  liveness_pending: {
    label: "Pending",
    color: "var(--status-warning, #FFD740)",
    bg: "rgba(251,191,36,0.12)",
  },
  suspended: {
    label: "Suspended",
    color: "var(--status-error, #FF5252)",
    bg: "rgba(248,113,113,0.12)",
  },
  presumed_ancestral: {
    label: "Memorial",
    color: "var(--tier-government, var(--color-tanzanite, #B388FF))",
    bg: "rgba(167,139,250,0.12)",
  },
  verified_ancestral: {
    label: "Ancestral",
    color: "var(--tier-government, var(--color-tanzanite, #B388FF))",
    bg: "rgba(167,139,250,0.12)",
  },
}

interface ProfileStat {
  value: string | number
  label: string
}

interface NyuchiProfileBlockProps {
  loading?: boolean
  name: string
  subtitle?: string
  avatar?: string
  avatarSize?: number
  accentColor?: string
  /** Verification tier — controls the badge next to the name */
  verificationTier?: VerificationTier
  /** Platform status — shown as a status pill */
  platformStatus?: PlatformStatus
  /** Trust score (0.000 - 1.000) — shown as a visual meter */
  trustScore?: number
  /** Ubuntu points — shown alongside trust score */
  ubuntuPoints?: number
  stats?: ProfileStat[]
  actions?: React.ReactNode
  /** Render custom verified badge (if using the actual component) */
  verifiedBadge?: React.ReactNode
  className?: string
}

export function NyuchiProfileBlock({
  loading = false,
  name,
  subtitle,
  avatar,
  avatarSize = 80,
  accentColor = "var(--color-malachite)",
  verificationTier = "unverified",
  platformStatus = "pre_verification",
  trustScore,
  ubuntuPoints,
  stats,
  actions,
  verifiedBadge,
  className,
}: NyuchiProfileBlockProps) {
  const { motion } = useNyuchiHarness("profile-block")
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
        data-slot="nyuchi-profile-block"
        data-portal="https://mzizi.dev/components/nyuchi-profile-block"
        data-loading
        role="region"
        aria-label="Profile"
        className="flex animate-pulse flex-col items-center gap-3 p-4"
      >
        <div className="size-16 rounded-full bg-muted" />
        <div className="h-4 w-24 rounded bg-muted" />
        <div className="h-2.5 w-16 rounded bg-muted" />
        <div className="mt-2 flex gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-1 text-center">
              <div className="mx-auto h-4 w-8 rounded bg-muted" />
              <div className="h-2 w-10 rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    )

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  const tierConfig = TIER_DISPLAY[verificationTier]
  const statusConfig = STATUS_DISPLAY[platformStatus]
  const showTrustIndicators = verificationTier !== "unverified" || trustScore != null

  /* Trust score percentage for the meter */
  const trustPercent = trustScore != null ? Math.round(trustScore * 100) : 0
  /* Trust score color based on value */
  const trustColor =
    trustScore != null
      ? trustScore >= 0.4
        ? "#4ADE80" /* Green — strong trust */
        : trustScore >= 0.2
          ? "#FBBF24" /* Amber — growing trust */
          : "#F87171" /* Red — low trust */
      : "#6B6B66"

  return (
    <div
      data-slot="nyuchi-profile-block"
      style={animStyle}
      role="region"
      aria-label="Profile"
      className={cn("flex flex-col items-center px-5 py-3", className)}
    >
      {/* Avatar */}
      <div
        className="flex items-center justify-center overflow-hidden rounded-full"
        style={{
          width: avatarSize,
          height: avatarSize,
          backgroundColor: avatar ? undefined : accentColor,
        }}
      >
        {avatar ? (
          <img src={avatar} alt={name} className="size-full object-cover" />
        ) : (
          <span className="font-bold text-background" style={{ fontSize: avatarSize * 0.35 }}>
            {initials}
          </span>
        )}
      </div>

      {/* Name + inline verified badge */}
      <div className="mt-3.5 flex items-center gap-1.5">
        <h2 className="font-serif text-xl font-bold text-foreground">{name}</h2>
        {/* Render custom badge component if provided, otherwise show built-in */}
        {verifiedBadge
          ? verifiedBadge
          : verificationTier !== "unverified" && (
              <span
                className="inline-flex size-[18px] items-center justify-center rounded-full"
                style={{ backgroundColor: tierConfig.bg }}
                title={tierConfig.label}
              >
                <Shield className="size-3" style={{ color: tierConfig.fg }} strokeWidth={2.5} />
              </span>
            )}
      </div>

      {/* Subtitle */}
      {subtitle && <p className="mt-1 text-[13px] text-muted-foreground">{subtitle}</p>}

      {/* ═══ TRUST INDICATORS (profile-only expanded view) ═══ */}
      {showTrustIndicators && (
        <div className="mt-4 flex w-full max-w-xs flex-col gap-3">
          {/* Row 1: Verification tier + Status pill */}
          <div className="flex items-center justify-center gap-3">
            {/* Verification tier pill */}
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
              style={{ backgroundColor: tierConfig.bg, color: tierConfig.fg }}
            >
              <Shield className="size-3" strokeWidth={2.5} />
              {tierConfig.label}
            </span>
            {/* Status pill */}
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
              style={{ backgroundColor: statusConfig.bg, color: statusConfig.color }}
            >
              <Activity className="size-3" strokeWidth={2.5} />
              {statusConfig.label}
            </span>
          </div>

          {/* Row 2: Trust score meter */}
          {trustScore != null && (
            <div className="flex flex-col items-center gap-1.5">
              <div className="flex w-full items-center justify-between text-[11px]">
                <span className="flex items-center gap-1 font-medium text-muted-foreground">
                  <TrendingUp className="size-3" />
                  Trust Score
                </span>
                <span className="font-bold" style={{ color: trustColor }}>
                  {trustScore.toFixed(3)}
                </span>
              </div>
              {/* Visual meter bar */}
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${trustPercent}%`,
                    backgroundColor: trustColor,
                  }}
                />
              </div>
              {/* Ubuntu points */}
              {ubuntuPoints != null && (
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Star
                    className="size-2.5"
                    style={{ color: "var(--color-gold, var(--color-gold,#FFD740))" }}
                  />
                  {ubuntuPoints.toLocaleString()} Ubuntu Points
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Stats row */}
      {stats && stats.length > 0 && (
        <div className="mt-5 flex items-center gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-xl font-bold text-foreground">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Actions slot */}
      {actions && <div className="mt-5 flex items-center gap-3">{actions}</div>}
    </div>
  )
}

export type { NyuchiProfileBlockProps, ProfileStat, VerificationTier, PlatformStatus }
