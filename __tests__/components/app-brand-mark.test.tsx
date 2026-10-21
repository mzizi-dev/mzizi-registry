/**
 * app-brand-mark (React): a brand outside the shipped set is a clear error at render, never
 * another brand's mark (contract `app/brand-mark`). The Astro build is held to the same rule
 * in `__tests__/astro/app-brand-mark.test.ts`.
 */
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { BrandMark, type BrandName } from "@/components/registry/n3-brand/app-brand-mark"

describe("BrandMark (React)", () => {
  it.each(["bundu", "Nyuchi", "", "toString", "constructor", "__proto__"])(
    "an unknown brand %j is an error that names it and the brands that ship",
    (brand) => {
      expect(() => renderToStaticMarkup(<BrandMark brand={brand as BrandName} />)).toThrow(
        `BrandMark: unknown brand ${JSON.stringify(brand)}; expected one of "nyuchi", "mukoko"`
      )
    }
  )

  it("an omitted brand is nyuchi", () => {
    expect(renderToStaticMarkup(<BrandMark />)).toContain('data-brand="nyuchi"')
  })
})
