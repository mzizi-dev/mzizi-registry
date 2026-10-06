/**
 * lib/astro.ts: the documents `/v1/astro/{name}` serves (mzizi-registry#397).
 */
import { readdirSync } from "node:fs"
import path from "node:path"
import { describe, expect, test } from "vitest"

import { ASTRO_INSTALL_DIR, ASTRO_ROUTE, astroDocument, hasAstro } from "@/lib/astro"

const REGISTRY = path.resolve(__dirname, "../../components/registry")
const astroNames = readdirSync(REGISTRY)
  .filter((d) => /^n\d+-/.test(d))
  .flatMap((d) => readdirSync(path.join(REGISTRY, d)).filter((f) => f.endsWith(".astro")))
  .map((f) => f.slice(0, -".astro".length))
  .sort()

describe("every .astro resolves to an installable document", () => {
  test("there are Astro implementations", () => {
    expect(astroNames.length).toBeGreaterThan(40)
  })

  test.each(astroNames)("%s", (name) => {
    const doc = astroDocument(name)
    expect(doc).not.toBeNull()
    expect(doc?.target).toBe("astro")
    expect(doc?.files[0]?.target).toBe(`${ASTRO_INSTALL_DIR}/${name}.astro`)
    // The closure is complete: every dependency answers too.
    for (const url of doc?.registryDependencies ?? []) {
      expect(url.startsWith(`${ASTRO_ROUTE}/`)).toBe(true)
      expect(hasAstro(url.slice(ASTRO_ROUTE.length + 1)), url).toBe(true)
    }
    expect(doc?.dependencies).not.toContain("react")
    expect(doc?.dependencies).not.toContain("astro")
  })
})

describe("no name breaks the Astro build", () => {
  test("astroDocument answers or returns null for every component, never throws", async () => {
    const { readComponents } = await import("@/lib/registry")
    const bad: string[] = []
    for (const c of readComponents()) {
      try {
        astroDocument(c.name)
      } catch (e) {
        bad.push(`${c.name}: ${(e as Error).message}`)
      }
    }
    expect(bad).toEqual([])
  })

  test("a framework-free module whose import is React-only is not an Astro module", () => {
    expect(astroDocument("mzizi-otel")).toBeNull()
  })
})

describe("framework-free modules and assets", () => {
  test("a .ts module the .astro files use is served as registry:lib", () => {
    const doc = astroDocument("ui-utils")
    expect(doc?.type).toBe("registry:lib")
    expect(doc?.files[0]?.target).toBe(`${ASTRO_INSTALL_DIR}/ui-utils.ts`)
    expect(doc?.dependencies).toEqual(["clsx", "tailwind-merge"])
  })

  test("a React component with no .astro has no Astro document", () => {
    expect(astroDocument("accordion")).toBeNull()
    expect(hasAstro("accordion")).toBe(false)
  })

  test("a component's imported brand assets ship beside it, base64", () => {
    const doc = astroDocument("app-brand-mark")
    const assets = doc?.files.filter((f) => f.type === "registry:asset") ?? []
    expect(assets.map((f) => f.target).sort()).toEqual([
      `${ASTRO_INSTALL_DIR}/assets/mukoko-icon-dark.png`,
      `${ASTRO_INSTALL_DIR}/assets/mukoko-icon-light.png`,
      `${ASTRO_INSTALL_DIR}/assets/nyuchi-mark-dark.png`,
      `${ASTRO_INSTALL_DIR}/assets/nyuchi-mark-light.png`,
    ])
    for (const a of assets) {
      expect(a.encoding).toBe("base64")
      expect(Buffer.from(a.content, "base64").subarray(1, 4).toString()).toBe("PNG")
    }
  })

  test("server helpers resolve their .js-suffixed flat imports", () => {
    expect(astroDocument("server-flash")?.registryDependencies).toEqual([`${ASTRO_ROUTE}/server-cookies`])
  })
})
