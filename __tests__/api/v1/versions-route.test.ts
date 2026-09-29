import { describe, it, expect, vi } from "vitest"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

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
 * `/api/v1/ui/{name}/versions` answers exactly what production answered.
 *
 * Version history is machine-written data in Supabase (`component_versions`),
 * and the registry holds no database — the Mzizi console is the only thing that
 * talks to Supabase. The route was gated on credentials the registry Worker never
 * had, so production served `503 {"error":"Database not configured"}`; it still
 * does, byte for byte, which is what keeps the api-gateway parity run green.
 *
 * This file used to guard the query's column list, because the `component_versions`
 * view projected a stale `source_code` column and `select("*")` served it publicly.
 * The query is gone, so the stronger guarantee is asserted instead: `lib/db`
 * cannot read that view at all.
 */

type Resp = { data: { error?: string }; status: number; headers: Record<string, string> }

const root = resolve(__dirname, "../../..")
const dbSource = readFileSync(resolve(root, "lib/db/index.ts"), "utf8")
const typesSource = readFileSync(resolve(root, "lib/db/types.ts"), "utf8")

describe("/api/v1/ui/[name]/versions", () => {
  it("answers 503 Database not configured, as production did", async () => {
    const { GET } = await import("@/app/api/v1/ui/[name]/versions/route")
    const r = (await GET(new Request("https://mzizi.dev/api/v1/ui/button/versions"), {
      params: Promise.resolve({ name: "button" }),
    })) as unknown as Resp
    expect(r.status).toBe(503)
    expect(r.data).toEqual({ error: "Database not configured" })
    expect(r.headers).toEqual({ "Access-Control-Allow-Origin": "*" })
  })

  it("lib/db no longer queries component_versions", () => {
    expect(dbSource).not.toMatch(/\.from\((["'`])component_versions\1\)/)
    expect(dbSource).not.toMatch(/export\s+async\s+function\s+getComponentVersions?\b/)
  })

  it("keeps source_code off the row type", () => {
    const row = /export interface ComponentVersionRow \{([\s\S]*?)\n\}/.exec(typesSource)
    expect(row, "ComponentVersionRow must exist").not.toBeNull()
    expect(row![1]).not.toMatch(/\bsource_code\b/)

    const insert = /export interface ComponentVersionInsert \{([\s\S]*?)\n\}/.exec(typesSource)
    expect(insert, "ComponentVersionInsert must exist").not.toBeNull()
    expect(insert![1]).not.toMatch(/\bsource_code\b/)
  })
})
