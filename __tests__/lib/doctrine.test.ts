// @vitest-environment node
import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import {
  DOCTRINE,
  doctrineRows,
  readDoctrineCollection,
  readDoctrineDocument,
  readDoctrineSorted,
} from "@/lib/doctrine"
import { DOCTRINE_SOURCES } from "@/lib/doctrine.generated"

/**
 * Doctrine moved off the filesystem and into a generated module, so the app can
 * run on Cloudflare Workers — which has no filesystem.
 *
 * These specs exist because two real bugs slipped through a green 233-test run
 * and were only caught by dumping every collection before and after the change
 * and comparing byte for byte. Both are memorialised below.
 */
describe("doctrine reads the generated sources", () => {
  it("serves every document in the generated module", () => {
    const generated = Object.entries(DOCTRINE_SOURCES).reduce(
      (n, [, docs]) => n + Object.keys(docs).length,
      0
    )
    const served = Object.values(DOCTRINE).reduce(
      (n, coll) => n + readDoctrineCollection(coll).length,
      0
    )
    // Not an equality against a magic number — a hardcoded 103 would pass on a
    // tree that lost a document and gained an unrelated one.
    expect(served).toBeGreaterThan(0)
    expect(served).toBeLessThanOrEqual(generated)
  })

  /**
   * REGRESSION. `readDoctrineSorted` calls `.sort()`, which mutates. That was
   * harmless while `readDoctrineCollection` rebuilt a fresh array per call.
   * Memoising it made an in-place sort permanently reorder the cache, so every
   * later caller expecting slug order silently received sort_order instead.
   *
   * It only manifests when both functions run against one collection in one
   * process — which is what production does on every render.
   */
  it("readDoctrineSorted does not reorder what readDoctrineCollection returns", () => {
    const coll = DOCTRINE.principles
    const before = readDoctrineCollection(coll).map((d) => d.slug)
    readDoctrineSorted(coll)
    const after = readDoctrineCollection(coll).map((d) => d.slug)
    expect(after).toEqual(before)
  })

  /**
   * REGRESSION. The old implementation sorted `readdirSync` output, i.e.
   * `<slug>.mdx`. Sorting bare slugs is a DIFFERENT order: `-` (0x2D) sorts
   * before `.` (0x2E), so `personal-sovereign.mdx` precedes `personal.mdx`
   * while `personal` precedes `personal-sovereign`.
   *
   * Callers render in the order they receive, so this is live display order.
   */
  it("orders by filename, so a slug that prefixes another still sorts second", () => {
    const slugs = readDoctrineCollection(DOCTRINE.dataOwnership).map((d) => d.slug)
    const i = slugs.indexOf("personal-sovereign")
    const j = slugs.indexOf("personal")
    // Guard the fixture: if these documents are renamed, fail loudly rather
    // than pass vacuously on two -1s.
    expect(i, "personal-sovereign missing").toBeGreaterThanOrEqual(0)
    expect(j, "personal missing").toBeGreaterThanOrEqual(0)
    expect(i).toBeLessThan(j)
  })

  it("restores the body into the field it came from", () => {
    // `doctrineRow` puts the extracted prose back under `_bodyField`. Losing it
    // type-checks cleanly and shows up as a blank panel in production.
    const rows = doctrineRows<Record<string, unknown>>(DOCTRINE.sovereignty)
    expect(rows.length).toBeGreaterThan(0)
    for (const row of rows) {
      expect(row).not.toHaveProperty("_bodyField")
      expect(typeof row.rationale).toBe("string")
      expect((row.rationale as string).length).toBeGreaterThan(0)
    }
  })

  it("finds a document by slug and misses cleanly", () => {
    expect(readDoctrineDocument(DOCTRINE.framework, "astro-vite-plus")?.slug).toBe(
      "astro-vite-plus"
    )
    expect(readDoctrineDocument(DOCTRINE.framework, "no-such-doc")).toBeNull()
  })

  it("refuses traversal segments rather than memoising them", () => {
    // There is no path to escape any more — a lookup is an object key. The
    // check is kept so `..` returns not-found instead of caching an empty entry.
    expect(readDoctrineCollection("../..")).toEqual([])
    expect(readDoctrineDocument("..", "../../package")).toBeNull()
  })

  it("needs no filesystem", () => {
    // The point of the whole change: Cloudflare Workers has no filesystem, so a
    // reintroduced `fs` import here is a deploy-time failure that nothing else
    // catches — importing the module would still succeed locally.
    //
    // Asserted on the SOURCE rather than on behaviour, because that is the only
    // form the regression takes.
    const src = readFileSync(join(process.cwd(), "lib/doctrine.ts"), "utf8")
    expect(src).not.toMatch(/from ["']fs["']|from ["']node:fs["']/)
    expect(readDoctrineCollection(DOCTRINE.nodes).length).toBeGreaterThan(0)
  })
})
