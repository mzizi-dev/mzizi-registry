import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

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
 * `/api/v1/changelog` with no database.
 *
 * The route opened with `if (!isSupabaseConfigured()) return 503` and then read
 * the Supabase `releases` view. The release history is now
 * `content/changelog/releases.json`, inlined by `pnpm changelog:generate`.
 *
 * Every spec runs with Supabase stubbed empty, because that is the deployment
 * this has to work on — not as an edge case but as the only case.
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

type Served = { data: Record<string, unknown>; status: number }

async function serveIndex(): Promise<Served> {
  const { GET } = await import("@/app/api/v1/changelog/route")
  return (await GET()) as unknown as Served
}

async function serveVersion(version: string): Promise<Served> {
  const { GET } = await import("@/app/api/v1/changelog/[version]/route")
  return (await GET({} as Request, {
    params: Promise.resolve({ version }),
  })) as unknown as Served
}

/**
 * The live apex response, captured from `https://mzizi.dev/api/v1/changelog`
 * while the route still read Supabase. Committed so the comparison outlives the
 * database. It fails if a release or a field disappears — it compares the whole
 * document rather than sampling it.
 */
const baseline = JSON.parse(
  readFileSync(join(__dirname, "..", "..", "fixtures", "changelog-api-baseline.json"), "utf8")
) as { data: Array<Record<string, unknown>> }

describe("GET /api/v1/changelog with no database", () => {
  it("serves 200, not 503", async () => {
    expect((await serveIndex()).status).toBe(200)
  })

  it("reproduces the live apex response exactly", async () => {
    const res = await serveIndex()
    expect(res.data.data).toEqual(baseline.data)
    expect(res.data.meta).toEqual({ total: baseline.data.length })
  })

  it("serves every release, in the committed order", async () => {
    const res = await serveIndex()
    const served = res.data.data as Array<Record<string, unknown>>
    expect(served).toHaveLength(baseline.data.length)
    expect(served.map((r) => r.version)).toEqual(baseline.data.map((r) => r.version))
  })

  /**
   * `entry_order` is repo bookkeeping — it records the order entries sharing a
   * version are served in, which Postgres answered from physical row order.
   * It must never reach the payload: the `releases` view projected 27 fields
   * and this endpoint served exactly those.
   */
  it("does not leak entry_order into the payload", async () => {
    const res = await serveIndex()
    for (const row of res.data.data as Array<Record<string, unknown>>) {
      expect(Object.keys(row)).not.toContain("entry_order")
    }
  })

  it("carries every field on every release", async () => {
    const res = await serveIndex()
    const expected = Object.keys(baseline.data[0]).sort()
    for (const row of res.data.data as Array<Record<string, unknown>>) {
      expect(Object.keys(row).sort(), `release ${String(row.version)}`).toEqual(expected)
    }
  })
})

describe("GET /api/v1/changelog/[version] with no database", () => {
  it("serves 200 for a version that exists", async () => {
    expect((await serveVersion("1.0.0")).status).toBe(200)
  })

  it("still 404s for a version that does not", async () => {
    const res = await serveVersion("99.99.99")
    expect(res.status).toBe(404)
  })

  /**
   * Eight versions carry two or three entries. `.single()` used to turn those
   * into 404s, so this is the regression that route exists to prevent — and the
   * disk-backed read has its own way to lose them.
   */
  it("serves every entry for a version that has several", async () => {
    const res = await serveVersion("4.0.31")
    expect((res.data.data as unknown[]).length).toBe(3)
  })

  /**
   * Ordering within a version is `created_at` ascending, NULLS LAST, then the
   * recorded `entry_order`. 4.1.0 is the case that proves the null branch: it
   * pairs a dated entry with an undated one, and treating null as the empty
   * string puts them the wrong way round.
   */
  it("puts undated entries last, matching the query it replaced", async () => {
    const res = await serveVersion("4.1.0")
    const entries = res.data.data as Array<Record<string, unknown>>
    expect(entries).toHaveLength(2)
    expect(entries[0].created_at).not.toBeNull()
    expect(entries[1].created_at).toBeNull()
  })

  it("projects the changelog column set, not the wider releases one", async () => {
    const res = await serveVersion("1.0.0")
    const entry = (res.data.data as Array<Record<string, unknown>>)[0]
    // The `releases` VIEW added these seven on top of the `changelog` TABLE.
    // This endpoint served the table; serving them here would be a payload
    // change to a route that was never broken.
    for (const viewOnly of [
      "line",
      "line_rank",
      "major",
      "minor",
      "patch",
      "release_kind",
      "components_touched",
    ]) {
      expect(Object.keys(entry), `${viewOnly} is view-only`).not.toContain(viewOnly)
    }
    expect(Object.keys(entry)).toContain("version")
    expect(Object.keys(entry)).toContain("total_stable")
  })
})

/**
 * The seed is a committed record, and the standing objection to a committed
 * record is that it goes stale on the next release and nobody notices. This is
 * the noticing. `scripts/generate-changelog.mjs` enforces the same rule at
 * generate time; asserting it here as well means a stale seed fails the test
 * run, not only the generator step.
 */
describe("the release record stays current", () => {
  it("has the version package.json claims at its head", async () => {
    const { CHANGELOG_RELEASES } = await import("@/lib/changelog.generated")
    const pkg = JSON.parse(
      readFileSync(join(__dirname, "..", "..", "..", "package.json"), "utf8")
    ) as { version: string }
    expect(CHANGELOG_RELEASES[0].version).toBe(pkg.version)
  })
})
