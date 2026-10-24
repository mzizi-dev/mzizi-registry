/**
 * #543 Kweli phase 2, items 7, 8 and 11: the place card's tier wording and link name, the
 * address share card's code label and light QR plate, and the brand mark's lazy loading.
 */
import { renderToStaticMarkup } from "react-dom/server"
import { beforeAll, describe, expect, it } from "vitest"

import { AddressShareCard } from "@/components/registry/n3-brand/address-share-card"
import { BrandMark } from "@/components/registry/n3-brand/app-brand-mark"
import { MziziPlaceCard } from "@/components/registry/n3-brand/mzizi-place-card"

beforeAll(() => {
  window.matchMedia ??= ((query: string) => ({
    matches: true,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia
})

const html = (el: React.ReactElement) => {
  const host = document.createElement("div")
  host.innerHTML = renderToStaticMarkup(el)
  return host
}

describe("MziziPlaceCard tierLabel and linkLabel", () => {
  it("passes tierLabel to the badge and the printed tier", () => {
    const root = html(
      <MziziPlaceCard name="Mbare Musika" verificationTier="otp" showTierLabel tierLabel="Identity verified" />
    )
    const badge = root.querySelector('[data-slot="mzizi-verified-badge"]')
    expect(badge?.getAttribute("aria-label")).toBe("Identity verified")
    expect(badge?.getAttribute("title")).toBe("Identity verified")
    expect(root.querySelector('[data-slot="mzizi-place-card-tier"]')?.textContent).toBe("Identity verified")
  })

  it("keeps the built-in tier name without tierLabel", () => {
    const root = html(<MziziPlaceCard name="M" verificationTier="otp" showTierLabel />)
    expect(root.querySelector('[data-slot="mzizi-verified-badge"]')?.getAttribute("aria-label")).toBe("Contact Verified")
  })

  it("linkLabel names the link; without it the link has no aria-label", () => {
    const named = html(<MziziPlaceCard name="Mbare Musika" href="/p/1" linkLabel="Open Mbare Musika, 2 km away" />)
    expect(named.querySelector("a")?.getAttribute("aria-label")).toBe("Open Mbare Musika, 2 km away")
    expect(html(<MziziPlaceCard name="M" href="/p/1" />).querySelector("a")?.hasAttribute("aria-label")).toBe(false)
  })

  it("linkLabel names the button card; an article keeps its name", () => {
    const button = html(<MziziPlaceCard name="M" onClick={() => {}} linkLabel="Open M" />)
    expect(button.querySelector('[role="button"]')?.getAttribute("aria-label")).toBe("Open M")
    const article = html(<MziziPlaceCard name="M" linkLabel="Open M" />)
    expect(article.querySelector('[role="article"]')?.getAttribute("aria-label")).toBe("M")
  })
})

describe("AddressShareCard", () => {
  const props = { code: "NYU-7K2Q", url: "https://kweli.mukoko.com/a/NYU-7K2Q" }

  it("draws the QR on a light plate in every theme", () => {
    const plate = html(<AddressShareCard {...props} />).querySelector('[data-slot="address-qr-plate"]')
    expect(plate?.className).toContain("bg-surface-qr")
    expect(plate?.className).toContain("text-on-surface-qr")
    expect(plate?.querySelector('svg[data-slot="address-qr"]')).not.toBeNull()
  })

  it("codeLabel names the code chip", () => {
    const root = html(<AddressShareCard {...props} codeLabel="Delivery code" />)
    expect(root.querySelector('[data-slot="address-code"] .sr-only')?.textContent).toBe("Delivery code")
  })
})

describe("BrandMark loading", () => {
  it("is lazy and async by default", () => {
    for (const img of html(<BrandMark />).querySelectorAll("img")) {
      expect(img.getAttribute("loading")).toBe("lazy")
      expect(img.getAttribute("decoding")).toBe("async")
    }
  })

  it("loading=eager loads both marks eagerly", () => {
    for (const img of html(<BrandMark loading="eager" />).querySelectorAll("img"))
      expect(img.getAttribute("loading")).toBe("eager")
  })
})
