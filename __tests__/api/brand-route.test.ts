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

describe("GET /api/v1/brand", () => {
  it("returns 503 when database is not configured", async () => {
    const { GET } = await import("@/app/api/v1/brand/route")
    const response = (await GET()) as unknown as {
      data: Record<string, unknown>
      headers: Record<string, string>
      status: number
    }

    // Without Supabase env vars, the route returns 503
    expect(response.status).toBe(503)
    expect(response.data).toHaveProperty("error", "Database not configured")
    expect(response.headers["Access-Control-Allow-Origin"]).toBe("*")
  })

  it("returns proper error message with setup instructions", async () => {
    const { GET } = await import("@/app/api/v1/brand/route")
    const response = (await GET()) as unknown as {
      data: { error: string; message: string }
      status: number
    }

    expect(response.status).toBe(503)
    expect(response.data.message).toContain("NEXT_PUBLIC_SUPABASE_URL")
  })

  it("includes CORS header on error responses", async () => {
    const { GET } = await import("@/app/api/v1/brand/route")
    const response = (await GET()) as unknown as {
      headers: Record<string, string>
      status: number
    }

    expect(response.headers["Access-Control-Allow-Origin"]).toBe("*")
  })
})
