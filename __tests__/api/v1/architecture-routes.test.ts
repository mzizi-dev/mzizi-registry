// @vitest-environment node
// Pure file-existence checks — must run in Node so `fs` / `path` resolve.
import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"

describe("Architecture API v1 Routes", () => {
  describe("API route files exist", () => {
    const routeFiles = [
      "app/api/v1/route.ts",
      "app/api/v1/brand/route.ts",
      "app/api/v1/ui/route.ts",
      "app/api/v1/ui/[name]/route.ts",
      "app/api/v1/ecosystem/route.ts",
      "app/api/v1/data-layer/route.ts",
      "app/api/v1/pipeline/route.ts",
      "app/api/v1/sovereignty/route.ts",
      "app/api/v1/health/route.ts",
      "app/api/v1/architecture/frontend/axes/route.ts",
      "app/api/v1/architecture/frontend/layers/route.ts",
      "app/api/v1/architecture/route.ts",
      "app/api/v1/architecture/axes/route.ts",
      "app/api/v1/architecture/layers/[n]/route.ts",
      "app/api/v1/architecture/nodes/[n]/route.ts",
      "app/source/[name]/page.tsx",
      "app/changelog/[name]/page.tsx",
      "app/api/health/[name]/route.ts",
      "app/api/chaos/[name]/route.ts",
      "app/architecture/page.tsx",
      "app/architecture/nodes/[n]/page.tsx",
      "app/api/v1/ubuntu/pillars/route.ts",
      "app/api/v1/ubuntu/principles/route.ts",
    ]

    for (const file of routeFiles) {
      it(`${file} exists`, () => {
        const filePath = path.join(process.cwd(), file)
        expect(fs.existsSync(filePath)).toBe(true)
      })
    }
  })

  describe("Old API routes removed", () => {
    const oldRoutes = [
      "app/api/r/route.ts",
      "app/api/brand/route.ts",
      "app/api/health/route.ts",
      "app/api/fundi/[name]/route.ts",
      "app/api/v1/fundi/route.ts",
      // The layer-era SITE page is gone; `/architecture/layers/:n` is a
      // permanent redirect to `/architecture/nodes/:n` in next.config.mjs.
      "app/architecture/layers/[n]/page.tsx",
    ]

    for (const file of oldRoutes) {
      it(`${file} no longer exists`, () => {
        const filePath = path.join(process.cwd(), file)
        expect(fs.existsSync(filePath)).toBe(false)
      })
    }
  })

  describe("Architecture data module", () => {
    it("architecture data is served from Supabase (lib/architecture.ts retired)", () => {
      const filePath = path.join(process.cwd(), "lib/architecture.ts")
      // Post-v4.0.26: the legacy lib/architecture.ts is gone; architecture data
      // is now served from the Supabase `architecture_*` tables via lib/db.
      expect(fs.existsSync(filePath)).toBe(false)
    })
  })

  describe("OpenAPI spec", () => {
    it("openapi.yaml exists", () => {
      const filePath = path.join(process.cwd(), "openapi.yaml")
      expect(fs.existsSync(filePath)).toBe(true)
    })

    it("openapi.yaml is valid YAML with correct version", () => {
      const filePath = path.join(process.cwd(), "openapi.yaml")
      const content = fs.readFileSync(filePath, "utf-8")
      expect(content).toContain('openapi: "3.1.0"')
      expect(content).toContain("Mzizi API")
    })

    it("documents the helix node route and no longer documents a live layer route", () => {
      const content = fs.readFileSync(path.join(process.cwd(), "openapi.yaml"), "utf-8")
      expect(content).toContain("/architecture/nodes/{n}:")
      expect(content).toContain("operationId: getHelixNode")
      // The layers path stays in the spec, but only to document its 410.
      expect(content).toContain("operationId: architecture-layers-gone")
      expect(content).not.toContain("operationId: getLayerDetail")
    })
  })

  // The node set is never capped. A `maximum` on a node argument is itself the
  // defect rather than a validation: the old `1-10` bound is what made N11
  // unreachable, and `1-11` would go on to hide N12. Asserted against the
  // STRUCTURED schema (a `maximum:` key next to a node param), not against
  // prose — the spec legitimately explains in words why there is no bound.
  describe("Node arguments carry no upper bound", () => {
    it("no node path parameter declares a maximum", () => {
      const content = fs.readFileSync(path.join(process.cwd(), "openapi.yaml"), "utf-8")
      // Match the `n` parameter exactly — `- name: name` also starts with
      // `- name: n`, and catching it would test the wrong parameter.
      const nodeParamBlocks = content.split(/- name: n$/m).slice(1)
      expect(nodeParamBlocks.length).toBeGreaterThan(0)
      for (const block of nodeParamBlocks) {
        // Only inspect the parameter's own schema, not the rest of the file.
        const schema = block.split("responses:")[0]
        expect(schema).toContain("minimum: 1")
        expect(schema).not.toMatch(/maximum:/)
      }
    })

    it("the changelog nodes_affected schema has no maximum", () => {
      const content = fs.readFileSync(path.join(process.cwd(), "openapi.yaml"), "utf-8")
      const block = content.split("nodes_affected:")[1] ?? ""
      expect(block.split("components_added:")[0]).not.toMatch(/maximum:/)
    })

    // The MCP tool surface is the one agents actually call, and a Zod bound
    // there is worse than an HTTP one: it rejects the filter before it reaches
    // the store, so asking for N11 returned a schema error rather than rows.
    it("the MCP list_components node argument declares no max", () => {
      const src = fs.readFileSync(path.join(process.cwd(), "lib/mcp-server.ts"), "utf-8")
      const nodeArg = src.match(/^\s*node: z\..*$/m)?.[0] ?? ""
      expect(nodeArg).not.toBe("")
      expect(nodeArg).not.toMatch(/\.max\(/)
    })
  })

  // Retired-model vocabulary must not reach a crawler. `llms.txt` is the
  // machine-readable summary an AI crawler reads, so a stale claim there
  // propagates further than one on a page. It legitimately NAMES the retired
  // model in order to say it is retired, so this asserts on the CLAIMS that
  // would teach it, not on the mere appearance of the words.
  describe("public/llms.txt serves only the helix", () => {
    const content = () => fs.readFileSync(path.join(process.cwd(), "public/llms.txt"), "utf-8")

    it("makes no axis-model claim", () => {
      const text = content()
      // These phrases must never appear as a description of the current model.
      // They MAY appear inside a sentence that says the model is retired — the
      // file names the old vocabulary precisely so a crawler carrying a stale
      // copy recognises it. So the assertion is per-paragraph: any paragraph
      // mentioning the retired model must also disown it. A naive
      // "does the word appear" check would fail the disavowal itself.
      const retired = [/ten layers across five axes/i, /3D frontend/i, /X-axis|Y-axis|Z-axis/i]
      const paragraphs = text.split(/\n\s*\n/)
      for (const pattern of retired) {
        for (const para of paragraphs) {
          if (!pattern.test(para)) continue
          expect(para).toMatch(/retired|no axes|not renamed|stale/i)
        }
      }
      // "Five African Minerals" was the pre-Seven palette name and has no
      // legitimate use here at all.
      expect(text).not.toMatch(/Five African Minerals/i)
    })

    it("describes the helix and its no-cap rule", () => {
      const text = content()
      expect(text).toContain("DNA double helix")
      expect(text).toMatch(/no axes/i)
      expect(text).toMatch(/never capped/i)
      expect(text).toContain("Seven African Minerals")
    })

    it("advertises the node route, not a layer route", () => {
      const text = content()
      expect(text).toContain("/api/v1/architecture/nodes/{n}")
      expect(text).toContain("/architecture/nodes/")
    })
  })
})
