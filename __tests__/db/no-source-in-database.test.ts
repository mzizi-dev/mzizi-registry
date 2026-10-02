import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs"
import { join, resolve, relative } from "node:path"

/**
 * The registry holds no database. Nothing in the app may reach Supabase.
 *
 * Component source lives on disk in git (§8.3), and it took five separate
 * removals to get it out of Supabase, because each only cleared the shape
 * someone happened to look at (`components.source_code`, the
 * `component_versions` view's projection of it, and three nested archive keys).
 * The owner's final ruling closes the class rather than the instance: the Mzizi
 * console (mzizi-dev/mzizi-console) is the only thing in the estate that talks
 * to Supabase, and this repo holds no client, no credentials and no query.
 *
 * These are source-level assertions on purpose — a test that needs credentials
 * is skipped in CI, which is exactly where a regression would land.
 */

const root = resolve(__dirname, "../..")
const db = readFileSync(resolve(root, "lib/db/index.ts"), "utf8")

/**
 * This repo's own code — the readers mzizi-api-gateway bundles, the scripts that
 * generate and check the registry, and the two Workers deployed from here.
 */
const APP_DIRS = ["lib", "hooks", "components", "scripts", "mzizi-ui", "mzizi-plus"]

/**
 * Registry items are distributed content, not app code: `mzizi-docs-api.ts` is a
 * published N10 item that runs as a consumer's own Supabase edge function, and
 * serving it unchanged is part of the file-backed registry.
 */
const DISTRIBUTED = [join("components", "registry")]

function sourceFiles(dir: string): string[] {
  const abs = join(root, dir)
  if (!existsSync(abs)) return []
  const out: string[] = []
  for (const entry of readdirSync(abs)) {
    if (entry === "node_modules" || entry.startsWith(".")) continue
    const full = join(abs, entry)
    const rel = relative(root, full)
    if (DISTRIBUTED.some((d) => rel === d || rel.startsWith(d + "/"))) continue
    if (statSync(full).isDirectory()) out.push(...sourceFiles(rel))
    else if (/\.(ts|tsx|mts|mjs|js)$/.test(entry) && !/\.generated\./.test(entry)) out.push(rel)
  }
  return out
}

describe("no Supabase in the registry", () => {
  const files = APP_DIRS.flatMap(sourceFiles)

  it("finds the app's source files (guards against a vacuous pass)", () => {
    expect(files.length).toBeGreaterThan(50)
    expect(files).toContain(join("lib", "db", "index.ts"))
  })

  it("no app file imports a Supabase client", () => {
    const offenders = files.filter((f) =>
      /from\s+["'](?:jsr:|npm:)?@supabase\//.test(readFileSync(join(root, f), "utf8"))
    )
    expect(offenders).toEqual([])
  })

  it("no app file reads a Supabase environment variable", () => {
    const offenders = files.filter((f) =>
      /process\.env\.(?:NEXT_PUBLIC_)?SUPABASE_/.test(readFileSync(join(root, f), "utf8"))
    )
    expect(offenders).toEqual([])
  })

  it("package.json depends on no @supabase package", () => {
    const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"))
    const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })
    expect(deps.filter((d) => d.startsWith("@supabase/"))).toEqual([])
  })

  it("lib/db runs no query at all", () => {
    expect(db).not.toMatch(/\.from\((["'`])[a-z_]+\1\)/)
    expect(db).not.toMatch(/\.rpc\(/)
    expect(db).not.toMatch(/\bcreateClient\b/)
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
