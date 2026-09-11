import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

import { minerals as paletteMinerals } from "@/lib/tokens/palette.source"
import { mineralApiHex } from "@/lib/tokens/brand.source"

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

/**
 * EVERY SPEC HERE RUNS WITH SUPABASE UNSET, ON PURPOSE.
 *
 * `/api/v1/brand` opened with `if (!isSupabaseConfigured()) return 503` and
 * then read seven collections over the wire. The suite that stood here asserted
 * that 503 — it tested the outage. On the Cloudflare Worker, which correctly
 * carries no database credentials, that guard WAS the response: the one surface
 * serving the corrected 7/7/7 palette answered 503 to every caller, and the
 * green test said it should.
 *
 * So the stubs below are not scaffolding for one "unconfigured" case any more.
 * They are the contract: this route must serve the complete brand system with
 * every Supabase variable empty, the way `pnpm tokens:verify` is proven to run
 * with no credential. Stubbed empty rather than left to the ambient
 * environment, because a developer machine with `.env.local` would otherwise
 * pass for the wrong reason.
 */
beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "")
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "")
  vi.resetModules()
})

afterEach(() => {
  vi.unstubAllEnvs()
})

type Served = {
  data: Record<string, unknown>
  headers: Record<string, string>
  status: number
}

async function serve(): Promise<Served> {
  const { GET } = await import("@/app/api/v1/brand/route")
  return (await GET()) as unknown as Served
}

/**
 * The live apex response, captured from `https://mzizi.dev/api/v1/brand` while
 * the route still read Supabase. It is the ground truth this endpoint's
 * disk-backed replacement has to reproduce, and it is committed so the
 * comparison survives the database being switched off.
 *
 * This is the spec the brief asks for: it fails if a colour family or ANY field
 * disappears, because it compares the whole document rather than sampling it.
 */
const baseline = JSON.parse(
  readFileSync(join(__dirname, "..", "fixtures", "brand-api-baseline.json"), "utf8")
) as Record<string, unknown>

describe("GET /api/v1/brand with no database", () => {
  it("serves 200, not 503", async () => {
    const res = await serve()
    expect(res.status).toBe(200)
    expect(res.headers["Access-Control-Allow-Origin"]).toBe("*")
  })

  it("reproduces the live apex response exactly", async () => {
    const res = await serve()
    // Deep equality over the entire document. A lost family, a lost field, a
    // changed hex, a reordered array — any of them fails here.
    expect(res.data).toEqual(baseline)
  })

  it("serves every top-level key the apex serves, and no extra", async () => {
    const res = await serve()
    expect(Object.keys(res.data).sort()).toEqual(Object.keys(baseline).sort())
  })
})

/**
 * All 21 colour families must be served, by name.
 *
 * The deep-equality spec above already covers this, but it covers it opaquely:
 * if someone regenerates the fixture to make a failure go away, these specs
 * still name what the API is required to carry. `/api/v1/brand` once shipped 7
 * of 21 — `getBrandSystem()` never queried heritage or experimental, and there
 * is no `brand_heritage` or `brand_experimental` view to query. This route is
 * what the MCP server reads, so `mzizi_get_tokens(family: "heritage")` errored
 * for every agent while the tool advertised `heritage` in its own schema.
 */
describe("GET /api/v1/brand colour families", () => {
  const HERITAGE = ["indigo", "savanna", "baobab", "sunset", "river", "hematite", "kalahari"]
  const EXPERIMENTAL = ["ember", "acacia", "fern", "lagoon", "storm", "dusk", "protea"]
  const MINERALS = ["cobalt", "tanzanite", "malachite", "gold", "terracotta", "sodalite", "copper"]

  it("serves seven minerals, seven heritage and seven experimental", async () => {
    const res = await serve()
    const families = res.data as Record<string, Array<Record<string, unknown>>>
    expect(families.minerals.map((m) => m.name)).toEqual(MINERALS)
    expect(families.heritage.map((h) => h.name)).toEqual(HERITAGE)
    expect(families.experimental.map((e) => e.name)).toEqual(EXPERIMENTAL)
  })

  it("gives every family a real hex in both themes", async () => {
    const res = await serve()
    const families = res.data as Record<string, Array<Record<string, unknown>>>
    const all = [...families.minerals, ...families.heritage, ...families.experimental]
    expect(all).toHaveLength(21)
    // A family present but hexless would satisfy a count assertion and still be
    // useless to the agent reading it.
    for (const row of all) {
      for (const key of ["hex", "lightHex", "darkHex"]) {
        expect(String(row[key]), `${row.name} ${key}`).toMatch(/^#[0-9a-fA-F]{6}$/)
      }
    }
  })

  it("carries the heptagon index on experimental tones", async () => {
    const res = await serve()
    const families = res.data as Record<string, Array<Record<string, unknown>>>
    expect(families.experimental.map((e) => e.heptagonIndex).sort()).toEqual([0, 1, 2, 3, 4, 5, 6])
  })

  /**
   * The one seam between the two disk sources. `mineralApiHex` lives in
   * `brand.source.ts` because nothing but this endpoint reads it, while the
   * rest of a mineral lives in `palette.source.ts`. Add an eighth mineral to
   * the palette and forget the hex and this fails by name — which is the whole
   * reason the split is allowed to exist.
   */
  it("keeps mineralApiHex in lockstep with the palette", () => {
    expect(Object.keys(mineralApiHex).sort()).toEqual(paletteMinerals.map((m) => m.name).sort())
    for (const [name, hex] of Object.entries(mineralApiHex)) {
      expect(String(hex), `${name} hex`).toMatch(/^#[0-9a-fA-F]{6}$/)
    }
  })
})

/**
 * Per-collection field coverage.
 *
 * The six collections that used to be database reads are now
 * `lib/tokens/brand.source.ts`. A hand-maintained file invites a well-meaning
 * tidy-up, and dropping a key there is invisible: `JSON.stringify` omits
 * `undefined` without complaint, so the field simply stops appearing in the
 * payload. These specs name the required keys per collection so the failure
 * says which field and which collection.
 */
describe("GET /api/v1/brand collection fields", () => {
  const REQUIRED: Record<string, string[]> = {
    minerals: [
      "name",
      "hex",
      "lightHex",
      "darkHex",
      "containerLight",
      "containerDark",
      "cssVar",
      "origin",
      "symbolism",
      "usage",
    ],
    ecosystem: ["name", "meaning", "language", "role", "description", "voice", "mineral", "url"],
    spacing: ["name", "px", "rem", "usage"],
    semanticColors: ["name", "light", "dark", "usage"],
    backgrounds: ["name", "light", "dark", "usage"],
    heritage: ["name", "hex", "lightHex", "darkHex", "cssVar", "origin", "symbolism", "usage"],
  }

  it("carries every required key on every row of every collection", async () => {
    const res = await serve()
    const data = res.data as Record<string, Array<Record<string, unknown>>>
    for (const [collection, keys] of Object.entries(REQUIRED)) {
      expect(data[collection], `${collection} missing`).toBeDefined()
      expect(data[collection].length, `${collection} is empty`).toBeGreaterThan(0)
      for (const row of data[collection]) {
        for (const key of keys) {
          expect(row[key], `${collection}.${String(row.name)}.${key}`).toBeDefined()
        }
      }
    }
  })

  it("serves the three font families and the full type scale", async () => {
    const res = await serve()
    const typography = res.data.typography as {
      fonts: Record<string, { family: string; usage: string; reason: string }>
      scale: Array<Record<string, unknown>>
    }
    expect(Object.keys(typography.fonts)).toEqual(["sans", "serif", "mono"])
    for (const [name, font] of Object.entries(typography.fonts)) {
      expect(font.family, `${name} family`).toBeTruthy()
      expect(font.usage, `${name} usage`).toBeTruthy()
      expect(font.reason, `${name} reason`).toBeTruthy()
    }
    expect(typography.scale.length).toBeGreaterThan(0)
    for (const step of typography.scale) {
      for (const key of ["name", "sizePx", "sizeRem", "lineHeight", "weight", "font", "usage"]) {
        expect(step[key], `scale.${String(step.name)}.${key}`).toBeDefined()
      }
    }
  })

  it("serves the meta blocks the brand page and the MCP read", async () => {
    const res = await serve()
    for (const key of [
      "version",
      "name",
      "lastUpdated",
      "homepage",
      "radii",
      "componentSpecs",
      "accessibility",
      "voiceAndTone",
      "philosophy",
    ]) {
      expect(res.data[key], `meta.${key}`).toBeDefined()
    }
    expect(Array.isArray(res.data.componentSpecs)).toBe(true)
  })
})
