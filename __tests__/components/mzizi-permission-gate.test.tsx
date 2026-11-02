/**
 * mzizi-permission-gate: the upgrade action uses the brand's primary pair, never a literal
 * white on cobalt (#543, from the Kweli review of kweli#228). White on dark cobalt #00B0FF is
 * 2.4:1, under WCAG AA; `--primary-foreground` is "text and icons on `primary`", held to body
 * contrast by the role set in both themes.
 */
import { readFileSync } from "node:fs"
import path from "node:path"
import { renderToStaticMarkup } from "react-dom/server"
import { beforeAll, describe, expect, it } from "vitest"

import { MziziPermissionGate } from "@/components/registry/n4-safety/mzizi-permission-gate"

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

/** WCAG 2 relative luminance and contrast ratio, for the two hex tokens of one theme block. */
function contrast(a: string, b: string): number {
  const lum = (hex: string) => {
    const [r, g, bl] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    const f = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
    return 0.2126 * f(r!) + 0.7152 * f(g!) + 0.0722 * f(bl!)
  }
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x)
  return (hi! + 0.05) / (lo! + 0.05)
}

describe("mzizi-permission-gate upgrade action", () => {
  // Rendered per test: the harness reads matchMedia, which beforeAll installs.
  const upgrade = () =>
    renderToStaticMarkup(
      <MziziPermissionGate requiredTier="government" userTier="otp" onUpgrade={() => {}}>
        <p>secret</p>
      </MziziPermissionGate>
    ).match(/<button [^>]*>/)?.[0] ?? ""

  it("is a type=button on the primary pair, with the --ring focus outline", () => {
    const button = upgrade()
    expect(button).toContain('type="button"')
    expect(button).toContain('data-slot="mzizi-permission-gate-upgrade"')
    expect(button).toMatch(/\bbg-primary\b/)
    expect(button).toMatch(/\btext-primary-foreground\b/)
    expect(button).toMatch(/focus-visible:outline-ring\b/)
  })

  it("names no literal colour and no mineral", () => {
    expect(upgrade()).not.toMatch(/text-white|#[0-9a-f]{3,8}\b|cobalt/i)
  })

  it("the primary pair is at least 4.5:1 in both themes of styles/globals.css", () => {
    const css = readFileSync(path.join(ROOT, "styles/globals.css"), "utf8")
    const values = (name: string) =>
      [...css.matchAll(new RegExp(`^\\s*--${name}:\\s*(#[0-9a-fA-F]{6})\\s*;`, "gm"))].map((m) => m[1]!)
    const primary = values("primary")
    const foreground = values("primary-foreground")
    // :root (light) and .dark, in that order.
    expect(primary.length).toBeGreaterThanOrEqual(2)
    expect(foreground.length).toBe(primary.length)
    for (let i = 0; i < primary.length; i++) expect(contrast(primary[i]!, foreground[i]!)).toBeGreaterThanOrEqual(4.5)
  })

  it("renders the children when the tier is enough", () => {
    const ok = renderToStaticMarkup(
      <MziziPermissionGate requiredTier="otp" userTier="government">
        <p>secret</p>
      </MziziPermissionGate>
    )
    expect(ok).toBe("<p>secret</p>")
  })
})
