/**
 * #543 Kweli phase 2, items 4–6: EventCard slots and minerals, MziziReviewCard headline,
 * line breaks, named stars and tier badge, and the read-only Rating as one named image.
 */
import { renderToStaticMarkup } from "react-dom/server"
import { beforeAll, describe, expect, it } from "vitest"

import { Rating } from "@/components/registry/n2-primitives/rating"
import { EventCard } from "@/components/registry/n3-brand/mzizi-event-card"
import { MziziReviewCard } from "@/components/registry/n3-brand/mzizi-review-card"

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

describe("EventCard", () => {
  it("takes every one of the seven minerals", () => {
    for (const m of ["cobalt", "tanzanite", "malachite", "gold", "terracotta", "sodalite", "copper"] as const) {
      const card = html(<EventCard title="T" time="18:00" mineral={m} />).querySelector('[data-slot="event-card"]')
      expect(card?.getAttribute("data-mineral")).toBe(m)
      expect(card?.className).toContain(`border-l-[var(--color-${m})]`)
    }
  })

  it("renders description, price and share slots", () => {
    const root = html(
      <EventCard
        title="Jazz night"
        time="18:00"
        description="Live music at the hall"
        price="US$5"
        share={<button type="button">Share</button>}
      />
    )
    expect(root.querySelector('[data-slot="event-card-description"]')?.textContent).toBe("Live music at the hall")
    expect(root.querySelector('[data-slot="event-card-price"]')?.textContent).toBe("US$5")
    expect(root.querySelector('[data-slot="event-card-share"] button')?.textContent).toBe("Share")
  })

  it("free shows Free (or freeLabel) in place of the price", () => {
    expect(html(<EventCard title="T" time="t" free price="US$5" />).querySelector('[data-slot="event-card-price"]')?.textContent).toBe("Free")
    expect(html(<EventCard title="T" time="t" free freeLabel="Mahara" />).querySelector('[data-slot="event-card-price"]')?.textContent).toBe("Mahara")
  })

  it("has no footer without price, free or share", () => {
    expect(html(<EventCard title="T" time="t" />).querySelector('[data-slot="event-card-footer"]')).toBeNull()
  })
})

describe("Rating read-only", () => {
  it("is one role=img named with the value, with no buttons", () => {
    const root = html(<Rating value={4} readOnly />)
    const r = root.querySelector('[data-slot="rating"]')
    expect(r?.getAttribute("role")).toBe("img")
    expect(r?.getAttribute("aria-label")).toBe("4 out of 5 stars")
    expect(root.querySelectorAll("button")).toHaveLength(0)
    expect(root.querySelector('[role="radiogroup"]')).toBeNull()
  })

  it("names a fractional value to one decimal, and label overrides", () => {
    expect(html(<Rating value={3.5} readOnly />).querySelector('[role="img"]')?.getAttribute("aria-label")).toBe("3.5 out of 5 stars")
    expect(html(<Rating value={3} readOnly label="Rated 3" />).querySelector('[role="img"]')?.getAttribute("aria-label")).toBe("Rated 3")
  })

  it("interactive stays operable: a named group of named buttons", () => {
    const root = html(<Rating value={2} />)
    expect(root.querySelector('[data-slot="rating"]')?.getAttribute("role")).toBe("group")
    const buttons = root.querySelectorAll("button")
    expect(buttons).toHaveLength(5)
    expect(buttons[2]?.getAttribute("aria-label")).toBe("3 stars")
    expect(buttons[1]?.getAttribute("aria-pressed")).toBe("true")
    expect(buttons[2]?.getAttribute("aria-pressed")).toBe("false")
    for (const b of buttons) expect(b.hasAttribute("disabled")).toBe(false)
  })
})

describe("MziziReviewCard", () => {
  const base = { reviewer: "Rudo", rating: 4, text: "Great service.\nWould come back." }

  it("names the stars \"4 out of 5 stars\"", () => {
    const root = html(<MziziReviewCard {...base} />)
    expect(root.querySelector('[data-slot="rating"][role="img"]')?.getAttribute("aria-label")).toBe("4 out of 5 stars")
  })

  it("keeps the body's line breaks and shows an optional headline", () => {
    const root = html(<MziziReviewCard {...base} headline="Fast and friendly" />)
    const body = root.querySelector('[data-slot="mzizi-review-card-body"]')
    expect(body?.className).toContain("whitespace-pre-line")
    expect(body?.textContent).toBe("Great service.\nWould come back.")
    expect(root.querySelector('[data-slot="mzizi-review-card-headline"]')?.textContent).toBe("Fast and friendly")
    expect(html(<MziziReviewCard {...base} />).querySelector('[data-slot="mzizi-review-card-headline"]')).toBeNull()
  })

  it("shows the tier with the verified badge, never an emoji", () => {
    const root = html(<MziziReviewCard {...base} verificationTier={3} />)
    const badge = root.querySelector('[data-slot="mzizi-verified-badge"]')
    expect(badge?.getAttribute("data-tier")).toBe("government")
    expect(badge?.getAttribute("role")).toBe("img")
    expect(root.textContent).not.toMatch(/[🟤🔵🟡🟣]/u)
  })
})
