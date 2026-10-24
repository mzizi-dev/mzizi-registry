/**
 * The Mukoko trust model's data, server-safe (#543): the verification tier ladder
 * (`TIER_CONFIG`), the platform-status overlay (`STATUS_OVERLAY`), their types and
 * `computeTrustScore`. No "use client", no hooks and no browser globals, so a Server Component,
 * an Astro page or an API route can import it. `mzizi-verified-badge` re-exports it, so
 * existing imports from the badge keep working.
 *
 * Installs to lib/mzizi-trust-tiers.ts.
 *
 * THE DATA LIVES IN `mzizi-trust-tier-data`, which has no framework and no icon library in it
 * (labels, levels, minerals, trust increments, the `--tier-*` token names and the classes that
 * read them). This module adds only what React needs on top of it: the Lucide icon for each
 * tier, and the `fg`/`bg` CSS values the older React components put in a `style`. Read the
 * data module where you can; this one stays so every existing import keeps working.
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
import {
  STATUS_OVERLAY,
  TIER_DATA,
  computeTrustScore,
  type PlatformStatus,
  type TierData,
  type VerificationTier,
} from "@/lib/mzizi-trust-tier-data"

const ICONS = { unverified: null, community: Users, otp: Phone, government: ShieldCheck, licensed: Award } as const

/** `var(--tier-<x>,<the family it falls back to>)`, and the tier at 15% for a background. */
function colours(d: TierData) {
  const fallback = d.mineral ? `var(--color-${d.mineral.toLowerCase()})` : "var(--status-neutral)"
  const fg = `var(${d.tokens.tier},${fallback})`
  const bg = `color-mix(in oklab,${fg} 15%,transparent)`
  return { fg, bg, fgLight: fg, bgLight: bg }
}

function entry<T extends VerificationTier>(tier: T) {
  const d = TIER_DATA[tier]
  return {
    level: d.level,
    mineral: d.mineral,
    label: d.label,
    trustIncrement: d.trustIncrement,
    cumulativeTrust: d.cumulativeTrust,
    ...colours(d),
    icon: ICONS[tier],
  }
}

/** Full tier configuration mapping to system.verification_tier, with each tier's Lucide icon. */
const TIER_CONFIG = {
  unverified: entry("unverified"),
  community: entry("community"),
  otp: entry("otp"),
  government: entry("government"),
  licensed: entry("licensed"),
}

export { TIER_CONFIG, STATUS_OVERLAY, computeTrustScore }
export type { VerificationTier, PlatformStatus }
