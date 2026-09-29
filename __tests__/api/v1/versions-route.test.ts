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
 * `/api/v1/ui/{name}/versions` answers 503, and says why.
 *
 * Version history is machine-written data owned by the Mzizi console, and the
 * registry holds no database. The body is the one api.mzizi.dev serves: it names
 * the console as the owner, where `{"error":"Database not configured"}` implied a
 * database waiting for a credential.
 *
 * This file used to guard the query's column list, because the `component_versions`
 * view projected a stale `source_code` column and `select("*")` served it publicly.
 * The query is gone, so the stronger guarantee is asserted instead: `lib/db`
 * cannot read that view at all.
 */

type Resp = {
  data: { error?: string; message?: string }
  status: number
  headers: Record<string, string>
}

const root = resolve(__dirname, "../../..")
const dbSource = readFileSync(resolve(root, "lib/db/index.ts"), "utf8")
const typesSource = readFileSync(resolve(root, "lib/db/types.ts"), "utf8")

describe("/api/v1/ui/[name]/versions", () => {
  it("answers 503, naming the console as the owner of version history", async () => {
    const { GET } = await import("@/app/api/v1/ui/[name]/versions/route")
    const r = (await GET(new Request("https://mzizi.dev/api/v1/ui/button/versions"), {
      params: Promise.resolve({ name: "button" }),
    })) as unknown as Resp
    expect(r.status).toBe(503)
    expect(r.data.error).toBe("Version history is not served by this API")
    expect(r.data.message).toContain("Mzizi console")
    expect(r.data.message).not.toContain("Database not configured")
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
