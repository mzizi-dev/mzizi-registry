/**
 * The defects Kweli hit vendoring mzizi-place-card, mzizi-verified-badge and mzizi-icons for
 * its place embed (mzizi-registry#532). Each block holds one fix so it cannot quietly regress.
 */
import { readFileSync, readdirSync, statSync } from "node:fs"
import path from "node:path"
import { act } from "react"
import { createRoot } from "react-dom/client"
import { renderToStaticMarkup } from "react-dom/server"
import { beforeAll, describe, expect, it, vi } from "vitest"

import * as icons from "@/components/registry/n1-tokens/mzizi-icons"
import { verificationTokens as n1VerificationTokens } from "@/components/registry/n1-tokens/mzizi-tokens-typescript"
import { useMziziHarness, useNyuchiHarness } from "@/components/registry/n3-brand/mzizi-harness"
import { MziziPlaceCard, type MziziPlaceCardLinkProps } from "@/components/registry/n3-brand/mzizi-place-card"
import {
  MziziVerifiedBadge,
  TIER_CONFIG,
} from "@/components/registry/n3-brand/mzizi-verified-badge"
import { verificationTokens } from "@/lib/tokens"

// jsdom has no matchMedia; the harness asks it for prefers-reduced-motion.
beforeAll(() => {
  window.matchMedia ??= ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia
})

const ROOT = path.resolve(__dirname, "../..")
const registry = JSON.parse(readFileSync(path.join(ROOT, "registry.json"), "utf8")) as {
  items: { name: string; files: { target?: string }[]; meta?: { variants?: string[] } }[]
}
const item = (name: string) => registry.items.find((i) => i.name === name)!

describe("mzizi-verified-badge tier colours (the Mukoko ladder: government Gold, licensed Tanzanite)", () => {
  it("each tier reads the --tier-* variable named after it", () => {
    expect(TIER_CONFIG.government.fg).toBe("var(--tier-government,var(--color-gold))")
    expect(TIER_CONFIG.licensed.fg).toBe("var(--tier-licensed,var(--color-tanzanite))")
    expect(TIER_CONFIG.community.fg).toBe("var(--tier-community,var(--color-terracotta))")
    expect(TIER_CONFIG.unverified.fg).toBe("var(--tier-unverified,var(--status-neutral))")
    expect(TIER_CONFIG.otp.fg).toContain("--tier-otp")
  })

  it("each tier's background is its own mineral", () => {
    expect(TIER_CONFIG.government.bg).toBe("color-mix(in oklab,var(--tier-government,var(--color-gold)) 15%,transparent)")
    expect(TIER_CONFIG.licensed.bg).toBe("color-mix(in oklab,var(--tier-licensed,var(--color-tanzanite)) 15%,transparent)")
  })

  it.each([
    ["the lib tokens", verificationTokens],
    ["the N1 token file", n1VerificationTokens],
  ])("%s define --tier-government as gold and --tier-licensed as tanzanite", (_, tokens) => {
    expect(tokens.government.css).toBe("--tier-government")
    expect(tokens.government.mineral).toBe("gold")
    expect(tokens.government.value).toMatch(/^var\(--tier-government, .*gold/)
    expect(tokens.licensed.css).toBe("--tier-licensed")
    expect(tokens.licensed.mineral).toBe("tanzanite")
    expect(tokens.licensed.value).toMatch(/^var\(--tier-licensed, .*tanzanite/)
  })

  it("no registry source reads --tier-government with a tanzanite fallback, or --tier-licensed with gold", () => {
    const files: string[] = []
    const walk = (dir: string) => {
      for (const f of readdirSync(dir)) {
        const p = path.join(dir, f)
        if (statSync(p).isDirectory()) walk(p)
        else if (/\.(tsx?|astro|rs)$/.test(f)) files.push(p)
      }
    }
    walk(path.join(ROOT, "components/registry"))
    walk(path.join(ROOT, "lib/tokens"))
    const swapped = files.filter((f) =>
      /--tier-government,\s*(var\(--color-)?tanzanite|--tier-government,\s*var\(--color-tanzanite|--tier-licensed,\s*(var\(--status-warning,\s*)?var\(--color-gold/.test(
        readFileSync(f, "utf8")
      )
    )
    expect(swapped.map((f) => path.relative(ROOT, f))).toEqual([])
  })

  it("the active badge is an image with an accessible name", () => {
    const html = renderToStaticMarkup(<MziziVerifiedBadge tier="government" />)
    expect(html).toContain('role="img"')
    expect(html).toContain('aria-label="Government Verified"')
    expect(html).toContain("--tier-government")
  })

  it("leaves the trust score out of the title and the accessible name by default (#550)", () => {
    const html = renderToStaticMarkup(<MziziVerifiedBadge tier="otp" />)
    expect(html).toContain('aria-label="Contact Verified"')
    expect(html).toContain('title="Contact Verified"')
    expect(html).not.toContain("Trust")
  })

  it("showScore adds the cumulative score to the title and the accessible name", () => {
    const html = renderToStaticMarkup(<MziziVerifiedBadge tier="otp" showScore />)
    expect(html).toContain('aria-label="Contact Verified · Trust 0.2"')
    expect(html).toContain('title="Contact Verified · Trust 0.2"')
  })

  it("label replaces the wording in the title and the accessible name, in every state", () => {
    const active = renderToStaticMarkup(<MziziVerifiedBadge tier="licensed" label="Registered nurse" />)
    expect(active).toContain('aria-label="Registered nurse"')
    expect(active).toContain('title="Registered nurse"')
    expect(active).not.toContain("Licensed Professional")
    const suspended = renderToStaticMarkup(
      <MziziVerifiedBadge tier="otp" status="suspended" label="Akaunti yakamiswa" />
    )
    expect(suspended).toContain('aria-label="Akaunti yakamiswa"')
    const memorial = renderToStaticMarkup(
      <MziziVerifiedBadge tier="otp" status="verified_ancestral" label="In memory" />
    )
    expect(memorial).toContain('aria-label="In memory"')
  })

  it("ariaLabel sets the accessible name alone; the title keeps the label", () => {
    const html = renderToStaticMarkup(
      <MziziVerifiedBadge tier="government" label="ID checked" ariaLabel="Identity checked by government ID" showScore />
    )
    expect(html).toContain('aria-label="Identity checked by government ID"')
    expect(html).toContain('title="ID checked · Trust 0.3"')
  })

  it("showTooltip={false} drops the title, not the accessible name", () => {
    const html = renderToStaticMarkup(<MziziVerifiedBadge tier="community" showTooltip={false} />)
    expect(html).not.toContain("title=")
    expect(html).toContain('aria-label="Community Verified"')
  })

  it("does not claim a tooltip component it never uses", () => {
    const badge = registry.items.find((i) => i.name === "mzizi-verified-badge") as unknown as {
      registryDependencies: string[]
      docs: string
    }
    expect(badge.registryDependencies.some((d) => d.endsWith("/tooltip"))).toBe(false)
    expect(badge.docs).not.toContain("Tooltip with tier explanation")
  })
})

describe("mzizi-place-card", () => {
  it("the row variant renders the category under the name", () => {
    const html = renderToStaticMarkup(<MziziPlaceCard name="Lake Kariba" category="Lake" />)
    expect(html).toMatch(/data-slot="mzizi-place-card-category" class="text-xs text-muted-foreground">Lake</)
  })

  it("renders a footer under the row, in both variants", () => {
    for (const variant of ["row", "compact"] as const) {
      const html = renderToStaticMarkup(
        <MziziPlaceCard name="Kariba" variant={variant} footer={<span>Verified by Kweli</span>} />
      )
      expect(html).toMatch(/data-slot="mzizi-place-card-footer"[^>]*><span>Verified by Kweli<\/span>/)
    }
  })

  it("renders the verified badge, not a bare dot", () => {
    const html = renderToStaticMarkup(<MziziPlaceCard name="Kariba" verificationTier="licensed" />)
    expect(html).toContain('data-slot="mzizi-verified-badge"')
    expect(html).toContain('aria-label="Licensed Professional"')
  })

  it("with showTierLabel, tier 0 reads Unverified", () => {
    const html = renderToStaticMarkup(<MziziPlaceCard name="Kariba" showTierLabel />)
    expect(html).toContain(">Unverified<")
    expect(renderToStaticMarkup(<MziziPlaceCard name="Kariba" />)).not.toContain("Unverified")
  })

  it("with href, the root is a real link with the given target and no nested control", () => {
    for (const variant of ["row", "compact"] as const) {
      const html = renderToStaticMarkup(
        <MziziPlaceCard
          name="Kariba"
          variant={variant}
          href="https://kweli.mukoko.com/place/1"
          target="_top"
          verificationTier="government"
          image="https://example.com/a.jpg"
        />
      )
      // React hoists a <link rel="preload"> for the image ahead of the card; skip it.
      const card = html.replace(/^<link [^>]*\/>/, "")
      expect(card.startsWith('<a data-slot="mzizi-place-card"')).toBe(true)
      expect(html).toContain('href="https://kweli.mukoko.com/place/1"')
      expect(html).toContain('target="_top"')
      expect(html).not.toContain('role="article"')
      expect(html.match(/<a[\s>]/g)).toHaveLength(1)
      expect(html).not.toMatch(/<button|tabindex/i)
    }
  })

  it("any target that opens another context adds rel=noopener noreferrer", () => {
    for (const target of ["_blank", "kweli-window"]) {
      const html = renderToStaticMarkup(<MziziPlaceCard name="K" href="/p" target={target} />)
      expect(html).toContain('rel="noopener noreferrer"')
    }
    for (const target of ["_self", "_top", "_parent", undefined]) {
      const html = renderToStaticMarkup(<MziziPlaceCard name="K" href="/p" target={target} />)
      expect(html).not.toContain("rel=")
    }
  })

  it("with onClick and no href, the card is a focusable button", () => {
    const html = renderToStaticMarkup(<MziziPlaceCard name="Kariba" onClick={() => {}} />)
    expect(html).toMatch(/^<div data-slot="mzizi-place-card"[^>]*role="button"[^>]*tabindex="0"/)
  })

  it("without onClick or href, the card stays an article", () => {
    const html = renderToStaticMarkup(<MziziPlaceCard name="Kariba" />)
    expect(html).toMatch(/^<div data-slot="mzizi-place-card"[^>]*role="article"/)
    expect(html).not.toContain("tabindex")
  })

  it("Enter, Space and click on a footer button reach the button, not the card's onClick", async () => {
    const container = document.createElement("div")
    document.body.appendChild(container)
    const root = createRoot(container)
    const onCard = vi.fn()
    const onButton = vi.fn()
    await act(async () => {
      root.render(
        <MziziPlaceCard
          name="Kariba"
          onClick={onCard}
          footer={
            <button type="button" onClick={onButton}>
              Directions
            </button>
          }
        />
      )
    })
    const button = container.querySelector("button")!
    const card = container.querySelector<HTMLElement>('[data-slot="mzizi-place-card"]')!

    for (const key of ["Enter", " "]) {
      const ev = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true })
      await act(async () => {
        button.dispatchEvent(ev)
      })
      // The card must not cancel the button's own activation.
      expect(ev.defaultPrevented).toBe(false)
    }
    await act(async () => {
      button.click()
    })
    expect(onButton).toHaveBeenCalledTimes(1)
    expect(onCard).not.toHaveBeenCalled()

    // The card itself still answers click, Enter and Space.
    await act(async () => {
      card.click()
      card.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }))
      card.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }))
    })
    expect(onCard).toHaveBeenCalledTimes(3)
    // A click on static text inside the card is the card's.
    await act(async () => {
      container.querySelector<HTMLElement>("span")!.click()
    })
    expect(onCard).toHaveBeenCalledTimes(4)

    await act(async () => root.unmount())
    container.remove()
  })

  it("with linkComponent, the link is rendered by that component with the card's own attributes", () => {
    const seen: Record<string, unknown>[] = []
    function RouterLink({ href, className, children, ...rest }: MziziPlaceCardLinkProps) {
      seen.push({ href, className, ...rest })
      return (
        <a data-router-link="" href={href} className={className} {...rest}>
          {children}
        </a>
      )
    }
    for (const variant of ["row", "compact"] as const) {
      seen.length = 0
      const html = renderToStaticMarkup(
        <MziziPlaceCard
          name="Kariba"
          variant={variant}
          href="/place/1"
          target="_blank"
          linkComponent={RouterLink}
        />
      )
      expect(seen).toHaveLength(1)
      expect(seen[0]?.href).toBe("/place/1")
      expect(seen[0]?.className).toContain("no-underline")
      expect(seen[0]?.["data-slot"]).toBe("mzizi-place-card")
      expect(seen[0]?.rel).toBe("noopener noreferrer")
      expect(html).toMatch(/^<a data-router-link=""/)
      expect(html.match(/<a[\s>]/g)).toHaveLength(1)
      expect(html).toContain("Kariba")
    }
    // Same-context targets keep no rel, through the link component too.
    seen.length = 0
    renderToStaticMarkup(<MziziPlaceCard name="K" href="/p" target="_top" linkComponent={RouterLink} />)
    expect(seen[0]?.rel).toBeUndefined()
  })

  it("linkComponent is ignored without href: onClick alone still makes a role=button card", () => {
    const Never = () => {
      throw new Error("linkComponent rendered without href")
    }
    const html = renderToStaticMarkup(<MziziPlaceCard name="K" onClick={() => {}} linkComponent={Never} />)
    expect(html).toMatch(/^<div data-slot="mzizi-place-card"[^>]*role="button"/)
  })

  it("the cover image loads lazily and decodes asynchronously by default, in both variants", () => {
    for (const variant of ["row", "compact"] as const) {
      const html = renderToStaticMarkup(<MziziPlaceCard name="K" variant={variant} image="https://example.com/a.jpg" />)
      const img = html.match(/<img [^>]*>/)?.[0] ?? ""
      expect(img).toContain('loading="lazy"')
      expect(img).toContain('decoding="async"')
      expect(img).not.toMatch(/fetchpriority/i)
      // A lazy image is not preloaded.
      expect(html).not.toMatch(/<link [^>]*rel="preload"/)
    }
  })

  it("priority loads the cover eagerly with fetchpriority=high", () => {
    for (const variant of ["row", "compact"] as const) {
      const html = renderToStaticMarkup(
        <MziziPlaceCard name="K" variant={variant} image="https://example.com/a.jpg" priority />
      )
      const img = html.match(/<img [^>]*>/)?.[0] ?? ""
      expect(img).toContain('loading="eager"')
      // HTML attribute names are case-insensitive; React writes it as `fetchPriority`.
      expect(img).toMatch(/ fetchpriority="high"/i)
      expect(img).not.toContain('loading="lazy"')
    }
  })

  it("the card itself carries data-portal, not only its skeleton", () => {
    const html = renderToStaticMarkup(<MziziPlaceCard name="Kariba" />)
    expect(html).toContain('data-portal="https://mzizi.dev/components/mzizi-place-card"')
  })

  it("documents only the variants it implements", () => {
    expect(item("mzizi-place-card").meta?.variants).toEqual(["row", "compact"])
  })
})

describe("mzizi-icons answers @/lib/icons", () => {
  it("installs to lib/icons, the path every component imports", () => {
    expect(item("mzizi-icons").files[0].target).toBe("lib/icons/index.tsx")
  })

  it("is not a client module, so a Server Component can import it (#543)", () => {
    const src = readFileSync(path.join(ROOT, "components/registry/n1-tokens/mzizi-icons.tsx"), "utf8")
    // Next's flight loader rejects `export *` inside a client boundary imported by a server module.
    expect(src).toMatch(/^export \* from "lucide-react"/m)
    expect(src).not.toMatch(/^\s*["']use client["']/m)
    // Nothing in it needs the client: no hooks, no effects, no browser globals.
    expect(src).not.toMatch(/\buse(State|Effect|LayoutEffect|Ref|Context|Reducer)\b|\bwindow\.|\bdocument\./)
  })

  it("exports every name a registry component imports from @/lib/icons", () => {
    const wanted = new Set<string>()
    const walk = (dir: string) => {
      for (const f of readdirSync(dir)) {
        const p = path.join(dir, f)
        if (statSync(p).isDirectory()) walk(p)
        else if (/\.tsx?$/.test(f)) {
          const src = readFileSync(p, "utf8")
          for (const m of src.matchAll(/import\s*(?:type\s*)?\{([^}]*)\}\s*from\s*"@\/lib\/icons"/g))
            for (const raw of m[1].split(",")) {
              const name = raw.replace(/^\s*type\s+/, "").split(/\s+as\s+/)[0].trim()
              if (name) wanted.add(name)
            }
        }
      }
    }
    walk(path.join(ROOT, "components/registry"))
    expect(wanted.size).toBeGreaterThan(100)
    // `LucideIcon` is a type-only export, so it has no runtime value to look up.
    const missing = [...wanted].filter((n) => n !== "LucideIcon" && !(n in icons))
    expect(missing).toEqual([])
  })
})

describe("mzizi-harness keeps the pre-rename name", () => {
  it("useNyuchiHarness is a deprecated alias of useMziziHarness", () => {
    expect(useNyuchiHarness).toBe(useMziziHarness)
  })
})
