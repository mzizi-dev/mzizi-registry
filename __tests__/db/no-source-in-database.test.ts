import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

/**
 * Component source lives on disk in git (§8.3) and NOWHERE in Supabase.
 *
 * It took five separate removals to get there, because each one only cleared
 * the shape someone happened to look at:
 *
 *   1. `components.source_code`               — the original column
 *   2. `component_versions.source_code`       — the view projected it, and
 *                                               `select("*")` served ~10 MB of
 *                                               stale source publicly
 *   3. `versions[].sourceCode`                — 2,728 archive entries
 *   4. `versions[].snapshot.source_code`      —   576 entries
 *   5. `versions[].snapshot.versions[].sourceCode` — 556, one level deeper and
 *                                               invisible to a structural check
 *                                               that only read top-level keys
 *
 * Plus two orphaned snapshot TABLES (`components_store`,
 * `component_versions_store`) that nothing read and anon could SELECT.
 *
 * These assertions are source-level rather than live queries, deliberately: a
 * test that needs credentials is skipped in CI, which is exactly where the
 * regression would land. What can be checked offline is that no query in
 * `lib/db` asks for a source column and that no `select("*")` reaches a
 * component-bearing relation — those are the two mechanisms that produced
 * every leak above.
 */

const root = resolve(__dirname, "../..")
const db = readFileSync(resolve(root, "lib/db/index.ts"), "utf8")

/** Relations that carry component metadata, where `*` would be dangerous. */
const COMPONENT_RELATIONS = ["components", "component_versions", "component_documents"]

describe("no component source is read from the database", () => {
  it("lib/db never selects a source column", () => {
    // Comments explaining the removal are expected and fine; a `.select()`
    // naming it is not.
    const selects = [...db.matchAll(/\.select\((["'`])([\s\S]*?)\1\)/g)].map((m) => m[2])
    for (const columns of selects) {
      expect(columns, `select("${columns}") must not request source`).not.toMatch(
        /\bsource_code\b|\bsourceCode\b/
      )
    }
  })

  it("no select(*) against a component-bearing relation", () => {
    // `select("*")` is how the versions leak happened: the view gained a
    // source_code column and the query silently started serving it.
    for (const relation of COMPONENT_RELATIONS) {
      const pattern = new RegExp(
        `\\.from\\((["'\`])${relation}\\1\\)[\\s\\S]{0,200}?\\.select\\((["'\`])\\*\\2\\)`,
        "g"
      )
      const hits = [...db.matchAll(pattern)]
      expect(hits.length, `.from("${relation}") must not be followed by .select("*")`).toBe(0)
    }
  })

  it("getDesignTokens is gone rather than repointed", () => {
    // It parsed `components.source_code` into a token object — a third copy of
    // the palette that `pnpm tokens:sync` already generates (§8.4.1).
    expect(db).not.toMatch(/export\s+(async\s+)?function\s+getDesignTokens/)
  })

  it("the version row type carries no source field", () => {
    const types = readFileSync(resolve(root, "lib/db/types.ts"), "utf8")
    const row = /export interface ComponentVersionRow \{([\s\S]*?)\n\}/.exec(types)
    expect(row).not.toBeNull()
    expect(row![1]).not.toMatch(/\bsource_code\b|\bsourceCode\b/)
  })
})
