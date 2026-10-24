/**
 * The Mukoko trust model's data, server-safe (#543): the verification tier ladder
 * (`TIER_CONFIG`), the platform-status overlay (`STATUS_OVERLAY`), their types and
 * `computeTrustScore`. No "use client", no hooks and no browser globals, so a Server Component,
 * an Astro page or an API route can import it. `mzizi-verified-badge` (a client component)
 * reads it from here and re-exports it, so existing imports from the badge keep working.
 *
 * Installs to lib/mzizi-trust-tiers.ts. The tier colours are the badge's own and are not
 * changed by moving them here.
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
    fg: "transparent",
    bg: "transparent",
    fgLight: "transparent",
    bgLight: "transparent",
    icon: null,
  },
  community: {
    level: 1,
    mineral: "Terracotta",
    label: "Community Verified",
    trustIncrement: 0.1,
    cumulativeTrust: 0.1,
    fg: "var(--color-terracotta,#D4A574)",
    bg: "rgba(212,165,116,0.15)",
    fgLight: "var(--color-terracotta-light,#8B4513)",
    bgLight: "rgba(139,69,19,0.12)",
    icon: Users,
  },
  otp: {
    level: 2,
    mineral: "Cobalt",
    label: "Contact Verified",
    trustIncrement: 0.1,
    cumulativeTrust: 0.2,
    fg: "var(--tier-otp,var(--color-cobalt,#00B0FF))",
    bg: "rgba(0,176,255,0.15)",
    fgLight: "var(--color-cobalt-light,#0047AB)",
    bgLight: "rgba(0,71,171,0.12)",
    icon: Phone,
  },
  government: {
    level: 3,
    mineral: "Gold",
    label: "Government Verified",
    trustIncrement: 0.1,
    cumulativeTrust: 0.3,
    fg: "var(--tier-government,var(--color-gold,#FFD740))",
    bg: "rgba(255,215,64,0.15)",
    fgLight: "var(--color-gold-light,#5D4037)",
    bgLight: "rgba(93,64,55,0.12)",
    icon: ShieldCheck,
  },
  licensed: {
    level: 4,
    mineral: "Tanzanite",
    label: "Licensed Professional",
    trustIncrement: 0.2,
    cumulativeTrust: 0.5,
    fg: "var(--tier-licensed,var(--color-tanzanite,#B388FF))",
    bg: "rgba(179,136,255,0.15)",
    fgLight: "var(--color-tanzanite-light,#4B0082)",
    bgLight: "rgba(75,0,130,0.12)",
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
