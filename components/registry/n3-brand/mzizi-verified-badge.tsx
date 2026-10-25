import { Icon, type IconName } from "@/components/ui/site-icon"
import {
  ASSURANCE_DATA,
  ATTESTATION_DATA,
  STATUS_OVERLAY,
  TIER_DATA,
  legacyTier,
  normalizeAttestations,
  type AssuranceLevel,
  type AttestationInput,
  type PlatformStatus,
  type VerificationTier,
} from "@/lib/mzizi-trust-tier-data"
import { TIER_CONFIG, computeTrustScore } from "@/lib/mzizi-trust-tiers"
import { cn } from "@/lib/ui-utils"

/* ═══════════════════════════════════════════════════════════════
   MUKOKO VERIFIED BADGE — the compact view of trust

   The React build of contract `ui/mzizi-verified-badge`, beside
   `mzizi-verified-badge.astro` (the default build): the same markup and
   classes, a server component with no script and no inline style.

   Three-axis trust model (nyuchi_platform_db):

   AXIS 1 — STATUS (identity.person.mit_status)
     pre_verification | living | liveness_pending |
     suspended | presumed_ancestral | verified_ancestral

   AXIS 2 — VERIFICATION TIER (system.verification_tier)
     Level 0: Unverified     — no badge
     Level 1: Community      — terracotta (--tier-community)   +0.10
     Level 2: OTP            — cobalt (--tier-otp), "Contact Verified" (cumulative 0.20)
     Level 3: Government     — gold (--tier-government)        (cumulative 0.30)
     Level 4: Licensed       — tanzanite (--tier-licensed)     (cumulative 0.50)

   AXIS 3 — TRUST SCORE (computed): the tier's cumulative trust plus
     the status modifier; suspended/ancestral is frozen at the modifier.

   Each tier draws its fill and ink from its own APCA-gated --tier-*
   pair (`bg-tier-*-container`, `text-tier-*-on-container`), defined
   once in the N1 tokens (owner decision 2026-10-24, #543). The ladder
   is the framework-free lib/mzizi-trust-tier-data; TIER_CONFIG (with
   the Lucide icons older components read) is re-exported from
   lib/mzizi-trust-tiers so existing imports keep working.

   THE TRUST MODEL (#577, nyuchi-api assurance.py). Pass `assurance`
   (none, otp, documented, government, licensed) and `attestations`
   (community, business, domain) instead of `tier`: the level is one
   badge in its --assurance-* pair, and each attestation is its own
   badge in its --attestation-* pair beside it, never a rung. With more
   than one badge they sit in a named group. `tier` is the legacy
   projection and renders as it always has.
   ═══════════════════════════════════════════════════════════════ */

const PORTAL = "https://mzizi.dev/components/mzizi-verified-badge"
const BOX = { sm: "size-3.5", md: "size-[18px]", lg: "size-6", xl: "size-8" } as const
/** The glyph is 1em, so the box's font size sizes it: 10, 12, 16 and 20px. */
const GLYPH = { sm: "text-[10px]", md: "text-[12px]", lg: "text-[16px]", xl: "text-[20px]" } as const

interface MziziVerifiedBadgeProps {
  /** Legacy: the verification tier code (bundu.verificationTier). Ignored when `assurance` is set. */
  tier?: VerificationTier
  /** The assurance level (assurance.py). With it, `attestations` show as badges of their own. */
  assurance?: AssuranceLevel
  /** The attestations in force, as type names or stored records; revoked ones are dropped. */
  attestations?: AttestationInput[]
  /** The group's accessible name when more than one badge shows; defaults to the names joined. */
  groupLabel?: string
  /** Platform status (identity.person.mit_status). Affects badge appearance. */
  status?: PlatformStatus
  /** sm (inline with text), md, lg (profile pages) or xl (verification detail views). */
  size?: "sm" | "md" | "lg" | "xl" | null
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
  /** Render the placeholder while verification status is loading */
  loading?: boolean
  className?: string
}

type Mark = {
  key: string
  name: string
  glyph: IconName
  pair: { container: string; onContainer: string }
  data: Record<string, string | number | undefined>
}

function MziziVerifiedBadge({
  tier = "unverified",
  assurance,
  attestations,
  groupLabel,
  status = "living",
  size,
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
        data-portal={PORTAL}
        data-loading=""
        aria-hidden="true"
        className={cn("inline-flex size-4 shrink-0 animate-pulse rounded-full bg-muted", className)}
      />
    )

  const box = size ?? "md"
  const overlay = STATUS_OVERLAY[status].overlay
  const model = assurance !== undefined && assurance in ASSURANCE_DATA
  const chips = model ? normalizeAttestations(attestations) : []
  const level = model ? ASSURANCE_DATA[assurance as AssuranceLevel] : null
  const projected = level ? legacyTier(level.level, chips) : tier
  const data = TIER_DATA[projected]
  const named = (builtIn: string) => {
    const text = label ?? builtIn
    return showScore ? `${text} · Trust ${data.cumulativeTrust}` : text
  }
  const own = level
    ? { label: level.label, glyph: level.glyph, pair: level.classes, rank: level.rank }
    : { label: data.label, glyph: data.glyph, pair: data.classes, rank: undefined }
  const none = level ? ASSURANCE_DATA.none.classes : TIER_DATA.unverified.classes
  const marks: Mark[] = []
  const levelData = {
    "data-tier": projected,
    "data-level": data.level,
    "data-assurance": level?.level,
    "data-rank": own.rank,
    "data-status": overlay ? status : undefined,
    "data-trust": overlay ? undefined : data.cumulativeTrust,
  }
  if (overlay === "suspended") {
    /* A suspended account is one badge, whatever it holds. */
    marks.push({ key: "level", name: named("Account Suspended"), glyph: "ban", pair: none, data: levelData })
  } else {
    if (own.glyph && (level ? level.level !== "none" : tier !== "unverified"))
      marks.push({
        key: "level",
        name: overlay === "ancestral" ? named(`${own.label} — Memorial`) : named(own.label),
        glyph: overlay === "ancestral" ? "flower" : own.glyph,
        pair: own.pair,
        data: levelData,
      })
    for (const t of chips) {
      const a = ATTESTATION_DATA[t]
      marks.push({ key: t, name: a.label, glyph: a.glyph, pair: a.classes, data: { "data-attestation": t } })
    }
  }

  /* Level 0 with nothing attested = no badge */
  if (marks.length === 0) return null

  const badge = (m: Mark, root: boolean) => (
    <span
      key={m.key}
      data-slot="mzizi-verified-badge"
      data-portal={PORTAL}
      {...m.data}
      role="img"
      aria-label={m.key === "level" ? (ariaLabel ?? m.name) : m.name}
      title={showTooltip ? m.name : undefined}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full",
        BOX[box],
        GLYPH[box],
        m.pair.container,
        m.pair.onContainer,
        root && className,
      )}
    >
      <Icon name={m.glyph} />
    </span>
  )

  if (marks.length === 1) return badge(marks[0]!, true)

  return (
    <span
      data-slot="mzizi-verified-badge-group"
      data-portal={PORTAL}
      role="group"
      aria-label={groupLabel ?? marks.map((m) => (m.key === "level" ? (ariaLabel ?? m.name) : m.name)).join(", ")}
      className={cn("inline-flex shrink-0 items-center gap-0.5", className)}
    >
      {marks.map((m) => badge(m, false))}
    </span>
  )
}

export { MziziVerifiedBadge, computeTrustScore, TIER_CONFIG, STATUS_OVERLAY }
export type { MziziVerifiedBadgeProps, VerificationTier, PlatformStatus }
