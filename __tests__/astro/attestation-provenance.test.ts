/// <reference types="vite/client" />
/**
 * Attestation provenance (#577) in the Astro builds of `ui/mzizi-verified-badge` and
 * `app/tier-status`: "via OpenStreetMap · checked 14 Mar 2026" as the chip's detail and
 * accessible description, and no change at all when an attestation carries no provenance
 * (the snapshots were taken from the builds before provenance existed).
 */
import { experimental_AstroContainer as AstroContainer } from "astro/container"
import { selectAll, selectOne } from "css-select"
import type { Element } from "domhandler"
import { getOuterHTML } from "domutils"
import { beforeAll, describe, expect, it } from "vitest"

import { doc, text } from "../../contracts/runner"

const mods = import.meta.glob<{ default: unknown }>(
  ["../../components/registry/n3-brand/mzizi-verified-badge.astro", "../../components/registry/n6-pages/app-tier-status.astro"],
  { eager: true }
)
type Component = Parameters<AstroContainer["renderToString"]>[0]
const of = (name: string) => Object.entries(mods).find(([p]) => p.endsWith(name))![1].default as Component
const Badge = of("mzizi-verified-badge.astro")
const TierStatus = of("app-tier-status.astro")

let container: AstroContainer
beforeAll(async () => {
  container = await AstroContainer.create()
})

const render = async (c: Component, props: Record<string, unknown>) => doc(await container.renderToString(c, { props }))
const one = (root: ReturnType<typeof doc>, sel: string) => selectOne(sel, root) as unknown as Element
const all = (root: ReturnType<typeof doc>, sel: string) => selectAll(sel, root) as unknown as Element[]
/** The markup, without the dev-only `data-astro-source-*` attributes (absolute paths, line numbers). */
const html = (el: Element) => getOuterHTML(el).replace(/ data-astro-source-(file|loc)="[^"]*"/g, "")

describe("no provenance, no change (Astro)", () => {
  it("verified badge: a tuck shop's two badges are unchanged", async () => {
    const host = await render(Badge, { assurance: "otp", attestations: ["community", { type: "domain", revokedAt: null }] })
    expect(html(one(host, "[data-slot='mzizi-verified-badge-group']"))).toMatchInlineSnapshot(`"<span data-slot="mzizi-verified-badge-group" data-portal="https://mzizi.dev/components/mzizi-verified-badge" role="group" aria-label="Contact Verified, Community Vouched, Domain Verified" class="inline-flex shrink-0 items-center gap-0.5"><span data-slot="mzizi-verified-badge" data-portal="https://mzizi.dev/components/mzizi-verified-badge" data-tier="otp" data-level="2" data-assurance="otp" data-rank="1" data-trust="0.2" role="img" aria-label="Contact Verified" title="Contact Verified" class="inline-flex shrink-0 items-center justify-center rounded-full size-[18px] text-sm bg-assurance-otp-container text-assurance-otp-on-container"><svg class="inline-block h-[1em] w-[1em]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" data-slot="icon" data-icon="phone" aria-hidden="true"><path d="M5 4h3.5l1.5 4.5-2.2 1.4a11 11 0 006.3 6.3l1.4-2.2 4.5 1.5V19a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z"/></svg></span><span data-slot="mzizi-verified-badge" data-portal="https://mzizi.dev/components/mzizi-verified-badge" data-attestation="community" role="img" aria-label="Community Vouched" title="Community Vouched" class="inline-flex shrink-0 items-center justify-center rounded-full size-[18px] text-sm bg-attestation-community-container text-attestation-community-on-container"><svg class="inline-block h-[1em] w-[1em]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" data-slot="icon" data-icon="users" aria-hidden="true"><path d="M9 11a4 4 0 100-8 4 4 0 000 8zM2 20a7 7 0 0114 0M16 3.5a4 4 0 010 7.5M18 13.5a7 7 0 014 6.5"/></svg></span><span data-slot="mzizi-verified-badge" data-portal="https://mzizi.dev/components/mzizi-verified-badge" data-attestation="domain" role="img" aria-label="Domain Verified" title="Domain Verified" class="inline-flex shrink-0 items-center justify-center rounded-full size-[18px] text-sm bg-attestation-domain-container text-attestation-domain-on-container"><svg class="inline-block h-[1em] w-[1em]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" data-slot="icon" data-icon="globe" aria-hidden="true"><path d="M12 21a9 9 0 100-18 9 9 0 000 18zM3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18"/></svg></span></span>"`)
  })

  it("tier status: the attestation chips are unchanged", async () => {
    const host = await render(TierStatus, { assurance: "otp", attestationTypes: ["community", { type: "business" }] })
    expect(html(one(host, "[data-slot='tier-attested']"))).toMatchInlineSnapshot(`"<ul data-slot="tier-attested" aria-label="Attestations" class="mt-2 flex flex-wrap gap-1.5"><li data-attestation="community" class="inline-flex min-h-7 items-center gap-1.5 rounded-full px-2.5 text-caption font-medium bg-attestation-community-container text-attestation-community-on-container"><svg class="inline-block h-[1em] w-[1em]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" data-slot="icon" data-icon="users" aria-hidden="true"><path d="M9 11a4 4 0 100-8 4 4 0 000 8zM2 20a7 7 0 0114 0M16 3.5a4 4 0 010 7.5M18 13.5a7 7 0 014 6.5"/></svg>Community Vouched</li><li data-attestation="business" class="inline-flex min-h-7 items-center gap-1.5 rounded-full px-2.5 text-caption font-medium bg-attestation-business-container text-attestation-business-on-container"><svg class="inline-block h-[1em] w-[1em]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" data-slot="icon" data-icon="building" aria-hidden="true"><path d="M4 21V5a2 2 0 012-2h8a2 2 0 012 2v16M16 9h2a2 2 0 012 2v10M3 21h18M8 7h4M8 11h4M8 15h4"/></svg>Registered Business</li></ul>"`)
  })
})

const OSM = { type: "community", source: "osm", sourceRef: "node/4815162342", checkedAt: "2026-03-14" }

describe("provenance (Astro)", () => {
  it("verified badge: the canonical name, with the line as description and title", async () => {
    const host = await render(Badge, { assurance: "none", attestations: [OSM] })
    const badge = one(host, "[data-attestation='community']")
    expect(badge.attribs["aria-label"]).toBe("Community Vouched")
    expect(badge.attribs["aria-description"]).toBe("via OpenStreetMap · checked 14 Mar 2026")
    expect(badge.attribs.title).toBe("Community Vouched\nvia OpenStreetMap · checked 14 Mar 2026")
    expect(badge.attribs["data-source"]).toBe("osm")
    expect(badge.attribs["data-checked-at"]).toBe("2026-03-14")
  })

  it("verified badge: no date when none was given", async () => {
    const host = await render(Badge, { assurance: "none", attestations: [{ type: "community", source: "osm" }] })
    const badge = one(host, "[data-attestation='community']")
    expect(badge.attribs["aria-description"]).toBe("via OpenStreetMap")
    expect(badge.attribs["data-checked-at"]).toBeUndefined()
  })

  it("verified badge: an unknown source shows its id, escaped", async () => {
    const raw = await container.renderToString(Badge, {
      props: { assurance: "none", attestations: [{ type: "community", source: '<b>"x"</b>' }] },
    })
    // Quoted and escaped in an attribute: no element is made from it.
    expect(all(doc(raw), "b")).toHaveLength(0)
    expect(one(doc(raw), "[data-attestation='community']").attribs["aria-description"]).toBe('via <b>"x"</b>')
  })

  it("tier status: the chip's second line, with a machine-readable date", async () => {
    const host = await render(TierStatus, { assurance: "otp", attestationTypes: [OSM], locale: "en-GB" })
    const chip = one(host, "[data-slot='tier-attested'] > li")
    expect(text(chip)).toBe("Community Vouched via OpenStreetMap · checked 14 Mar 2026")
    expect(text(one(host, "[data-slot='tier-attested-provenance']"))).toBe("via OpenStreetMap · checked 14 Mar 2026")
    expect(one(host, "[data-slot='tier-attested-provenance'] time").attribs.datetime).toBe("2026-03-14")
  })

  it("tier status: the date follows the locale, and the words can be replaced", async () => {
    const host = await render(TierStatus, {
      assurance: "otp",
      attestationTypes: [OSM],
      locale: "en-US",
      copy: { via: "kupitia", checked: "imeangaliwa" },
    })
    expect(text(one(host, "[data-slot='tier-attested-provenance']"))).toBe("kupitia OpenStreetMap · imeangaliwa Mar 14, 2026")
  })

  it("tier status: no provenance, no second line", async () => {
    const host = await render(TierStatus, { assurance: "otp", attestationTypes: ["community"] })
    expect(all(host, "[data-slot='tier-attested-provenance']")).toHaveLength(0)
  })
})
