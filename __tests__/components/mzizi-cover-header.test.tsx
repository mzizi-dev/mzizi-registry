/**
 * mzizi-cover-header (#543): the cover is a real <img> (lazy, or eager with fetchpriority under
 * `priority`), the avatar box is drawn only with an avatar, and role="banner" is opt-in.
 */
import { renderToStaticMarkup } from "react-dom/server"
import { beforeAll, describe, expect, it } from "vitest"

import { MziziCoverHeader } from "@/components/registry/n3-brand/mzizi-cover-header"

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

describe("MziziCoverHeader", () => {
  it("draws the cover as a lazy <img> with empty alt, never a CSS url()", () => {
    const url = 'https://x.test/a b").jpg'
    const root = html(<MziziCoverHeader name="Tendai Moyo" coverImage={url} />)
    const img = root.querySelector('[data-slot="mzizi-cover-header-cover"] img')
    expect(img?.getAttribute("src")).toBe(url)
    expect(img?.getAttribute("alt")).toBe("")
    expect(img?.getAttribute("loading")).toBe("lazy")
    expect(img?.getAttribute("decoding")).toBe("async")
    expect(img?.className).toContain("object-cover")
    expect(root.innerHTML).not.toContain("background-image")
  })

  it("priority loads the cover eagerly with fetchpriority=high; coverAlt is its alt", () => {
    const root = html(<MziziCoverHeader name="A" coverImage="https://x.test/c.jpg" coverAlt="The market at dawn" priority />)
    const img = root.querySelector('[data-slot="mzizi-cover-header-cover"] img')
    expect(img?.getAttribute("loading")).toBe("eager")
    expect(img?.getAttribute("fetchpriority")).toBe("high")
    expect(img?.getAttribute("alt")).toBe("The market at dawn")
  })

  it("draws no avatar box without an avatar, and one with", () => {
    expect(html(<MziziCoverHeader name="A" />).querySelector('[data-slot="mzizi-cover-header-avatar"]')).toBeNull()
    const withAvatar = html(<MziziCoverHeader name="A" avatar="https://x.test/a.jpg" />)
    expect(withAvatar.querySelector('[data-slot="mzizi-cover-header-avatar"] img')).not.toBeNull()
  })

  it("keeps the action without an avatar", () => {
    const root = html(<MziziCoverHeader name="A" action={<button type="button">Follow</button>} />)
    expect(root.querySelector("button")?.textContent).toBe("Follow")
  })

  it("has no banner role by default; banner opts in", () => {
    expect(html(<MziziCoverHeader name="A" />).querySelector('[role="banner"]')).toBeNull()
    expect(html(<MziziCoverHeader name="A" banner />).querySelector('[data-slot="mzizi-cover-header"]')?.getAttribute("role")).toBe(
      "banner"
    )
  })
})
