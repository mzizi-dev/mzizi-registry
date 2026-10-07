/**
 * `evaluateTheming`'s output is a contract with @bundu/ui: mzizi-dev/packages-npm
 * syncs `contracts/runner.ts` (`pnpm registry:sync`), and its
 * `packages/bundu-ui/src/app/contract-runner.test.ts` matches these failures
 * by count and by exact text. This pins the same cases here, so a change to
 * the runner cannot silently break that suite at the next pin bump.
 */
import { describe, expect, test } from "vitest"

import { type Contract, evaluateTheming } from "../../contracts/runner"

const base = {
  name: "app/x",
  title: "X",
  version: "1.0.0",
  states: { default: {}, other: {} },
  contract: 'contract\n  slot is "x"\nend',
  checks: [],
  density: [],
  theming: { tokens: [], brandOverlay: "", statusColours: [] },
  noJs: { script: "none", without: "" },
  props: [],
  slots: [],
  implementations: { astro: null },
} as Contract

describe("evaluateTheming's output, as @bundu/ui's synced runner tests read it", () => {
  test("a mineral, a hex value, a colour function in style, and the inline style itself", () => {
    const bad = { default: '<div class="bg-gold text-[#5D4037]" style="color: rgb(0 0 0)"></div>' }
    expect(evaluateTheming(base, bad)).toEqual([
      "[default] an inline style attribute on <div> (needs style-src-attr 'unsafe-inline')",
      "[default] a literal hex colour on <div>",
      "[default] a literal colour function on <div>",
      '[default] <div> names the mineral "gold" (bg-gold), which is not one of its declared status colours',
    ])
  })

  test("an inline style: the exact message, with no value in it", () => {
    expect(evaluateTheming(base, { default: '<span style="--x: 1"></span>' })).toEqual([
      "[default] an inline style attribute on <span> (needs style-src-attr 'unsafe-inline')",
    ])
  })

  test("a hex value or a colour function inside a style attribute still fails as a colour", () => {
    expect(evaluateTheming(base, { default: '<i style="color: #fff"></i>' })).toEqual([
      "[default] an inline style attribute on <i> (needs style-src-attr 'unsafe-inline')",
      "[default] a literal hex colour on <i>",
    ])
    expect(evaluateTheming(base, { default: '<i style="color: oklch(0.5 0.1 200)"></i>' })).toEqual([
      "[default] an inline style attribute on <i> (needs style-src-attr 'unsafe-inline')",
      "[default] a literal colour function on <i>",
    ])
  })

  test("a declared status colour passes", () => {
    const status = { default: '<div class="bg-malachite-container"></div>' }
    expect(evaluateTheming({ ...base, theming: { ...base.theming, statusColours: ["malachite"] } }, status)).toEqual([])
  })
})
