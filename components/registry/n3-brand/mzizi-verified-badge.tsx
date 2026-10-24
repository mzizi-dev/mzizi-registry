import { Icon } from "@/components/ui/site-icon"
import {
  STATUS_OVERLAY,
  TIER_DATA,
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
   ═══════════════════════════════════════════════════════════════ */

const PORTAL = "https://mzizi.dev/components/mzizi-verified-badge"
const BOX = { sm: "size-3.5", md: "size-[18px]", lg: "size-6", xl: "size-8" } as const
/** The glyph is 1em, so the box's font size sizes it: 10, 12, 16 and 20px. */
const GLYPH = { sm: "text-[10px]", md: "text-[12px]", lg: "text-[16px]", xl: "text-[20px]" } as const

interface MziziVerifiedBadgeProps {
  /** Verification tier code (system.verification_tier.tier_code) */
  tier: VerificationTier
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

function MziziVerifiedBadge({
  tier,
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
  const data = TIER_DATA[tier]
  const overlay = STATUS_OVERLAY[status].overlay
  const named = (builtIn: string) => {
    const text = label ?? builtIn
    return showScore ? `${text} · Trust ${data.cumulativeTrust}` : text
  }
  const view =
    overlay === "suspended"
      ? { name: named("Account Suspended"), glyph: "ban" as const, pair: TIER_DATA.unverified.classes }
      : overlay === "ancestral"
        ? { name: named(`${data.label} — Memorial`), glyph: "flower" as const, pair: data.classes }
        : { name: named(data.label), glyph: data.glyph, pair: data.classes }

  /* Level 0 = no badge */
  if (tier === "unverified" || !view.glyph) return null

  return (
    <span
      data-slot="mzizi-verified-badge"
      data-portal={PORTAL}
      data-tier={tier}
      data-level={data.level}
      data-status={overlay ? status : undefined}
      data-trust={overlay ? undefined : data.cumulativeTrust}
      role="img"
      aria-label={ariaLabel ?? view.name}
      title={showTooltip ? view.name : undefined}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full",
        BOX[box],
        GLYPH[box],
        view.pair.container,
        view.pair.onContainer,
        className,
      )}
    >
      <Icon name={view.glyph} />
    </span>
  )
}

export { MziziVerifiedBadge, computeTrustScore, TIER_CONFIG, STATUS_OVERLAY }
export type { MziziVerifiedBadgeProps, VerificationTier, PlatformStatus }
