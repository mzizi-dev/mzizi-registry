import { describe, it, expect, vi } from "vitest"

// Mock next/server before importing the route
vi.mock("next/server", () => ({
  NextResponse: {
    json: (data: unknown, init?: { headers?: Record<string, string>; status?: number }) => ({
      data,
      headers: init?.headers ?? {},
      status: init?.status ?? 200,
    }),
  },
}))

describe("GET /api/brand", () => {
  it("returns brand system data with correct headers", async () => {
    const { GET } = await import("@/app/api/brand/route")
    const response = (await GET()) as unknown as { data: Record<string, unknown>; headers: Record<string, string>; status: number }

    expect(response.status).toBe(200)
    expect(response.headers["Cache-Control"]).toBe("public, max-age=3600, s-maxage=86400")
    expect(response.headers["Access-Control-Allow-Origin"]).toBe("*")
  })

  it("returns valid brand system JSON", async () => {
    const { GET } = await import("@/app/api/brand/route")
    const response = (await GET()) as unknown as { data: Record<string, unknown> }

    expect(response.data).toHaveProperty("version", "7.0.0")
    expect(response.data).toHaveProperty("minerals")
    expect(response.data).toHaveProperty("ecosystem")
    expect(response.data).toHaveProperty("typography")
    expect(response.data).toHaveProperty("spacing")
    expect(response.data).toHaveProperty("accessibility")
    expect(response.data).toHaveProperty("$schema")
  })

  it("includes all 5 minerals", async () => {
    const { GET } = await import("@/app/api/brand/route")
    const response = (await GET()) as unknown as { data: { minerals: Array<{ name: string }> } }

    expect(response.data.minerals).toHaveLength(5)
    const names = response.data.minerals.map((m) => m.name)
    expect(names).toEqual(["cobalt", "tanzanite", "malachite", "gold", "terracotta"])
  })
})
