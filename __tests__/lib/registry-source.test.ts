/**
 * `@/lib/registry-source` is the single reader of component source on disk.
 *
 * These run against the REAL `components/registry/**` tree rather than a
 * fixture, because the property that matters is "the file the route serves is
 * the file in the repo" — a fixture would assert the resolver's shape while
 * leaving the thing the migration exists to guarantee untested.
 */

import { describe, expect, it, beforeEach } from "vitest"
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"

/**
 * Resolve a component's file the way a human would — by name, in its node
 * directory, whatever extension it carries. The extension is owned by the
 * registry (`files[0].path`), so hardcoding `.tsx` here made the suite fail the
 * moment `nyuchi-seo` was corrected to the `.ts` its registry row declares.
 */
function fileOnDisk(nodeDir: string, name: string): string {
  const dir = join(process.cwd(), "components/registry", nodeDir)
  const match = readdirSync(dir).find((f) => f.replace(/\.[^.]+$/, "") === name)
  if (!match) throw new Error(`no file for "${name}" in ${nodeDir}`)
  return readFileSync(join(dir, match), "utf8")
}
import {
  componentsOnDisk,
  readComponentSource,
  resetRegistrySourceCache,
  resolveComponentSource,
} from "@/lib/registry-source"

beforeEach(() => resetRegistrySourceCache())

describe("readComponentSource", () => {
  it("returns the file's real bytes, not a rendering of them", () => {
    expect(readComponentSource("nyuchi-seo")).toBe(fileOnDisk("n11-discovery", "nyuchi-seo"))
  })

  it("finds a component without being told its node", () => {
    // The caller has a name, not a node. If the resolver needed the node it
    // would need the node-label table too, and that table would then live in
    // two places.
    expect(readComponentSource("nyuchi-seo")).toContain("generateMetadata")
  })

  it("returns null — never an empty string — for a component with no file", () => {
    // A 200 carrying an empty body is exactly how the pre-migration bugs hid,
    // so the absent case has to be distinguishable at the type level.
    expect(readComponentSource("no-such-component-anywhere")).toBeNull()
  })

  it("does not resolve a path traversal to something outside the registry", () => {
    expect(readComponentSource("../../package")).toBeNull()
    expect(readComponentSource("../../../etc/passwd")).toBeNull()
  })
})

describe("resolveComponentSource — the migration window", () => {
  it("prefers disk over the database column", () => {
    // Both copies exist for exactly as long as a node takes to move. Disk wins,
    // because disk is the copy the toolchain has actually checked.
    expect(resolveComponentSource("nyuchi-seo", "// stale db copy")).toContain("generateMetadata")
  })

  it("falls back to the database for a component not yet extracted", () => {
    // Without this the read path would 404 every un-extracted component — an
    // outage across the whole registry in exchange for nothing, since the DB
    // copy is still there and still correct.
    expect(resolveComponentSource("not-yet-extracted", "export const x = 1")).toBe(
      "export const x = 1"
    )
  })

  it("treats a blank database column as absent, not as empty source", () => {
    expect(resolveComponentSource("not-yet-extracted", "   \n ")).toBeNull()
    expect(resolveComponentSource("not-yet-extracted", "")).toBeNull()
    expect(resolveComponentSource("not-yet-extracted", null)).toBeNull()
    expect(resolveComponentSource("not-yet-extracted")).toBeNull()
  })
})

describe("componentsOnDisk", () => {
  it("lists migrated components and is sorted", () => {
    const names = componentsOnDisk()
    expect(names).toContain("nyuchi-seo")
    expect(names).toEqual([...names].sort())
  })

  it("holds no duplicates — a name maps to exactly one file", () => {
    const names = componentsOnDisk()
    expect(new Set(names).size).toBe(names.length)
  })
})

/**
 * The reader took an ALLOW-list of extensions — `.tsx`, `.ts`, `.css`, `.json` —
 * and the registry is multi-language. Five components fell outside it: N8's
 * `accessibility-audit` (`.md`, a documented SQL pipeline) and N1's Kotlin,
 * Swift, Python and ArkTS token targets.
 *
 * Nothing looked broken, because `resolveComponentSource` fell back to the
 * database column and served them from there. The defect was invisible until
 * the column was dropped — at which point all five would have 404'd in
 * production, past the point of no return. An allow-list fails closed on a
 * language nobody anticipated, and it fails silently.
 */
describe("multi-language components", () => {
  it("reads the five non-TypeScript components an allow-list dropped", () => {
    for (const name of [
      "accessibility-audit", // .md    — N8 assurance
      "nyuchi-tokens-kotlin", // .kt    — N1
      "nyuchi-tokens-swift", // .swift — N1
      "nyuchi-tokens-python", // .py    — N1
      "nyuchi-tokens-arkts", // .ets   — N1
    ]) {
      const source = readComponentSource(name)
      expect(source, `${name} must resolve on disk, not via a database fallback`).not.toBeNull()
      expect(source!.length).toBeGreaterThan(0)
    }
  })

  it("indexes every non-hidden file in the registry tree", () => {
    const indexed = new Set(componentsOnDisk())
    const root = join(process.cwd(), "components/registry")

    const missing: string[] = []
    for (const dir of readdirSync(root, { withFileTypes: true })) {
      if (!dir.isDirectory()) continue
      for (const entry of readdirSync(join(root, dir.name))) {
        if (entry.startsWith(".")) continue
        const name = entry.replace(/\.[^.]+$/, "")
        if (!indexed.has(name)) missing.push(`${dir.name}/${entry}`)
      }
    }

    // Anything here is a file the routes cannot serve, which after the database
    // drop means a 404 for a component the registry still advertises.
    expect(missing).toEqual([])
    expect(indexed.size).toBeGreaterThan(500)
  })
})
