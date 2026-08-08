import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

/**
 * `/api/v1/ui/{name}/versions` must never serve component source.
 *
 * The `component_versions` VIEW unnests each archived version and projects its
 * `sourceCode` key as a `source_code` column. `getComponentVersions` used
 * `select("*")`, so that column was served — publicly, and stale: `button` came
 * back at 3,637 characters against 3,921 on disk. Component source has exactly
 * one home, which is `components/registry/n<N>-<label>/` in git (§8.3), and a
 * second copy that drifts is precisely what the extraction removed.
 *
 * These assertions are source-level rather than response-level on purpose. The
 * route needs a live Supabase to answer, so a response test would be skipped in
 * CI — which is where a regression would actually land. What can be checked
 * offline is that the query names its columns and that `source_code` is not one
 * of them, and that is the property that has to hold.
 */

const root = resolve(__dirname, "../../..")
const dbSource = readFileSync(resolve(root, "lib/db/index.ts"), "utf8")
const typesSource = readFileSync(resolve(root, "lib/db/types.ts"), "utf8")

/** The `.from("component_versions")` query bodies, up to the closing paren. */
function versionQueries(): string[] {
  const out: string[] = []
  const marker = '.from("component_versions")'
  let at = dbSource.indexOf(marker)
  while (at !== -1) {
    out.push(dbSource.slice(at, at + 400))
    at = dbSource.indexOf(marker, at + marker.length)
  }
  return out
}

describe("/api/v1/ui/[name]/versions — no component source", () => {
  it("queries component_versions in at least two places", () => {
    // getComponentVersions + getComponentVersion. If this drops to zero the
    // rest of the suite would vacuously pass.
    expect(versionQueries().length).toBeGreaterThanOrEqual(2)
  })

  it("never selects * from component_versions", () => {
    for (const query of versionQueries()) {
      expect(query).not.toMatch(/\.select\(\s*["'`]\*["'`]\s*\)/)
    }
  })

  it("selects an explicit column list", () => {
    for (const query of versionQueries()) {
      expect(query).toMatch(/\.select\(VERSION_COLUMNS\)/)
    }
  })

  it("omits source_code from the served column list", () => {
    const list = /const VERSION_COLUMNS = \[([\s\S]*?)\]/.exec(dbSource)
    expect(list, "VERSION_COLUMNS must exist").not.toBeNull()
    const columns = [...list![1].matchAll(/"([^"]+)"/g)].map((m) => m[1])

    expect(columns).not.toContain("source_code")
    expect(columns).not.toContain("sourceCode")
    // A guard that only rejects the exact name would pass on an empty list.
    expect(columns).toContain("component_name")
    expect(columns).toContain("version")
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
