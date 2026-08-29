// @vitest-environment node
import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { readComponent, readComponents, readNodeCounts } from "@/lib/registry"
import { REGISTRY_FILES } from "@/lib/registry.generated"

/**
 * `lib/registry.ts` stopped walking `components/registry/` and now groups a
 * generated listing. Cloudflare Workers has no filesystem, and this was the last
 * directory walk in the manifest read path.
 *
 * The swap was verified by dumping `readComponents`, `readNodeCounts`,
 * `readNodeLabels` and spot `readComponent` calls before and after and comparing
 * byte for byte — 949,382 bytes, identical. These specs pin the invariants that
 * a future edit could break quietly, since a differential only exists while
 * both implementations do.
 */
describe("registry reads the generated index", () => {
  it("serves components, and every one resolves to a listed file", () => {
    const items = readComponents()
    expect(items.length).toBeGreaterThan(0)

    const listed = new Set(REGISTRY_FILES.map((p) => `components/registry/${p}`))
    for (const item of items) {
      // A DATA item (registry:theme) legitimately has no file — that is what
      // carries the design tokens, and dropping it 404s every token consumer.
      if (!item.sourcePath) continue
      expect(listed, `${item.name} → ${item.sourcePath}`).toContain(item.sourcePath)
    }
  })

  /**
   * The rule that stops `shadcn add button` handing a consumer Rust.
   *
   * `button` has both `button.tsx` and `button.rs` on disk. `sourcePath` is what
   * `/api/v1/ui/{name}` serves, so it must be the TSX — and the grouping now
   * comes from a sorted listing, where `.rs` precedes `.tsx` alphabetically. If
   * the extension preference were ever dropped, sorted input would silently make
   * Rust win.
   */
  it("prefers the React source when a component has a Rust sibling", () => {
    const button = readComponent("button")
    expect(button, "button missing from the registry").not.toBeNull()
    expect(button!.sourcePath).toMatch(/\.tsx$/)
    // Guard the fixture: if the .rs sibling goes away this test proves nothing.
    expect(REGISTRY_FILES.some((p) => p.endsWith("/button.rs"))).toBe(true)
  })

  it("collapses a component's targets onto one name", () => {
    // button.tsx + button.rs are one component with two targets, not two
    // components — that is why the index keys on the basename.
    const names = readComponents().map((i) => i.name)
    expect(new Set(names).size).toBe(names.length)
  })

  it("counts every node that has components", () => {
    const counts = readNodeCounts()
    expect(Object.keys(counts).length).toBeGreaterThan(0)
    for (const [node, n] of Object.entries(counts)) {
      expect(Number.isInteger(Number(node))).toBe(true)
      expect(n).toBeGreaterThan(0)
    }
  })

  it("needs no filesystem", () => {
    // The point of the change: an `fs` import here cannot run on Workers, and
    // the failure would appear only at deploy. Asserted on the source, because
    // importing the module would still succeed locally.
    const src = readFileSync(join(process.cwd(), "lib/registry.ts"), "utf8")
    expect(src).not.toMatch(/from ["']fs["']|from ["']node:fs["']/)
  })
})
