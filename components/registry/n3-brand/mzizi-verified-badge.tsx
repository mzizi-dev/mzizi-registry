"use client"

// ── INFRASTRUCTURE HARNESS (auto-wired) ──
// Every brand component participates in observability, motion, a11y,
// and health monitoring via the harness. Zero manual config.

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Ban, Flower2 } from "@/lib/icons"
import {
  TIER_CONFIG,
  STATUS_OVERLAY,
  computeTrustScore,
  type VerificationTier,
  type PlatformStatus,
} from "@/lib/mzizi-trust-tiers"
import { cn } from "@/lib/utils"

/* ═══════════════════════════════════════════════════════════════
   MUKOKO VERIFIED BADGE — Brand Identity Component
   
   Three-axis trust model (nyuchi_platform_db):
   
   AXIS 1 — STATUS (identity.person.mit_status)
     Platform lifecycle. Independent of verification.
     pre_verification | living | liveness_pending |
     suspended | presumed_ancestral | verified_ancestral
   
   AXIS 2 — VERIFICATION TIER (system.verification_tier)
     Identity ladder. How real are you?
     Level 0: Unverified     — no badge
     Level 1: Community      — Terracotta (var(--color-terracotta,#D4A574)) — +0.10
     Level 2: OTP            — Cobalt (var(--tier-otp,var(--color-cobalt,#00B0FF)))     — +0.10 (cumulative 0.20)
     Level 3: Government     — Gold (var(--tier-government,var(--color-gold,#FFD740)))       — +0.10 (cumulative 0.30)
     Level 4: Licensed       — Tanzanite (var(--tier-licensed,var(--color-tanzanite,#B388FF)))  — +0.20 (cumulative 0.50)

   Each tier reads the --tier-* variable named after IT (government reads
   --tier-government), so a consumer that sets one recolours that tier only.
   
   AXIS 3 — TRUST SCORE (computed output)
     trust = sum(tier_increments up to current level) + status_modifier
     Suspended/ancestral = fixed at status modifier (trust frozen)
   
   The badge renders based on TIER (which mineral check you see)
   but respects STATUS (dimmed if suspended, memorial if ancestral).

   The ladder (TIER_CONFIG, STATUS_OVERLAY, computeTrustScore and the
   types) lives in the server-safe lib/mzizi-trust-tiers (#543); this
   client module re-exports it so existing imports keep working.
   ═══════════════════════════════════════════════════════════════ */

const badgeSizeVariants = cva(
  "inline-flex shrink-0 items-center justify-center rounded-full transition-opacity",
  {
    variants: {
      size: {
        sm: "size-3.5" /* Inline with text — next to names */,
        md: "size-[18px]" /* Default — cards, headers */,
        lg: "size-6" /* Profile pages */,
        xl: "size-8" /* Verification detail views */,
      },
    },
    defaultVariants: { size: "md" },
  }
)

const iconSizeMap = { sm: 10, md: 12, lg: 16, xl: 20 } as const

interface MziziVerifiedBadgeProps extends VariantProps<typeof badgeSizeVariants> {
  /** Verification tier code (system.verification_tier.tier_code) */
  tier: VerificationTier
  /** Platform status (identity.person.mit_status). Affects badge appearance. */
  status?: PlatformStatus
  /** Set the native `title` (the badge's name, shown on hover). There is no tooltip component. */
  showTooltip?: boolean
  /**
   * The wording, in place of the built-in name: the tier's label ("Contact Verified"), "Account
   * Suspended", or "<tier> — Memorial". It is the `title` and, unless `ariaLabel` is set, the
   * accessible name. Use it to localise the badge or to name the tier in the app's own words.
   */
  label?: string
  /** The accessible name, when it should differ from `label` (or the built-in name). */
  ariaLabel?: string
  /**
   * Add the tier's cumulative trust score ("· Trust 0.2") to the title and the accessible name.
   * Off by default since #550: the raw score is a number for a trust audit, not for a reader.
   */
  showScore?: boolean
  /** Render skeleton placeholder while verification status is loading */
  loading?: boolean
  className?: string
}

function MziziVerifiedBadge({
  tier,
  status = "living",
  size = "md",
  showTooltip = true,
  label,
  ariaLabel,
  showScore = false,
  loading = false,
  className,
}: MziziVerifiedBadgeProps) {
  if (loading)
    return (
      <span
        data-slot="mzizi-verified-badge"
        data-portal="https://mzizi.dev/components/mzizi-verified-badge"
        data-loading
        className="inline-flex size-4 animate-pulse rounded-full bg-muted"
      />
    )

  const config = TIER_CONFIG[tier]
  const statusConfig = STATUS_OVERLAY[status]
  const iconSize = iconSizeMap[size || "md"]

  /* Level 0 = no badge */
  if (!config.icon || tier === "unverified") return null

  /* The name: the caller's wording or the built-in one, with the score only on request. */
  const named = (builtIn: string) => {
    const text = label ?? builtIn
    return showScore ? `${text} · Trust ${config.cumulativeTrust}` : text
  }

  /* Suspended: show ban overlay instead of tier icon */
  if (statusConfig.overlay === "suspended") {
    return (
      <span
        data-slot="mzizi-verified-badge"
        data-tier={tier}
        data-status="suspended"
        role="img"
        aria-label={ariaLabel ?? named("Account Suspended")}
        title={showTooltip ? named("Account Suspended") : undefined}
        className={cn(badgeSizeVariants({ size }), "opacity-40", className)}
        style={{ backgroundColor: "rgba(107,107,102,0.15)" }}
      >
        <Ban
          width={iconSize}
          height={iconSize}
          strokeWidth={2.5}
          color="var(--status-neutral, #6B6B66)"
        />
      </span>
    )
  }

  /* Ancestral: show memorial flower with dimmed tier color */
  if (statusConfig.overlay === "ancestral") {
    return (
      <span
        data-slot="mzizi-verified-badge"
        data-tier={tier}
        data-status={status}
        role="img"
        aria-label={ariaLabel ?? named(`${config.label} — Memorial`)}
        title={showTooltip ? named(`${config.label} — Memorial`) : undefined}
        className={cn(badgeSizeVariants({ size }), "opacity-60", className)}
        style={{ backgroundColor: config.bg }}
      >
        <Flower2 width={iconSize} height={iconSize} strokeWidth={2} style={{ color: config.fg }} />
      </span>
    )
  }

  /* Active: show full tier badge */
  const Icon = config.icon
  return (
    <span
      data-slot="mzizi-verified-badge"
      data-tier={tier}
      data-level={config.level}
      data-trust={config.cumulativeTrust}
      role="img"
      aria-label={ariaLabel ?? named(config.label)}
      title={showTooltip ? named(config.label) : undefined}
      className={cn(badgeSizeVariants({ size }), className)}
      style={{ backgroundColor: config.bg }}
    >
      <Icon width={iconSize} height={iconSize} strokeWidth={2.5} style={{ color: config.fg }} />
    </span>
  )
}

export { MziziVerifiedBadge, computeTrustScore, TIER_CONFIG, STATUS_OVERLAY }
export type { MziziVerifiedBadgeProps, VerificationTier, PlatformStatus }
