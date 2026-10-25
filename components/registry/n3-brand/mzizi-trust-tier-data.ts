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
 *
 * THE TRUST MODEL (#577). The canonical model is nyuchi/nyuchi-api `gateway/lib/assurance.py`:
 * two independent things, deliberately not one number.
 *   - ASSURANCE LEVELS (`ASSURANCE_DATA`), ordered 0–4: none, otp ("Contact Verified"),
 *     documented ("Documents Checked", sodalite), government, licensed. `>=` is meaningful.
 *   - ATTESTATIONS (`ATTESTATION_DATA`), unordered, held beside the level: community
 *     ("Community Vouched", terracotta), business ("Registered Business", malachite) and domain
 *     ("Domain Verified", copper).
 * Community is an attestation, never a rung below otp: show it as its own chip beside the
 * level. Each part reads its `--assurance-*` / `--attestation-*` role.
 *
 * The five-rung `TIER_*` ladder below is the LEGACY projection, `bundu.verificationTier`
 * (`legacy_tier()` in assurance.py). It stays, unchanged, until every reader has moved; its
 * `--tier-*` roles alias the new ones. `legacyTierToAssurance` reads a legacy tier into the new
 * model the way assurance.py's fallback does, and `legacyTier` projects back.
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

// ─── The trust model: assurance levels and attestations (#577, assurance.py) ─────────────────

/** An assurance level, ordered: how strongly an identity is proven. */
export type AssuranceLevel = "none" | "otp" | "documented" | "government" | "licensed"

/** An attestation, unordered and held beside the level: who vouches for the subject. */
export type AttestationType = "community" | "business" | "domain"

/** A glyph in `site-icons` for each assurance level; null for `none`. */
export type AssuranceGlyph = "phone" | "file" | "shield-check" | "award"

/** A glyph in `site-icons` for each attestation. */
export type AttestationGlyph = "users" | "building" | "globe"

/** The CSS custom properties a level or an attestation reads, and the classes that read them. */
export interface TrustPartStyle {
  /** The CSS custom properties, by part. */
  tokens: {
    tier: string
    container: string
    onContainer: string
    text: string
  }
  /** Tailwind classes that read those properties, as complete literal strings. */
  classes: {
    /** The fill (`bg-*-container`), paired with `onContainer`. */
    container: string
    /** The ink on that fill. */
    onContainer: string
    /** The ink on the page surface. */
    text: string
    /** The colour as an SVG fill. */
    fill: string
    /** The colour as a border. */
    border: string
  }
}

/** One assurance level, with no framework in it. */
export interface AssuranceData extends TrustPartStyle {
  /** The level's name in assurance.py. */
  level: AssuranceLevel
  /** Its place on the ordered scale, 0 (none) to 4 (licensed). */
  rank: 0 | 1 | 2 | 3 | 4
  /** The level's built-in label. */
  label: string
  /** The mineral it wears, or null for `none` (the neutral grey). */
  mineral: "Cobalt" | "Sodalite" | "Gold" | "Tanzanite" | null
  /** The site-icons glyph that marks it; null for `none`. */
  glyph: AssuranceGlyph | null
}

/** One attestation, with no framework in it. */
export interface AttestationData extends TrustPartStyle {
  /** The attestation's name in assurance.py. */
  type: AttestationType
  /** Its built-in label. */
  label: string
  /** The mineral it wears. */
  mineral: "Terracotta" | "Malachite" | "Copper"
  /** The site-icons glyph that marks it. */
  glyph: AttestationGlyph
}

/** The levels, lowest first. */
export const ASSURANCE_ORDER = ["none", "otp", "documented", "government", "licensed"] as const

/** The attestations, in the order a UI lists them. They carry no rank. */
export const ATTESTATION_ORDER = ["community", "business", "domain"] as const

/** Every assurance level, by name. */
export const ASSURANCE_DATA: Record<AssuranceLevel, AssuranceData> = {
  none: {
    level: "none",
    rank: 0,
    label: "Unverified",
    mineral: null,
    glyph: null,
    tokens: {
      tier: "--assurance-none",
      container: "--assurance-none-container",
      onContainer: "--assurance-none-on-container",
      text: "--assurance-none-text",
    },
    classes: {
      container: "bg-assurance-none-container",
      onContainer: "text-assurance-none-on-container",
      text: "text-assurance-none-text",
      fill: "fill-assurance-none",
      border: "border-assurance-none",
    },
  },
  otp: {
    level: "otp",
    rank: 1,
    label: "Contact Verified",
    mineral: "Cobalt",
    glyph: "phone",
    tokens: {
      tier: "--assurance-otp",
      container: "--assurance-otp-container",
      onContainer: "--assurance-otp-on-container",
      text: "--assurance-otp-text",
    },
    classes: {
      container: "bg-assurance-otp-container",
      onContainer: "text-assurance-otp-on-container",
      text: "text-assurance-otp-text",
      fill: "fill-assurance-otp",
      border: "border-assurance-otp",
    },
  },
  documented: {
    level: "documented",
    rank: 2,
    label: "Documents Checked",
    mineral: "Sodalite",
    glyph: "file",
    tokens: {
      tier: "--assurance-documented",
      container: "--assurance-documented-container",
      onContainer: "--assurance-documented-on-container",
      text: "--assurance-documented-text",
    },
    classes: {
      container: "bg-assurance-documented-container",
      onContainer: "text-assurance-documented-on-container",
      text: "text-assurance-documented-text",
      fill: "fill-assurance-documented",
      border: "border-assurance-documented",
    },
  },
  government: {
    level: "government",
    rank: 3,
    label: "Government Verified",
    mineral: "Gold",
    glyph: "shield-check",
    tokens: {
      tier: "--assurance-government",
      container: "--assurance-government-container",
      onContainer: "--assurance-government-on-container",
      text: "--assurance-government-text",
    },
    classes: {
      container: "bg-assurance-government-container",
      onContainer: "text-assurance-government-on-container",
      text: "text-assurance-government-text",
      fill: "fill-assurance-government",
      border: "border-assurance-government",
    },
  },
  licensed: {
    level: "licensed",
    rank: 4,
    label: "Licensed Professional",
    mineral: "Tanzanite",
    glyph: "award",
    tokens: {
      tier: "--assurance-licensed",
      container: "--assurance-licensed-container",
      onContainer: "--assurance-licensed-on-container",
      text: "--assurance-licensed-text",
    },
    classes: {
      container: "bg-assurance-licensed-container",
      onContainer: "text-assurance-licensed-on-container",
      text: "text-assurance-licensed-text",
      fill: "fill-assurance-licensed",
      border: "border-assurance-licensed",
    },
  },
}

/** Every attestation, by type. */
export const ATTESTATION_DATA: Record<AttestationType, AttestationData> = {
  community: {
    type: "community",
    label: "Community Vouched",
    mineral: "Terracotta",
    glyph: "users",
    tokens: {
      tier: "--attestation-community",
      container: "--attestation-community-container",
      onContainer: "--attestation-community-on-container",
      text: "--attestation-community-text",
    },
    classes: {
      container: "bg-attestation-community-container",
      onContainer: "text-attestation-community-on-container",
      text: "text-attestation-community-text",
      fill: "fill-attestation-community",
      border: "border-attestation-community",
    },
  },
  business: {
    type: "business",
    label: "Registered Business",
    mineral: "Malachite",
    glyph: "building",
    tokens: {
      tier: "--attestation-business",
      container: "--attestation-business-container",
      onContainer: "--attestation-business-on-container",
      text: "--attestation-business-text",
    },
    classes: {
      container: "bg-attestation-business-container",
      onContainer: "text-attestation-business-on-container",
      text: "text-attestation-business-text",
      fill: "fill-attestation-business",
      border: "border-attestation-business",
    },
  },
  domain: {
    type: "domain",
    label: "Domain Verified",
    mineral: "Copper",
    glyph: "globe",
    tokens: {
      tier: "--attestation-domain",
      container: "--attestation-domain-container",
      onContainer: "--attestation-domain-on-container",
      text: "--attestation-domain-text",
    },
    classes: {
      container: "bg-attestation-domain-container",
      onContainer: "text-attestation-domain-on-container",
      text: "text-attestation-domain-text",
      fill: "fill-attestation-domain",
      border: "border-attestation-domain",
    },
  },
}

/** The level at a rank (0–4); anything off the scale, NaN included, fails safe to `none`. */
export function assuranceAt(rank: number): AssuranceData {
  if (!Number.isFinite(rank)) return ASSURANCE_DATA.none
  const i = Math.min(ASSURANCE_ORDER.length - 1, Math.max(0, Math.trunc(rank)))
  return ASSURANCE_DATA[ASSURANCE_ORDER[i] as AssuranceLevel]
}

/** The level above `level`, or null at the top. */
export function nextAssurance(level: AssuranceLevel): AssuranceData | null {
  const next = ASSURANCE_ORDER[ASSURANCE_ORDER.indexOf(level) + 1]
  return next ? ASSURANCE_DATA[next] : null
}

/** An attestation as stored (`{ type, revokedAt }`) or already normalised (its type name). */
export type AttestationInput = AttestationType | { type?: unknown; revokedAt?: unknown } | null | undefined

/**
 * The attestations in force, as `normalize_attestations` in assurance.py reads them: revoked
 * ones (a non-null `revokedAt`) and unknown types are dropped, duplicates collapse, and the
 * first-seen order is kept. Idempotent. This is for display only; access is decided on the
 * server, never here.
 */
export function normalizeAttestations(raw: readonly AttestationInput[] | null | undefined): AttestationType[] {
  if (!Array.isArray(raw)) return []
  const live: AttestationType[] = []
  for (const item of raw) {
    let kind: unknown
    let revoked = false
    if (typeof item === "string") kind = item
    else if (item && typeof item === "object") {
      kind = item.type
      revoked = item.revokedAt !== undefined && item.revokedAt !== null
    } else continue
    if (revoked || typeof kind !== "string" || !(kind in ATTESTATION_DATA)) continue
    if (!live.includes(kind as AttestationType)) live.push(kind as AttestationType)
  }
  return live
}

/** A subject in the trust model: a level, and the attestations held beside it. */
export interface Assurance {
  level: AssuranceLevel
  attestations: AttestationType[]
}

/**
 * Read a legacy `bundu.verificationTier` (a tier code or its 0–4 number) into the trust model,
 * as assurance.py's `assurance_from_document` fallback does: the old `community` tier grants a
 * community attestation and NO level, because being vouched for never proved an identity.
 * Anything unreadable is `none`.
 */
export function legacyTierToAssurance(tier: VerificationTier | number | null | undefined): Assurance {
  const code: VerificationTier =
    typeof tier === "number" ? tierAt(tier).tier : tier && tier in TIER_DATA ? tier : "unverified"
  switch (code) {
    case "community":
      return { level: "none", attestations: ["community"] }
    case "otp":
      return { level: "otp", attestations: [] }
    case "government":
      return { level: "government", attestations: [] }
    case "licensed":
      return { level: "licensed", attestations: [] }
    default:
      return { level: "none", attestations: [] }
  }
}

/**
 * Project the trust model back onto the legacy ladder, as `legacy_tier()` does: the highest old
 * tier any part justifies. `documented` projects to the old otp rung; `business` and `domain`
 * project to nothing, since the old ladder had no rung for them.
 */
export function legacyTier(level: AssuranceLevel, attestations: readonly AttestationInput[] = []): VerificationTier {
  const rank = ASSURANCE_DATA[level]?.rank ?? 0
  if (rank >= 4) return "licensed"
  if (rank >= 3) return "government"
  if (rank >= 1) return "otp"
  return normalizeAttestations(attestations).includes("community") ? "community" : "unverified"
}
