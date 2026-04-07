import { describe, it, expect } from "vitest"
import fs from "fs"
import path from "path"

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
    ]

    for (const file of routeFiles) {
      it(`${file} exists`, () => {
        const filePath = path.join(process.cwd(), file)
        expect(fs.existsSync(filePath)).toBe(true)
      })
    }
  })

  describe("Old API routes removed", () => {
    const oldRoutes = ["app/api/r/route.ts", "app/api/brand/route.ts", "app/api/health/route.ts"]

    for (const file of oldRoutes) {
      it(`${file} no longer exists`, () => {
        const filePath = path.join(process.cwd(), file)
        expect(fs.existsSync(filePath)).toBe(false)
      })
    }
  })

  describe("Architecture data module", () => {
    it("lib/architecture.ts exists", () => {
      const filePath = path.join(process.cwd(), "lib/architecture.ts")
      expect(fs.existsSync(filePath)).toBe(true)
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
      expect(content).toContain("Mukoko Architecture API")
    })
  })
})
