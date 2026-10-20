/**
 * What `mzizi-ai-context` tells an assistant about the system (#323, #479).
 *
 * The `.ts` called the system "the Nyuchi Design System", described it with the
 * retired four-axis model stopping at N10, and pointed at a Supabase project and
 * `nyuchi/mzizi`. Both builds are now held to one committed golden output per
 * case in `__tests__/fixtures/ai-context/`: the Rust contract test
 * (`mzizi-docs/tests/contract.rs`) renders the `.rs` against those files, and
 * this renders the `.ts` against the same files, so the two builds say the same
 * thing byte for byte. The registry item that describes the component is held
 * to the same facts.
 */

import { readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import {
  aiContextPresets,
  generateAIContext,
} from "@/components/registry/n10-documentation/mzizi-ai-context"

const golden = (name: string) =>
  readFileSync(path.resolve(__dirname, `../fixtures/ai-context/${name}.txt`), "utf8")

/** Wording from the database era that neither build nor its metadata may say. */
const RETIRED =
  /Nyuchi Design System|Supabase|nyuchi\/mzizi(?![\w.-])|get_system_counts|get_node_counts|documentation_pages|ai_instructions|component_docs|\btables?\b|\bstable\b/

describe("mzizi-ai-context renders the golden output the Rust build renders", () => {
  it.each([
    ["default", () => generateAIContext()],
    ["with-counts", () => generateAIContext({ counts: { totalComponents: 575, totalNodes: 12 } })],
    ["copilot", () => aiContextPresets.copilot()],
  ])("%s", (name, render) => {
    expect(render()).toBe(golden(name))
  })

  it("the golden output names Mzizi, the registry and the full node set", () => {
    const full = golden("default")
    expect(full).toContain("# Mzizi Design System")
    expect(full).toContain("Source: https://mzizi.dev | GitHub: mzizi-dev/mzizi-registry")
    expect(full).toContain("N12  Skills")
    expect(full).not.toMatch(RETIRED)
    for (const retired of ["horizontal", "vertical", "outlier", "depth"]) {
      expect(full).not.toContain(retired)
    }
  })
})

describe("registry metadata", () => {
  const items = (
    JSON.parse(readFileSync(path.resolve(__dirname, "../../registry.json"), "utf8")) as {
      items: Array<{ name: string; description: string; docs?: string; meta: Record<string, unknown> }>
    }
  ).items

  it.each(["mzizi-ai-context", "mzizi-dx"])("%s says nothing from the database era", (name) => {
    const item = items.find((i) => i.name === name)
    expect(item).toBeDefined()
    const text = [item!.description, item!.docs ?? "", JSON.stringify(item!.meta.features ?? [])]
    for (const t of text) {
      expect(t).not.toMatch(/Nyuchi Design System|Supabase|get_system_counts|documentation_pages|ai_instructions|component_docs/)
    }
  })

  it("mzizi-ai-context's metadata matches what the component does", () => {
    const item = items.find((i) => i.name === "mzizi-ai-context")!
    expect(`${item.description} ${item.docs ?? ""}`).not.toMatch(RETIRED)
  })
})
