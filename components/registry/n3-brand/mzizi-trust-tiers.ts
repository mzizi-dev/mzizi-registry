/**
 * The Mukoko trust model's data, server-safe (#543): the verification tier ladder
 * (`TIER_CONFIG`), the platform-status overlay (`STATUS_OVERLAY`), their types and
 * `computeTrustScore`. No "use client", no hooks and no browser globals, so a Server Component,
 * an Astro page or an API route can import it. `mzizi-verified-badge` (a client component)
 * reads it from here and re-exports it, so existing imports from the badge keep working.
 *
 * Installs to lib/mzizi-trust-tiers.ts.
 *
 * TIER COLOURS (owner decision 2026-10-24, #543). Every tier reads its `--tier-*` role, defined
 * once in the N1 tokens (`lib/tokens/roles.source.ts`): unverified → the neutral grey
 * (`--status-neutral`), community → terracotta, otp ("Contact Verified") → cobalt,
 * government → gold, licensed → tanzanite. The roles are themed, so `fg`/`bg` already follow
 * light and dark; `fgLight`/`bgLight` are kept for existing callers and carry the same values.
 * The fallbacks name the family, never a hex, so a consumer without the tier roles still gets
 * the canonical mineral. A background is the tier at 15% (`color-mix`), not a fixed rgba.
 */
import { Users, Phone, ShieldCheck, Award } from "@/lib/icons"

/** Verification tier codes from system.verification_tier.tier_code */
type VerificationTier = "unverified" | "community" | "otp" | "government" | "licensed"

/** Platform status from identity.person.mit_status */
type PlatformStatus =
  | "pre_verification"
  | "living"
  | "liveness_pending"
  | "suspended"
  | "presumed_ancestral"
  | "verified_ancestral"

/** Full tier configuration mapping to system.verification_tier */
const TIER_CONFIG = {
  unverified: {
    level: 0,
    mineral: null,
    label: "Unverified",
    trustIncrement: 0.0,
    cumulativeTrust: 0.0,
    fg: "var(--tier-unverified,var(--status-neutral))",
    bg: "color-mix(in oklab,var(--tier-unverified,var(--status-neutral)) 15%,transparent)",
    fgLight: "var(--tier-unverified,var(--status-neutral))",
    bgLight: "color-mix(in oklab,var(--tier-unverified,var(--status-neutral)) 15%,transparent)",
    icon: null,
  },
  community: {
    level: 1,
    mineral: "Terracotta",
    label: "Community Verified",
    trustIncrement: 0.1,
    cumulativeTrust: 0.1,
    fg: "var(--tier-community,var(--color-terracotta))",
    bg: "color-mix(in oklab,var(--tier-community,var(--color-terracotta)) 15%,transparent)",
    fgLight: "var(--tier-community,var(--color-terracotta))",
    bgLight: "color-mix(in oklab,var(--tier-community,var(--color-terracotta)) 15%,transparent)",
    icon: Users,
  },
  otp: {
    level: 2,
    mineral: "Cobalt",
    label: "Contact Verified",
    trustIncrement: 0.1,
    cumulativeTrust: 0.2,
    fg: "var(--tier-otp,var(--color-cobalt))",
    bg: "color-mix(in oklab,var(--tier-otp,var(--color-cobalt)) 15%,transparent)",
    fgLight: "var(--tier-otp,var(--color-cobalt))",
    bgLight: "color-mix(in oklab,var(--tier-otp,var(--color-cobalt)) 15%,transparent)",
    icon: Phone,
  },
  government: {
    level: 3,
    mineral: "Gold",
    label: "Government Verified",
    trustIncrement: 0.1,
    cumulativeTrust: 0.3,
    fg: "var(--tier-government,var(--color-gold))",
    bg: "color-mix(in oklab,var(--tier-government,var(--color-gold)) 15%,transparent)",
    fgLight: "var(--tier-government,var(--color-gold))",
    bgLight: "color-mix(in oklab,var(--tier-government,var(--color-gold)) 15%,transparent)",
    icon: ShieldCheck,
  },
  licensed: {
    level: 4,
    mineral: "Tanzanite",
    label: "Licensed Professional",
    trustIncrement: 0.2,
    cumulativeTrust: 0.5,
    fg: "var(--tier-licensed,var(--color-tanzanite))",
    bg: "color-mix(in oklab,var(--tier-licensed,var(--color-tanzanite)) 15%,transparent)",
    fgLight: "var(--tier-licensed,var(--color-tanzanite))",
    bgLight: "color-mix(in oklab,var(--tier-licensed,var(--color-tanzanite)) 15%,transparent)",
    icon: Award,
  },
} as const

/** Status overlay configuration from system.platform_status_trust */
const STATUS_OVERLAY = {
  pre_verification: { modifier: 0.0, active: true, overlay: null },
  living: { modifier: 0.0, active: true, overlay: null },
  liveness_pending: { modifier: 0.0, active: true, overlay: null },
  suspended: { modifier: -0.05, active: false, overlay: "suspended" as const },
  presumed_ancestral: { modifier: 0.05, active: false, overlay: "ancestral" as const },
  verified_ancestral: { modifier: 0.05, active: false, overlay: "ancestral" as const },
} as const

/* ── Utility: compute trust score (server or client) ─────────── */
function computeTrustScore(tier: VerificationTier, status: PlatformStatus): number {
  const statusConfig = STATUS_OVERLAY[status]

  // Suspended/ancestral = fixed at modifier only
  if (!statusConfig.active) return statusConfig.modifier

  // Active = cumulative tier score + status modifier
  return TIER_CONFIG[tier].cumulativeTrust + statusConfig.modifier
}

export { TIER_CONFIG, STATUS_OVERLAY, computeTrustScore }
export type { VerificationTier, PlatformStatus }
