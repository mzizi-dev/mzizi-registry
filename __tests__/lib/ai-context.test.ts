/**
 * What `mzizi-ai-context` tells an assistant about the system (#323).
 *
 * The `.ts` called the system "the Nyuchi Design System", described it with the
 * retired four-axis model stopping at N10, and pointed at a Supabase project and
 * `nyuchi/mzizi`. Its output now matches the Rust build; the Rust contract test
 * (`mzizi-docs/tests/contract.rs`) holds the two sources together, and this runs
 * the TypeScript and checks what it actually renders.
 */

import { describe, expect, it } from "vitest"
import {
  aiContextPresets,
  generateAIContext,
} from "@/components/registry/n10-documentation/mzizi-ai-context"

describe("mzizi-ai-context", () => {
  const full = generateAIContext()

  it("names the system Mzizi and points at the registry", () => {
    expect(full).toContain("# Mzizi Design System")
    expect(full).toContain("Source: https://mzizi.dev | GitHub: mzizi-dev/mzizi-registry")
    expect(full).toContain("MCP server: https://mcp.mzizi.dev/mcp")
    expect(full).not.toMatch(/Nyuchi Design System|Supabase|nyuchi\/mzizi|get_system_counts/)
  })

  it("renders the uncapped node map, not the retired axis model", () => {
    expect(full).toContain("The node set is UNCAPPED")
    expect(full).toContain("  N1   Tokens         — CSS substrate. The only node that defines CSS values.")
    expect(full).toContain("  N12  Skills         — What the system knows how to do, authored in git.")
    for (const retired of ["horizontal", "vertical", "outlier", "depth"]) {
      expect(full).not.toContain(retired)
    }
  })

  it("prints counts only when given them", () => {
    expect(full).toContain("For live counts: https://mcp.mzizi.dev/mcp")
    const withCounts = generateAIContext({
      counts: { totalComponents: 575, totalStable: 500, totalNodes: 12 },
    })
    expect(withCounts).toContain("575 components total, 500 stable, across 12 nodes.")
    expect(withCounts).not.toContain("For live counts")
  })

  it("keeps the IDE presets free of the architecture prose", () => {
    const copilot = aiContextPresets.copilot()
    expect(copilot).not.toContain("# Mzizi Design System")
    expect(copilot).toContain("## Node map")
    expect(copilot).toContain("## Rules (non-negotiable)")
  })
})
