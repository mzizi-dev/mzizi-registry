/// <reference types="vite/client" />
/**
 * app-brand-mark (Astro): a brand outside the shipped set is a clear error at render, never
 * another brand's mark (contract `app/brand-mark`), as in the React build.
 */
import { experimental_AstroContainer as AstroContainer } from "astro/container"
import { describe, expect, it } from "vitest"

const mods = import.meta.glob<{ default: unknown }>("../../components/registry/n3-brand/app-brand-mark.astro", { eager: true })
type Component = Parameters<AstroContainer["renderToString"]>[0]
const BrandMark = Object.values(mods)[0]?.default as Component

describe("BrandMark (Astro)", () => {
  it.each(["bundu", "Nyuchi", "", "toString", "constructor", "__proto__"])(
    "an unknown brand %j is an error that names it and the brands that ship",
    async (brand) => {
      const container = await AstroContainer.create()
      await expect(container.renderToString(BrandMark, { props: { brand } })).rejects.toThrow(
        `BrandMark: unknown brand ${JSON.stringify(brand)}; expected one of "nyuchi", "mukoko"`
      )
    }
  )

  it("an omitted brand is nyuchi", async () => {
    const container = await AstroContainer.create()
    expect(await container.renderToString(BrandMark)).toContain('data-brand="nyuchi"')
  })
})
