import { describe, it, expect, vi, beforeEach } from "vitest"
import fs from "fs"
import path from "path"

// Mock next/server
vi.mock("next/server", () => ({
  NextResponse: {
    json: (data: unknown, init?: { headers?: Record<string, string>; status?: number }) => ({
      data,
      headers: init?.headers ?? {},
      status: init?.status ?? 200,
    }),
  },
}))

describe("GET /api/v1/ui", () => {
  it("registry.json exists and is valid JSON", () => {
    const registryPath = path.join(process.cwd(), "registry.json")
    expect(fs.existsSync(registryPath)).toBe(true)

    const raw = fs.readFileSync(registryPath, "utf-8")
    const registry = JSON.parse(raw)
    expect(registry.name).toBe("mukoko")
    expect(registry.items).toBeDefined()
    expect(Array.isArray(registry.items)).toBe(true)
  })

  it("registry.json has the correct schema", () => {
    const registryPath = path.join(process.cwd(), "registry.json")
    const registry = JSON.parse(fs.readFileSync(registryPath, "utf-8"))

    expect(registry.$schema).toBe("https://ui.shadcn.com/schema/registry.json")
    expect(registry.homepage).toBe("https://registry.mukoko.com")
  })

  it("all registry items have required fields", () => {
    const registryPath = path.join(process.cwd(), "registry.json")
    const registry = JSON.parse(fs.readFileSync(registryPath, "utf-8"))

    for (const item of registry.items) {
      expect(item.name).toBeTruthy()
      expect(item.type).toMatch(/^registry:(ui|hook|lib)$/)
      expect(item.files).toBeDefined()
      expect(item.files.length).toBeGreaterThan(0)
    }
  })

  it("all registry item files exist on disk", () => {
    const registryPath = path.join(process.cwd(), "registry.json")
    const registry = JSON.parse(fs.readFileSync(registryPath, "utf-8"))

    for (const item of registry.items) {
      for (const file of item.files) {
        const filePath = path.join(process.cwd(), file.path)
        expect(fs.existsSync(filePath), `Missing file: ${file.path} (component: ${item.name})`).toBe(true)
      }
    }
  })

  it("button component exists in registry", () => {
    const registryPath = path.join(process.cwd(), "registry.json")
    const registry = JSON.parse(fs.readFileSync(registryPath, "utf-8"))

    const button = registry.items.find((item: { name: string }) => item.name === "button")
    expect(button).toBeDefined()
    expect(button.type).toBe("registry:ui")
  })

  it("has 70+ components", () => {
    const registryPath = path.join(process.cwd(), "registry.json")
    const registry = JSON.parse(fs.readFileSync(registryPath, "utf-8"))

    expect(registry.items.length).toBeGreaterThanOrEqual(70)
  })
})
