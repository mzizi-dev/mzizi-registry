import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

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

// These specs assert the "database not configured" branch, which `lib/db` decides
// from `process.env` read at MODULE scope. They used to rely on those vars simply
// being absent from the ambient environment: true in CI, false on any developer
// machine with the usual `.env.local`, where the suite failed with 200-instead-of-503.
// Stub the vars empty and reset the module registry so the branch under test is the
// one that actually runs, whatever the environment holds.
beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "")
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")
  vi.resetModules()
})

afterEach(() => {
  vi.unstubAllEnvs()
})

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
