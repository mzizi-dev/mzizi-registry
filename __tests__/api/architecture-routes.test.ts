import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

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

// Smoke coverage for the architecture routes. Live routes return 503 with a
// clear "not configured" message when Supabase env vars are absent — same
// pattern as the existing brand-route test. Retired routes return 410
// regardless, because the answer no longer depends on the database.
// Real DB-backed assertions live in the live deploy smoke checks.

type Resp = {
  data: {
    error?: string
    message?: string
    /** Retired routes name the model that replaced them. */
    model?: string
    migrated_to?: Record<string, string>
  }
  status: number
  headers: Record<string, string>
}

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

describe("GET /api/v1/architecture (no Supabase)", () => {
  it("returns 503 with a clear 'not configured' message", async () => {
    const { GET } = await import("@/app/api/v1/architecture/route")
    const r = (await GET()) as unknown as Resp
    expect(r.status).toBe(503)
    expect(r.data.error).toBe("Database not configured")
    expect(r.headers["Access-Control-Allow-Origin"]).toBe("*")
  })
})

// The axis routes are RETIRED, not merely legacy-labelled. Mzizi serves the DNA
// double helix — nodes on two backbones held by cross-cutting rungs; there are
// no axes and no outliers (§6.2). These assert 410 rather than 503 because the
// answer no longer depends on whether Supabase is configured: there is nothing
// to serve either way.
describe("GET /api/v1/architecture/axes (retired)", () => {
  it("returns 410 Gone with a helix pointer", async () => {
    const { GET } = await import("@/app/api/v1/architecture/axes/route")
    const r = (await GET()) as unknown as Resp
    expect(r.status).toBe(410)
    expect(r.data.error).toBe("Gone")
    expect(r.headers["Access-Control-Allow-Origin"]).toBe("*")
  })

  it("never emits axis-shaped DATA, only prose explaining the retirement", async () => {
    const { GET } = await import("@/app/api/v1/architecture/axes/route")
    const r = (await GET()) as unknown as Resp
    // `message` is human-readable prose and legitimately says "axis" and
    // "outliers" to explain WHY the route is gone. The assertion is about the
    // structured payload: no geometry field, no axis rows, no outlier entries.
    const { message: _prose, ...structured } = r.data
    const blob = JSON.stringify(structured)
    expect(blob).not.toMatch(/"geometry"/)
    expect(blob).not.toMatch(/horizontal|vertical|outlier/i)
    expect(blob).not.toMatch(/axis_|axes_/)
    expect(r.data.model).toBe("mzizi-dna-helix")
  })
})

describe("GET /api/v1/architecture/frontend/axes (retired)", () => {
  it("returns 410 Gone", async () => {
    const { GET } = await import("@/app/api/v1/architecture/frontend/axes/route")
    const r = (await GET()) as unknown as Resp
    expect(r.status).toBe(410)
    expect(r.data.error).toBe("Gone")
    expect(r.data.model).toBe("mzizi-dna-helix")
  })
})

describe("GET /api/v1/architecture/frontend/layers (retired)", () => {
  it("returns 410 Gone", async () => {
    const { GET } = await import("@/app/api/v1/architecture/frontend/layers/route")
    const r = (await GET()) as unknown as Resp
    expect(r.status).toBe(410)
    expect(r.data.error).toBe("Gone")
    expect(r.data.model).toBe("mzizi-dna-helix")
  })
})

// `layers/[n]` is retired for the same reason as the axis routes: it served an
// `axis_name` per row behind a `1-10` bound. Keeping it as a stable alias for
// nodes was the earlier compromise, and a stable URL serving retired vocabulary
// is how the drift spread — so it is 410, and `nodes/[n]` is the live route.
describe("GET /api/v1/architecture/layers/[n] (retired)", () => {
  it("returns 410 Gone with a helix pointer, whatever n is", async () => {
    const { GET } = await import("@/app/api/v1/architecture/layers/[n]/route")
    const r = (await GET(new Request("https://x/api/v1/architecture/layers/3"), {
      params: Promise.resolve({ n: "3" }),
    })) as unknown as Resp
    expect(r.status).toBe(410)
    expect(r.data.error).toBe("Gone")
    expect(r.data.model).toBe("mzizi-dna-helix")
    expect(r.data.migrated_to?.["node detail"]).toContain("/api/v1/architecture/nodes/3")
  })

  it("is 410 even for a node the old 1-10 bound would have rejected", async () => {
    const { GET } = await import("@/app/api/v1/architecture/layers/[n]/route")
    const r = (await GET(new Request("https://x/api/v1/architecture/layers/11"), {
      params: Promise.resolve({ n: "11" }),
    })) as unknown as Resp
    expect(r.status).toBe(410)
  })
})

describe("GET /api/v1/architecture/nodes/[n]", () => {
  it("rejects non-integer slugs with 400", async () => {
    const { GET } = await import("@/app/api/v1/architecture/nodes/[n]/route")
    const r = (await GET(new Request("https://x/api/v1/architecture/nodes/abc"), {
      params: Promise.resolve({ n: "abc" }),
    })) as unknown as Resp
    expect(r.status).toBe(400)
    expect(r.data.error).toContain("integer")
  })

  // The point of the route. A high node number is NOT out of range — node
  // numbers are labels, not a sequence, and the set is never capped. The old
  // `1-10` bound is what made N11 unreachable, so a bound at any value is the
  // defect. Whether a node exists is the collection's answer (404), never a
  // constant's (400).
  it("does not treat a high node number as out of range", async () => {
    const { GET } = await import("@/app/api/v1/architecture/nodes/[n]/route")
    for (const n of ["11", "12", "99"]) {
      const r = (await GET(new Request(`https://x/api/v1/architecture/nodes/${n}`), {
        params: Promise.resolve({ n }),
      })) as unknown as Resp
      expect(r.status).not.toBe(400)
    }
  })

  it("returns 503 for a valid node when Supabase is not configured", async () => {
    const { GET } = await import("@/app/api/v1/architecture/nodes/[n]/route")
    const r = (await GET(new Request("https://x/api/v1/architecture/nodes/3"), {
      params: Promise.resolve({ n: "3" }),
    })) as unknown as Resp
    expect(r.status).toBe(503)
    expect(r.data.error).toBe("Database not configured")
  })
})
