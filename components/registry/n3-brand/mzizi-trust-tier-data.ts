/**
 * The verification tier ladder as data, framework-free: no React, no icon library, no
 * `@/` import and no browser globals. Astro components import it flat
 * (`./mzizi-trust-tier-data`), React builds import it as `@/lib/mzizi-trust-tier-data`, and a
 * package (`@bundu/ui`) can ship it as a plain module.
 *
 * Installs to lib/mzizi-trust-tier-data.ts.
 *
 * `mzizi-trust-tiers` builds its `TIER_CONFIG` from this module and adds the Lucide icons the
 * older React components read; everything else (labels, levels, minerals, trust increments,
 * the `--tier-*` token names and the Tailwind classes that read them) lives here, once.
 *
 * COLOUR. Every tier reads its `--tier-*` role, defined once in the N1 tokens
 * (`lib/tokens/roles.source.ts`, owner decision 2026-10-24, #543): unverified → the neutral grey
 * (`--status-neutral`), community → terracotta, otp ("Contact Verified") → cobalt, government →
 * gold, licensed → tanzanite. Each role comes in four APCA-gated parts: the tier itself, its
 * `-container` fill, the `-on-container` ink for that fill, and a `-text` ink for the page
 * surface. Use the pairs as they are given (`container` with `onContainer`, `text` on a
 * surface); never put a tier's ink on another tier's fill.
 *
 * The classes are complete literal strings so Tailwind's scanner finds them; never compose a
 * class from a tier name.
 */

/** Verification tier codes from system.verification_tier.tier_code. */
export type VerificationTier = "unverified" | "community" | "otp" | "government" | "licensed"

/** Platform status from identity.person.mit_status. */
export type PlatformStatus =
  | "pre_verification"
  | "living"
  | "liveness_pending"
  | "suspended"
  | "presumed_ancestral"
  | "verified_ancestral"

/** A glyph in the design system's icon set (`site-icons`) for each tier; null for tier 0. */
export type TierGlyph = "users" | "phone" | "shield-check" | "award"

/** One rung of the ladder, with no framework in it. */
export interface TierData {
  /** The tier code. */
  tier: VerificationTier
  /** 0 (unverified) to 4 (licensed). */
  level: 0 | 1 | 2 | 3 | 4
  /** The tier's built-in name. */
  label: string
  /** The mineral the tier wears, or null for tier 0 (the neutral grey). */
  mineral: "Terracotta" | "Cobalt" | "Gold" | "Tanzanite" | null
  /** What this rung adds to the trust score. */
  trustIncrement: number
  /** The trust score at this rung, before any status modifier. */
  cumulativeTrust: number
  /** The site-icons glyph that marks the tier; null for tier 0. */
  glyph: TierGlyph | null
  /** The CSS custom properties the tier reads, by part. */
  tokens: {
    tier: string
    container: string
    onContainer: string
    text: string
  }
  /** Tailwind classes that read those properties, as complete literal strings. */
  classes: {
    /** The tier's fill (`bg-tier-*-container`), paired with `onContainer`. */
    container: string
    /** The ink on the tier's fill. */
    onContainer: string
    /** The tier's ink on the page surface. */
    text: string
    /** The tier's colour as an SVG fill. */
    fill: string
    /** The tier's colour as a border. */
    border: string
  }
}

/** The ladder, lowest rung first. */
export const TIER_ORDER = ["unverified", "community", "otp", "government", "licensed"] as const

/** Every rung, by tier code. */
export const TIER_DATA: Record<VerificationTier, TierData> = {
  unverified: {
    tier: "unverified",
    level: 0,
    label: "Unverified",
    mineral: null,
    trustIncrement: 0.0,
    cumulativeTrust: 0.0,
    glyph: null,
    tokens: {
      tier: "--tier-unverified",
      container: "--tier-unverified-container",
      onContainer: "--tier-unverified-on-container",
      text: "--tier-unverified-text",
    },
    classes: {
      container: "bg-tier-unverified-container",
      onContainer: "text-tier-unverified-on-container",
      text: "text-tier-unverified-text",
      fill: "fill-tier-unverified",
      border: "border-tier-unverified",
    },
  },
  community: {
    tier: "community",
    level: 1,
    label: "Community Verified",
    mineral: "Terracotta",
    trustIncrement: 0.1,
    cumulativeTrust: 0.1,
    glyph: "users",
    tokens: {
      tier: "--tier-community",
      container: "--tier-community-container",
      onContainer: "--tier-community-on-container",
      text: "--tier-community-text",
    },
    classes: {
      container: "bg-tier-community-container",
      onContainer: "text-tier-community-on-container",
      text: "text-tier-community-text",
      fill: "fill-tier-community",
      border: "border-tier-community",
    },
  },
  otp: {
    tier: "otp",
    level: 2,
    label: "Contact Verified",
    mineral: "Cobalt",
    trustIncrement: 0.1,
    cumulativeTrust: 0.2,
    glyph: "phone",
    tokens: {
      tier: "--tier-otp",
      container: "--tier-otp-container",
      onContainer: "--tier-otp-on-container",
      text: "--tier-otp-text",
    },
    classes: {
      container: "bg-tier-otp-container",
      onContainer: "text-tier-otp-on-container",
      text: "text-tier-otp-text",
      fill: "fill-tier-otp",
      border: "border-tier-otp",
    },
  },
  government: {
    tier: "government",
    level: 3,
    label: "Government Verified",
    mineral: "Gold",
    trustIncrement: 0.1,
    cumulativeTrust: 0.3,
    glyph: "shield-check",
    tokens: {
      tier: "--tier-government",
      container: "--tier-government-container",
      onContainer: "--tier-government-on-container",
      text: "--tier-government-text",
    },
    classes: {
      container: "bg-tier-government-container",
      onContainer: "text-tier-government-on-container",
      text: "text-tier-government-text",
      fill: "fill-tier-government",
      border: "border-tier-government",
    },
  },
  licensed: {
    tier: "licensed",
    level: 4,
    label: "Licensed Professional",
    mineral: "Tanzanite",
    trustIncrement: 0.2,
    cumulativeTrust: 0.5,
    glyph: "award",
    tokens: {
      tier: "--tier-licensed",
      container: "--tier-licensed-container",
      onContainer: "--tier-licensed-on-container",
      text: "--tier-licensed-text",
    },
    classes: {
      container: "bg-tier-licensed-container",
      onContainer: "text-tier-licensed-on-container",
      text: "text-tier-licensed-text",
      fill: "fill-tier-licensed",
      border: "border-tier-licensed",
    },
  },
}

/** The status overlay, from system.platform_status_trust. */
export const STATUS_OVERLAY = {
  pre_verification: { modifier: 0.0, active: true, overlay: null },
  living: { modifier: 0.0, active: true, overlay: null },
  liveness_pending: { modifier: 0.0, active: true, overlay: null },
  suspended: { modifier: -0.05, active: false, overlay: "suspended" as const },
  presumed_ancestral: { modifier: 0.05, active: false, overlay: "ancestral" as const },
  verified_ancestral: { modifier: 0.05, active: false, overlay: "ancestral" as const },
} as const

/** The rung at a level (0–4); a level off the ladder is clamped onto it. */
export function tierAt(level: number): TierData {
  const i = Math.min(TIER_ORDER.length - 1, Math.max(0, Math.trunc(Number.isFinite(level) ? level : 0)))
  return TIER_DATA[TIER_ORDER[i] as VerificationTier]
}

/** The rung above `tier`, or null at the top of the ladder. */
export function nextTier(tier: VerificationTier): TierData | null {
  const i = TIER_ORDER.indexOf(tier)
  const next = TIER_ORDER[i + 1]
  return next ? TIER_DATA[next] : null
}

/**
 * The trust score: the tier's cumulative trust plus the status modifier. A suspended or
 * ancestral account is frozen at its modifier alone.
 */
export function computeTrustScore(tier: VerificationTier, status: PlatformStatus): number {
  const statusConfig = STATUS_OVERLAY[status]
  if (!statusConfig.active) return statusConfig.modifier
  return TIER_DATA[tier].cumulativeTrust + statusConfig.modifier
}
