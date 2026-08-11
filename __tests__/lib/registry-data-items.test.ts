/**
 * A DATA item's node, read against the real `registry.json` and the real files on disk.
 *
 * This is deliberately an integration test rather than a fixture test. The defect it pins
 * could not be reproduced with a fixture, because the fixture would have to invent the one
 * thing that was missing: `readComponents()` derives a component's node from the directory
 * its file lives in, and a data item — `cssVars`/`css`, no file — has no directory. Its node
 * was therefore `undefined`, and `undefined` is not neutral. It dropped `nyuchi-tokens` out
 * of `/api/v1/ui?node=1` and out of `mzizi_list_components({ node: 1 })`, so an agent asking
 * the registry for node 1 got the 17 N1 libraries and not the tokens those libraries and 431
 * components are built on — the one item every consumer is told to install first.
 *
 * Reading the real manifest is the point: the manifest is now the ONLY source for a data
 * item's node, so a test that mocks it away tests nothing.
 */
import { describe, it, expect } from "vitest"
import { readComponents, readNodeCounts } from "@/lib/registry"

const items = readComponents()
const dataItems = items.filter((i) => !i.files?.length && (i.cssVars || i.css))

describe("data items in the registry", () => {
  it("has at least one, or the rest of this file is vacuous", () => {
    expect(dataItems.length).toBeGreaterThan(0)
  })

  it("gives every data item a node and a label", () => {
    for (const i of dataItems) {
      expect(typeof i.node, `${i.name} has no node`).toBe("number")
      expect(i.node, `${i.name} has a node below 1`).toBeGreaterThanOrEqual(1)
      expect(i.nodeLabel, `${i.name} has no nodeLabel`).toBeTruthy()
    }
  })

  it("places nyuchi-tokens in N1 as a theme", () => {
    const tokens = items.find((i) => i.name === "nyuchi-tokens")
    expect(tokens).toBeDefined()
    expect(tokens?.type).toBe("registry:theme")
    expect(tokens?.node).toBe(1)
    expect(tokens?.nodeLabel).toBe("tokens")
    // The payload is the tokens themselves; a file here would mean the tokens went back to
    // being React-only, which is the whole thing the theme item exists to undo.
    expect(tokens?.files ?? []).toHaveLength(0)
    expect(Object.keys(tokens?.cssVars ?? {}).sort()).toEqual(["dark", "light", "theme"])
  })

  it("counts data items in their node, since they are components of it", () => {
    const counts = readNodeCounts()
    const n1 = items.filter((i) => i.node === 1)
    expect(counts[1]).toBe(n1.length)
    expect(n1.map((i) => i.name)).toContain("nyuchi-tokens")
  })
})
