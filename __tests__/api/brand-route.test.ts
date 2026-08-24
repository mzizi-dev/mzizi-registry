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

/**
 * All 21 colour families must be served.
 *
 * `/api/v1/brand` shipped 7 of them. `getBrandSystem()` fetches minerals,
 * semantic colours, backgrounds, typography, spacing, ecosystem and meta —
 * heritage and experimental were never in the query, and there is no
 * `brand_heritage` or `brand_experimental` view to read (19 `brand_*` views
 * exist; those two are not among them).
 *
 * The consequence was not local. This route is what the MCP server reads, so
 * `mzizi_get_tokens(family: "heritage")` errored for every agent — while the
 * tool advertised `heritage` in its own schema. Fourteen of twenty-one families
 * were unreachable from outside the repo, and no gate noticed, because nothing
 * asserted a family count on the response.
 *
 * These specs mock the DB deliberately THIN: heritage and experimental come from
 * the committed `palette.generated.ts` snapshot, not from the mocked query, so a
 * regression that drops the import fails here even though the DB mock is
 * unchanged.
 */
describe("GET /api/v1/brand colour families", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://stub.supabase.co")
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "stub-anon-key")
    vi.resetModules()
  })

  async function serve() {
    vi.doMock("@/lib/db", () => ({
      isSupabaseConfigured: () => true,
      getBrandSystem: async () => ({
        minerals: [
          {
            name: "cobalt",
            hex: "#0047AB",
            light_hex: "#0047AB",
            dark_hex: "#00B0FF",
            container_light: "#E3F2FD",
            container_dark: "#001F3F",
            css_var: "--color-cobalt",
            origin: "Katanga",
            symbolism: "trust",
            usage: "links",
          },
        ],
        semanticColors: [],
        backgrounds: [],
        typography: [],
        spacing: [],
        ecosystem: [],
        meta: {
          version: "4.0.0",
          name: "Mzizi",
          last_updated: "2026-08-24",
          homepage: "https://mzizi.dev",
          radii: {},
          component_specs: {},
          accessibility: {},
          voice_and_tone: {},
          philosophy: {},
        },
      }),
    }))
    const { GET } = await import("@/app/api/v1/brand/route")
    return (await GET()) as unknown as {
      data: Record<string, Array<Record<string, unknown>>>
      status: number
    }
  }

  it("serves heritage and experimental, not just minerals", async () => {
    const res = await serve()
    expect(res.status).toBe(200)
    expect(res.data.heritage, "heritage family absent from /api/v1/brand").toBeDefined()
    expect(res.data.experimental, "experimental family absent from /api/v1/brand").toBeDefined()
    expect(res.data.heritage).toHaveLength(7)
    expect(res.data.experimental).toHaveLength(7)
  })

  it("names the four families that were unreachable, and gives them real hexes", async () => {
    const res = await serve()
    const heritage = res.data.heritage.map((h) => h.name)
    expect(heritage).toContain("hematite")
    expect(heritage).toContain("kalahari")
    // A family present but hexless would satisfy a count assertion and still be
    // useless to the agent reading it.
    for (const row of [...res.data.heritage, ...res.data.experimental]) {
      expect(String(row.darkHex), `${row.name} darkHex`).toMatch(/^#[0-9a-fA-F]{6}$/)
      expect(String(row.lightHex), `${row.name} lightHex`).toMatch(/^#[0-9a-fA-F]{6}$/)
    }
  })

  it("carries the heptagon index on experimental tones", async () => {
    const res = await serve()
    const idx = res.data.experimental.map((e) => e.heptagonIndex).sort()
    expect(idx).toEqual([0, 1, 2, 3, 4, 5, 6])
  })
})
