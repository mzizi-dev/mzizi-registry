import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { parse } from "yaml"

/**
 * Releases are classified, and the changelog is ordered across two version eras.
 *
 * Three live defects motivated this, all of which left every gate green:
 *
 *   1. `getChangelogEntries` ordered `changelog` by `released_at DESC`. Ten of
 *      64 rows have no `released_at`, Postgres sorts NULLS FIRST on DESC, so
 *      the changelog opened with 4.1.8 / 4.1.1 / 4.1.2 / 4.1.0 in arbitrary
 *      order and the current release, 1.0.0, sat at position eleven.
 *   2. `getLatestVersion` used the same ordering and returned **4.1.8**.
 *   3. `getChangelogByVersion` used `.single()`. PostgREST answers PGRST116 for
 *      "more than one row" as well as "no rows", and eight versions carry two
 *      or three entries, so `/api/v1/changelog/4.0.31` answered 404 for a
 *      release present three times.
 *
 * Sorting by semver instead of by date fixes none of it — it puts 4.2.0 above
 * 1.0.0, and the version line was deliberately reset (§14). The fix is a
 * `releases` view carrying `line`, so these assertions pin the code to reading
 * that view rather than re-deriving an order.
 */

const root = resolve(__dirname, "../../..")
const db = readFileSync(resolve(root, "lib/db/index.ts"), "utf8")
const types = readFileSync(resolve(root, "lib/db/types.ts"), "utf8")
const spec = parse(readFileSync(resolve(root, "openapi.yaml"), "utf8"))

/** The body of a named exported function in lib/db, up to the next export. */
function fnBody(name: string): string {
  const at = db.indexOf(`export async function ${name}`)
  expect(at, `${name} must exist in lib/db`).toBeGreaterThan(-1)
  const next = db.indexOf("\nexport ", at + 1)
  return db.slice(at, next === -1 ? db.length : next)
}

describe("changelog ordering", () => {
  it("getChangelogEntries reads the pre-sorted releases view", () => {
    const body = fnBody("getChangelogEntries")
    expect(body).toMatch(/\.from\((["'`])releases\1\)/)
  })

  it("getChangelogEntries does not re-order by released_at", () => {
    // The view is sorted by (line_rank, major, minor, patch). A `.order()` here
    // would silently override that and restore the NULLS-FIRST bug.
    expect(fnBody("getChangelogEntries")).not.toMatch(/\.order\(/)
  })

  it("getLatestVersion reads the releases view, not released_at", () => {
    const body = fnBody("getLatestVersion")
    expect(body).toMatch(/\.from\((["'`])releases\1\)/)
    expect(body).not.toMatch(/released_at/)
  })
})

describe("a version may carry several entries", () => {
  it("getChangelogByVersion returns an array", () => {
    expect(db).toMatch(/getChangelogByVersion\([^)]*\): Promise<ChangelogRow\[\]>/)
  })

  it("getChangelogByVersion does not use .single()", () => {
    // `.single()` is what turned "three entries" into 404 on eight releases.
    expect(fnBody("getChangelogByVersion")).not.toMatch(/\.single\(\)/)
  })
})

describe("the classification is typed and specified", () => {
  it("ChangelogRow carries line and release_kind", () => {
    const row = /export interface ChangelogRow \{([\s\S]*?)\n\}/.exec(types)
    expect(row).not.toBeNull()
    expect(row![1]).toMatch(/\bline\?:/)
    expect(row![1]).toMatch(/\brelease_kind\?:/)
  })

  it("ComponentVersionRow carries entity_kind, change_kind and release", () => {
    const row = /export interface ComponentVersionRow \{([\s\S]*?)\n\}/.exec(types)
    expect(row).not.toBeNull()
    for (const field of ["entity_kind", "change_kind", "release"]) {
      expect(row![1]).toMatch(new RegExp(`\\b${field}:`))
    }
  })

  it("component_name is non-nullable — it used to be null on 1,034 rows", () => {
    const row = /export interface ComponentVersionRow \{([\s\S]*?)\n\}/.exec(types)
    expect(row![1]).toMatch(/component_name:\s*string(?!\s*\|\s*null)/)
  })

  it("the OpenAPI ChangelogEntry schema declares the classification", () => {
    const props = spec.components.schemas.ChangelogEntry.properties
    expect(Object.keys(props)).toEqual(
      expect.arrayContaining(["line", "release_kind", "components_touched"])
    )
    expect(props.line.enum).toEqual(expect.arrayContaining(["public", "pre-1.0"]))
  })

  it("the spec describes /changelog as returning data, matching the route", () => {
    // It said `releases` while the route served `data` — a contract nobody could
    // satisfy by reading the spec.
    const ok = spec.paths["/changelog"].get.responses["200"].content["application/json"].schema
    expect(Object.keys(ok.properties)).toContain("data")
  })
})
