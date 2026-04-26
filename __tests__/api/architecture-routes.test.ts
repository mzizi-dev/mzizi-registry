import { describe, it, expect, vi } from "vitest"

vi.mock("next/server", () => ({
  NextResponse: {
    json: (data: unknown, init?: { headers?: Record<string, string>; status?: number }) => ({
      data,
      headers: init?.headers ?? {},
      status: init?.status ?? 200,
    }),
  },
}))

vi.mock("@/lib/metrics", () => ({
  trackApiCall: vi.fn(),
}))

// Smoke coverage for the 3 new architecture routes added by issue #59.
// Without Supabase env vars, every route returns 503 with a clear "not
// configured" message — same pattern as the existing brand-route test.
// Real DB-backed assertions live in the live deploy smoke checks.

type Resp = {
  data: { error?: string; message?: string }
  status: number
  headers: Record<string, string>
}

describe("GET /api/v1/architecture (no Supabase)", () => {
  it("returns 503 with a clear 'not configured' message", async () => {
    const { GET } = await import("@/app/api/v1/architecture/route")
    const r = (await GET()) as unknown as Resp
    expect(r.status).toBe(503)
    expect(r.data.error).toBe("Database not configured")
    expect(r.headers["Access-Control-Allow-Origin"]).toBe("*")
  })
})

describe("GET /api/v1/architecture/axes (no Supabase)", () => {
  it("returns 503 with a clear 'not configured' message", async () => {
    const { GET } = await import("@/app/api/v1/architecture/axes/route")
    const r = (await GET()) as unknown as Resp
    expect(r.status).toBe(503)
    expect(r.data.error).toBe("Database not configured")
    expect(r.headers["Access-Control-Allow-Origin"]).toBe("*")
  })
})

describe("GET /api/v1/architecture/layers/[n]", () => {
  it("rejects non-integer slugs with 400", async () => {
    const { GET } = await import("@/app/api/v1/architecture/layers/[n]/route")
    const r = (await GET(new Request("https://x/api/v1/architecture/layers/abc"), {
      params: Promise.resolve({ n: "abc" }),
    })) as unknown as Resp
    expect(r.status).toBe(400)
    expect(r.data.error).toContain("integer")
  })

  it("rejects out-of-range layer numbers with 400", async () => {
    const { GET } = await import("@/app/api/v1/architecture/layers/[n]/route")
    const r = (await GET(new Request("https://x/api/v1/architecture/layers/99"), {
      params: Promise.resolve({ n: "99" }),
    })) as unknown as Resp
    expect(r.status).toBe(400)
  })

  it("returns 503 for valid layer when Supabase is not configured", async () => {
    const { GET } = await import("@/app/api/v1/architecture/layers/[n]/route")
    const r = (await GET(new Request("https://x/api/v1/architecture/layers/3"), {
      params: Promise.resolve({ n: "3" }),
    })) as unknown as Resp
    expect(r.status).toBe(503)
    expect(r.data.error).toBe("Database not configured")
  })
})
