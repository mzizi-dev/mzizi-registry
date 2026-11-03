/**
 * Attestation provenance (#577): an attestation may say where it came from (`source`,
 * `sourceRef`) and when it was last checked (`checkedAt`). Kweli imports OpenStreetMap
 * verifications as `community` attestations, so a chip reads "Community Vouched" with
 * "via OpenStreetMap · checked 14 Mar 2026" as its detail and accessible description.
 *
 * The chip labels stay canonical; the vocabulary stays the closed set of three. Without
 * provenance every build renders exactly what it rendered before (the snapshots below were
 * taken from the builds before provenance existed).
 */
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { MziziVerifiedBadge } from "@/components/registry/n3-brand/mzizi-verified-badge"
import { TierStatus } from "@/components/registry/n6-pages/app-tier-status"
import {
  ATTESTATION_SOURCES,
  attestationProvenance,
  attestationSourceName,
  formatCheckedAt,
  legacyTier,
  normalizeAttestationRecords,
  normalizeAttestations,
  parseCheckedAt,
  type AttestationInput,
} from "@/lib/mzizi-trust-tier-data"

describe("no provenance, no change", () => {
  it("verified badge: a tuck shop's two badges are unchanged", () => {
    expect(
      renderToStaticMarkup(<MziziVerifiedBadge assurance="otp" attestations={["community", { type: "domain", revokedAt: null }]} />)
    ).toMatchInlineSnapshot(`"<span data-slot="mzizi-verified-badge-group" data-portal="https://mzizi.dev/components/mzizi-verified-badge" role="group" aria-label="Contact Verified, Community Vouched, Domain Verified" class="inline-flex shrink-0 items-center gap-0.5"><span data-slot="mzizi-verified-badge" data-portal="https://mzizi.dev/components/mzizi-verified-badge" data-tier="otp" data-level="2" data-assurance="otp" data-rank="1" data-trust="0.2" role="img" aria-label="Contact Verified" title="Contact Verified" class="inline-flex shrink-0 items-center justify-center rounded-full size-[18px] text-sm bg-assurance-otp-container text-assurance-otp-on-container"><svg class="inline-block h-[1em] w-[1em]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" data-slot="icon" data-icon="phone" aria-hidden="true"><path d="M5 4h3.5l1.5 4.5-2.2 1.4a11 11 0 006.3 6.3l1.4-2.2 4.5 1.5V19a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z"></path></svg></span><span data-slot="mzizi-verified-badge" data-portal="https://mzizi.dev/components/mzizi-verified-badge" data-attestation="community" role="img" aria-label="Community Vouched" title="Community Vouched" class="inline-flex shrink-0 items-center justify-center rounded-full size-[18px] text-sm bg-attestation-community-container text-attestation-community-on-container"><svg class="inline-block h-[1em] w-[1em]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" data-slot="icon" data-icon="users" aria-hidden="true"><path d="M9 11a4 4 0 100-8 4 4 0 000 8zM2 20a7 7 0 0114 0M16 3.5a4 4 0 010 7.5M18 13.5a7 7 0 014 6.5"></path></svg></span><span data-slot="mzizi-verified-badge" data-portal="https://mzizi.dev/components/mzizi-verified-badge" data-attestation="domain" role="img" aria-label="Domain Verified" title="Domain Verified" class="inline-flex shrink-0 items-center justify-center rounded-full size-[18px] text-sm bg-attestation-domain-container text-attestation-domain-on-container"><svg class="inline-block h-[1em] w-[1em]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" data-slot="icon" data-icon="globe" aria-hidden="true"><path d="M12 21a9 9 0 100-18 9 9 0 000 18zM3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18"></path></svg></span></span>"`)
  })

  it("verified badge: a lone attestation badge is unchanged", () => {
    expect(renderToStaticMarkup(<MziziVerifiedBadge assurance="none" attestations={["community"]} />)).toMatchInlineSnapshot(`"<span data-slot="mzizi-verified-badge" data-portal="https://mzizi.dev/components/mzizi-verified-badge" data-attestation="community" role="img" aria-label="Community Vouched" title="Community Vouched" class="inline-flex shrink-0 items-center justify-center rounded-full size-[18px] text-sm bg-attestation-community-container text-attestation-community-on-container"><svg class="inline-block h-[1em] w-[1em]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" data-slot="icon" data-icon="users" aria-hidden="true"><path d="M9 11a4 4 0 100-8 4 4 0 000 8zM2 20a7 7 0 0114 0M16 3.5a4 4 0 010 7.5M18 13.5a7 7 0 014 6.5"></path></svg></span>"`)
  })

  it("tier status: the attestation chips are unchanged", () => {
    const host = document.createElement("div")
    host.innerHTML = renderToStaticMarkup(<TierStatus assurance="otp" attestationTypes={["community", { type: "business" }]} />)
    expect(host.querySelector('[data-slot="tier-attested"]')!.outerHTML).toMatchInlineSnapshot(`"<ul data-slot="tier-attested" aria-label="Attestations" class="mt-2 flex flex-wrap gap-1.5"><li data-attestation="community" class="inline-flex min-h-7 items-center gap-1.5 rounded-full px-2.5 text-caption font-medium bg-attestation-community-container text-attestation-community-on-container"><svg class="inline-block h-[1em] w-[1em]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" data-slot="icon" data-icon="users" aria-hidden="true"><path d="M9 11a4 4 0 100-8 4 4 0 000 8zM2 20a7 7 0 0114 0M16 3.5a4 4 0 010 7.5M18 13.5a7 7 0 014 6.5"></path></svg>Community Vouched</li><li data-attestation="business" class="inline-flex min-h-7 items-center gap-1.5 rounded-full px-2.5 text-caption font-medium bg-attestation-business-container text-attestation-business-on-container"><svg class="inline-block h-[1em] w-[1em]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" data-slot="icon" data-icon="building" aria-hidden="true"><path d="M4 21V5a2 2 0 012-2h8a2 2 0 012 2v16M16 9h2a2 2 0 012 2v10M3 21h18M8 7h4M8 11h4M8 15h4"></path></svg>Registered Business</li></ul>"`)
  })
})


const OSM = { type: "community", source: "osm", sourceRef: "node/4815162342", checkedAt: "2026-03-14" }

const dom = (el: React.ReactElement) => {
  const host = document.createElement("div")
  host.innerHTML = renderToStaticMarkup(el)
  return host
}

describe("provenance data", () => {
  it("keeps the provenance with the attestation, and the vocabulary closed", () => {
    expect(normalizeAttestationRecords([OSM, "business", { type: "osm", source: "osm" }])).toEqual([
      { type: "community", source: "osm", sourceRef: "node/4815162342", checkedAt: "2026-03-14" },
      { type: "business" },
    ])
    expect(normalizeAttestations([OSM, "business"])).toEqual(["community", "business"])
    expect(legacyTier("none", [OSM])).toBe("community")
  })

  it("drops revoked records and keeps the first seen, provenance and all", () => {
    expect(
      normalizeAttestationRecords([{ ...OSM, revokedAt: "2026-04-01" }, { type: "community", source: "survey" }, OSM])
    ).toEqual([{ type: "community", source: "survey" }])
  })

  it("never treats an inherited property as an attestation type", () => {
    expect(normalizeAttestations(["toString", { type: "constructor" }, "__proto__"] as unknown as AttestationInput[])).toEqual([])
  })

  it("reads a check date, and never invents one", () => {
    expect(parseCheckedAt("2026-03-14")).toBe("2026-03-14")
    expect(parseCheckedAt("2026-03-14T23:30:00+02:00")).toBe("2026-03-14")
    expect(parseCheckedAt("2026-03-14T23:30:00-05:00")).toBe("2026-03-15")
    for (const bad of ["", "yesterday", "2026-02-30", "2026-13-01", "14/03/2026", "2026-03-14T25:00:00Z", 20260314, null])
      expect(parseCheckedAt(bad), String(bad)).toBeUndefined()
  })

  it("names known sources and shows an unknown one as its id", () => {
    expect(ATTESTATION_SOURCES.osm).toBe("OpenStreetMap")
    expect(attestationSourceName("osm")).toBe("OpenStreetMap")
    expect(attestationSourceName("mapillary")).toBe("mapillary")
    expect(attestationSourceName("mapillary", { mapillary: "Mapillary" })).toBe("Mapillary")
    expect(attestationSourceName("toString")).toBe("toString")
  })

  it("formats the date from the locale, in UTC", () => {
    expect(formatCheckedAt("2026-03-14")).toBe("14 Mar 2026")
    expect(formatCheckedAt("2026-03-14", "en-US")).toBe("Mar 14, 2026")
    expect(formatCheckedAt("2026-03-14", "not a locale!")).toBe("2026-03-14")
  })

  it("writes the line: source and date, source alone, date alone, or nothing", () => {
    expect(attestationProvenance({ type: "community", source: "osm", checkedAt: "2026-03-14" })?.text).toBe(
      "via OpenStreetMap · checked 14 Mar 2026"
    )
    expect(attestationProvenance({ type: "community", source: "osm" })).toEqual({
      source: "osm",
      sourceName: "OpenStreetMap",
      text: "via OpenStreetMap",
    })
    expect(attestationProvenance({ type: "domain", checkedAt: "2026-03-14" })?.text).toBe("checked 14 Mar 2026")
    expect(attestationProvenance({ type: "community" })).toBeNull()
    expect(attestationProvenance({ type: "community", source: "  " })).toBeNull()
  })
})

describe("provenance (React)", () => {
  it("verified badge: the canonical name, with the line as description and title", () => {
    const badge = dom(<MziziVerifiedBadge assurance="none" attestations={[OSM]} />).querySelector(
      "[data-attestation='community']"
    )!
    expect(badge.getAttribute("aria-label")).toBe("Community Vouched")
    expect(badge.getAttribute("aria-description")).toBe("via OpenStreetMap · checked 14 Mar 2026")
    expect(badge.getAttribute("title")).toBe("Community Vouched\nvia OpenStreetMap · checked 14 Mar 2026")
    expect(badge.getAttribute("data-source")).toBe("osm")
    expect(badge.getAttribute("data-checked-at")).toBe("2026-03-14")
  })

  it("verified badge: no date when none was given, and no title line without the tooltip", () => {
    const badge = dom(
      <MziziVerifiedBadge assurance="otp" attestations={[{ type: "community", source: "osm" }]} showTooltip={false} />
    ).querySelector("[data-attestation='community']")!
    expect(badge.getAttribute("aria-description")).toBe("via OpenStreetMap")
    expect(badge.hasAttribute("data-checked-at")).toBe(false)
    expect(badge.hasAttribute("title")).toBe(false)
  })

  it("verified badge: an unknown source shows its id, escaped", () => {
    const html = renderToStaticMarkup(
      <MziziVerifiedBadge assurance="none" attestations={[{ type: "community", source: '<b>"x"</b>' }]} />
    )
    const host = document.createElement("div")
    host.innerHTML = html
    // Escaped in an attribute: no element is made from it.
    expect(host.querySelector("b")).toBeNull()
    expect(host.querySelector("[data-attestation]")!.getAttribute("aria-description")).toBe('via <b>"x"</b>')
  })

  it("verified badge: the level badge never takes an attestation's provenance", () => {
    const level = dom(<MziziVerifiedBadge assurance="otp" attestations={[OSM]} />).querySelector("[data-assurance]")!
    expect(level.hasAttribute("aria-description")).toBe(false)
    expect(level.getAttribute("title")).toBe("Contact Verified")
  })

  it("tier status: the chip's second line, read with the name, with a machine-readable date", () => {
    const host = dom(<TierStatus assurance="otp" attestationTypes={[OSM]} />)
    const chip = host.querySelector("[data-slot='tier-attested'] > li")!
    expect(chip.textContent).toBe("Community Vouched via OpenStreetMap · checked 14 Mar 2026")
    expect(chip.querySelector("[data-slot='tier-attested-provenance']")!.textContent).toBe(
      "via OpenStreetMap · checked 14 Mar 2026"
    )
    expect(chip.querySelector("time")!.getAttribute("datetime")).toBe("2026-03-14")
  })

  it("tier status: no date, no time element; a custom source name", () => {
    const host = dom(
      <TierStatus
        assurance="otp"
        attestationTypes={[{ type: "community", source: "mapillary" }]}
        sourceNames={{ mapillary: "Mapillary" }}
      />
    )
    expect(host.querySelector("[data-slot='tier-attested-provenance']")!.textContent).toBe("via Mapillary")
    expect(host.querySelector("time")).toBeNull()
  })
})
