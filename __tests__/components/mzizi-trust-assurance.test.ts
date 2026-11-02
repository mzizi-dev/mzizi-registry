// The trust model (#577): assurance levels and attestations, as nyuchi/nyuchi-api
// `gateway/lib/assurance.py` defines them, in the framework-free tier data and the React
// config. The legacy five-rung ladder (`TIER_DATA`, `TIER_CONFIG`) stays, unchanged.

import { describe, expect, it } from "vitest"
import { ROLES } from "@/lib/tokens/roles.source"
import {
  ASSURANCE_DATA,
  ASSURANCE_ORDER,
  ATTESTATION_DATA,
  ATTESTATION_ORDER,
  TIER_DATA,
  TIER_ORDER,
  assuranceAt,
  legacyTier,
  legacyTierToAssurance,
  nextAssurance,
  normalizeAttestations,
} from "@/lib/mzizi-trust-tier-data"
import { ASSURANCE_CONFIG, ATTESTATION_CONFIG, TIER_CONFIG } from "@/lib/mzizi-trust-tiers"
import { ICON_PATHS } from "@/lib/site-icons"

const ROLE_NAMES = new Set(ROLES.map((r) => r.name))

describe("assurance levels and attestations (assurance.py)", () => {
  it("orders the levels none < otp < documented < government < licensed", () => {
    expect(ASSURANCE_ORDER).toEqual(["none", "otp", "documented", "government", "licensed"])
    ASSURANCE_ORDER.forEach((l, i) => expect(ASSURANCE_DATA[l].rank).toBe(i))
    expect(ATTESTATION_ORDER).toEqual(["community", "business", "domain"])
  })

  it("names each part as the design system words it", () => {
    expect(Object.values(ASSURANCE_DATA).map((d) => d.label)).toEqual([
      "Unverified",
      "Contact Verified",
      "Documents Checked",
      "Government Verified",
      "Licensed Professional",
    ])
    expect(Object.values(ATTESTATION_DATA).map((d) => d.label)).toEqual([
      "Community Vouched",
      "Registered Business",
      "Domain Verified",
    ])
  })

  it("gives each part its mineral: the #543 ladder, plus sodalite, malachite and copper", () => {
    expect(Object.values(ASSURANCE_DATA).map((d) => d.mineral)).toEqual([null, "Cobalt", "Sodalite", "Gold", "Tanzanite"])
    expect(Object.values(ATTESTATION_DATA).map((d) => d.mineral)).toEqual(["Terracotta", "Malachite", "Copper"])
  })

  it("reads only roles the N1 tokens define, through complete literal classes", () => {
    for (const d of [...Object.values(ASSURANCE_DATA), ...Object.values(ATTESTATION_DATA)]) {
      for (const token of Object.values(d.tokens)) expect(ROLE_NAMES.has(token.slice(2)), token).toBe(true)
      const base = d.tokens.tier.slice(2)
      expect(d.classes).toEqual({
        container: `bg-${base}-container`,
        onContainer: `text-${base}-on-container`,
        text: `text-${base}-text`,
        fill: `fill-${base}`,
        border: `border-${base}`,
      })
    }
  })

  it("marks every part with a site-icons glyph (none takes no glyph)", () => {
    for (const d of Object.values(ASSURANCE_DATA)) if (d.glyph) expect(ICON_PATHS[d.glyph], d.level).toBeDefined()
    expect(ASSURANCE_DATA.none.glyph).toBeNull()
    for (const d of Object.values(ATTESTATION_DATA)) expect(ICON_PATHS[d.glyph], d.type).toBeDefined()
  })

  it("clamps a rank onto the scale and fails safe to none", () => {
    expect(assuranceAt(2).level).toBe("documented")
    expect(assuranceAt(9).level).toBe("licensed")
    expect(assuranceAt(-1).level).toBe("none")
    expect(assuranceAt(Number.NaN).level).toBe("none")
    expect(nextAssurance("otp")?.level).toBe("documented")
    expect(nextAssurance("licensed")).toBeNull()
  })

  it("normalises attestations like normalize_attestations: revoked and unknown dropped, first-seen order", () => {
    expect(normalizeAttestations(["domain", "business", "domain"])).toEqual(["domain", "business"])
    expect(
      normalizeAttestations([
        { type: "community", revokedAt: "2026-09-01T00:00:00Z" },
        { type: "business", revokedAt: null },
        { type: "government" },
        "nonsense" as never,
        null,
      ])
    ).toEqual(["business"])
    expect(normalizeAttestations(undefined)).toEqual([])
    // Idempotent: normalising the output again changes nothing.
    expect(normalizeAttestations(normalizeAttestations(["business", "community"]))).toEqual(["business", "community"])
  })
})

describe("the legacy projection (bundu.verificationTier)", () => {
  it("reads community as an attestation with no level, never a rung (assurance_from_document)", () => {
    expect(legacyTierToAssurance("community")).toEqual({ level: "none", attestations: ["community"] })
    expect(legacyTierToAssurance("otp")).toEqual({ level: "otp", attestations: [] })
    expect(legacyTierToAssurance("government")).toEqual({ level: "government", attestations: [] })
    expect(legacyTierToAssurance("licensed")).toEqual({ level: "licensed", attestations: [] })
    expect(legacyTierToAssurance("unverified")).toEqual({ level: "none", attestations: [] })
    expect(legacyTierToAssurance(1)).toEqual({ level: "none", attestations: ["community"] })
    expect(legacyTierToAssurance(undefined)).toEqual({ level: "none", attestations: [] })
  })

  it("projects back like legacy_tier(): documented is the otp rung, business and domain are none", () => {
    expect(legacyTier("documented")).toBe("otp")
    expect(legacyTier("none", ["business", "domain"])).toBe("unverified")
    expect(legacyTier("none", ["community"])).toBe("community")
    // The highest tier any part justifies: otp outranks the old community rung.
    expect(legacyTier("otp", ["community"])).toBe("otp")
    expect(legacyTier("licensed", ["community"])).toBe("licensed")
  })

  it("round-trips every legacy tier", () => {
    for (const t of TIER_ORDER) {
      const { level, attestations } = legacyTierToAssurance(t)
      expect(legacyTier(level, attestations), t).toBe(t)
    }
  })

  it("keeps TIER_DATA and TIER_CONFIG as they were", () => {
    expect(TIER_ORDER).toEqual(["unverified", "community", "otp", "government", "licensed"])
    expect(TIER_DATA.community.label).toBe("Community Verified")
    expect(TIER_DATA.otp.level).toBe(2)
    expect(TIER_CONFIG.government.fg).toBe("var(--tier-government,var(--color-gold))")
    expect(TIER_CONFIG.unverified.icon).toBeNull()
  })
})

describe("ASSURANCE_CONFIG and ATTESTATION_CONFIG", () => {
  it("carry each part's colours and a Lucide icon, in TIER_CONFIG's shape", () => {
    expect(ASSURANCE_CONFIG.documented.fg).toBe("var(--assurance-documented,var(--color-sodalite))")
    expect(ASSURANCE_CONFIG.documented.bg).toBe("color-mix(in oklab,var(--assurance-documented,var(--color-sodalite)) 15%,transparent)")
    expect(ASSURANCE_CONFIG.none.fg).toBe("var(--assurance-none,var(--status-neutral))")
    expect(ASSURANCE_CONFIG.none.icon).toBeNull()
    expect(ATTESTATION_CONFIG.business.fg).toBe("var(--attestation-business,var(--color-malachite))")
    expect(ATTESTATION_CONFIG.domain.fg).toBe("var(--attestation-domain,var(--color-copper))")
    for (const c of [...Object.values(ATTESTATION_CONFIG), ASSURANCE_CONFIG.otp, ASSURANCE_CONFIG.documented]) expect(c.icon).toBeTruthy()
  })
})
