#!/usr/bin/env node
/**
 * Generate the API Worker's route table from `app/api/**\/route.ts`.
 *
 * `mzizi-api` does not reimplement the API. It imports the SAME route modules
 * the Next app serves, so there is exactly one copy of every handler. What this
 * generator produces is the thing Next derives from the filesystem and a
 * standalone Worker cannot: the mapping from a URL to a module.
 *
 * Written as a generated artifact with a `--check` mode — the pattern already
 * used for skills, doctrine and the registry — because the alternative is a
 * hand-maintained list that silently omits a new route. A route present in the
 * app and absent from the Worker would 404 in production while every test
 * passed, which is the worst-shaped failure available here.
 *
 * Usage:
 *   node scripts/generate-api-routes.mjs           write the artifact
 *   node scripts/generate-api-routes.mjs --check   fail if it is out of date
 */

import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs"
import { join, relative, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import prettier from "prettier"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")
const API_DIR = join(ROOT, "app", "api")
const OUT = join(ROOT, "mzizi-api", "src", "routes.generated.ts")

/** Every HTTP method Next recognises as a route export. */
const METHODS = ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]

/**
 * Format through prettier rather than imitating it.
 *
 * The committed artifact is compared byte-for-byte by `--check`, and the repo
 * also runs `prettier --check` over the tree — so if this emitted anything
 * prettier would rewrite, the two gates could never be green at the same time.
 * That is not hypothetical: the first version of this generator wrote
 * `["GET","OPTIONS"]`, prettier's pre-commit hook rewrote it to
 * `["GET", "OPTIONS"]`, and CI then reported the artifact as out of date with
 * a source that had not changed.
 *
 * Asking prettier is the fix rather than matching its output by hand, because
 * a template that imitates the formatter re-breaks the moment its config
 * changes. Same reasoning as `scripts/sync-tokens.ts` (#262).
 */
async function prettified(filePath, source) {
  const config = await prettier.resolveConfig(filePath)
  return prettier.format(source, { ...config, filepath: filePath })
}

function walk(dir, acc = []) {
  for (const entry of readdirSync(dir).sort()) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, acc)
    else if (entry === "route.ts") acc.push(full)
  }
  return acc
}

/**
 * `app/api/v1/skills/[name]/route.ts` → `/api/v1/skills/:name`.
 *
 * Catch-all (`[...slug]`) and optional catch-all segments are NOT handled, and
 * that is deliberate rather than an omission: no route uses them today, and a
 * silently-wrong pattern is worse than a build failure. If one is ever added,
 * this throws and whoever added it decides what the Worker should do.
 */
function toPattern(file) {
  const rel = relative(API_DIR, dirname(file)).split("/").filter(Boolean)
  const segments = rel.map((seg) => {
    if (seg.startsWith("[...") || seg.startsWith("[[")) {
      throw new Error(
        `Catch-all route segment "${seg}" in ${relative(ROOT, file)} is not supported by the ` +
          `API Worker router. Add support in mzizi-api/src/router.ts before adding the route.`
      )
    }
    return seg.startsWith("[") && seg.endsWith("]") ? `:${seg.slice(1, -1)}` : seg
  })
  return "/api" + (segments.length ? "/" + segments.join("/") : "")
}

function methodsOf(source) {
  return METHODS.filter((m) =>
    new RegExp(`export\\s+(async\\s+)?function\\s+${m}\\s*\\(`).test(source)
  )
}

const files = walk(API_DIR)
const routes = files.map((file) => {
  const source = readFileSync(file, "utf8")
  const methods = methodsOf(source)
  if (methods.length === 0) {
    throw new Error(`${relative(ROOT, file)} exports no HTTP method handler.`)
  }
  return {
    pattern: toPattern(file),
    // Import specifier relative to `mzizi-api/src/`. The `@/` alias is not used
    // here: this file is bundled by wrangler, and a relative path resolves the
    // same way under every tool that might read it.
    module: "../../" + relative(ROOT, file).replace(/\.ts$/, ""),
    methods,
  }
})

// Sort by specificity, then alphabetically. The router takes the FIRST match,
// so a literal segment must be tried before a parameter that would also match
// it — `/api/v1/skills/summary` must not be captured by `/api/v1/skills/:name`.
// Doing this at generation time means the router stays a simple linear scan and
// the ordering is visible in the committed artifact rather than implied by it.
function specificity(pattern) {
  return pattern
    .split("/")
    .filter(Boolean)
    .map((s) => (s.startsWith(":") ? "1" : "0"))
    .join("")
}
routes.sort((a, b) => {
  const depth = b.pattern.split("/").length - a.pattern.split("/").length
  if (depth !== 0) return depth
  const spec = specificity(a.pattern).localeCompare(specificity(b.pattern))
  if (spec !== 0) return spec
  return a.pattern.localeCompare(b.pattern)
})

const header = `// GENERATED by scripts/generate-api-routes.mjs — do not edit.
//
// The route table for the standalone API Worker. Each entry points at the SAME
// module \`app/api/**/route.ts\` that the Next app serves, so there is one copy
// of every handler and no possibility of the two surfaces disagreeing.
//
// Regenerate with \`pnpm api:routes\`. CI runs \`pnpm api:routes:check\`, which
// fails if a route was added to the app without appearing here.

import type { RouteModule } from "./router"

export type GeneratedRoute = {
  /** URL pattern, \`:name\` for a dynamic segment. */
  readonly pattern: string
  /** HTTP methods the module exports. */
  readonly methods: readonly string[]
  /** Loads the route module. */
  readonly load: () => Promise<RouteModule>
}

/** ${routes.length} routes, ordered so a literal segment is matched before a parameter. */
export const ROUTES: readonly GeneratedRoute[] = [
`

const body = routes
  .map(
    (r) =>
      `  {\n    pattern: ${JSON.stringify(r.pattern)},\n` +
      `    methods: ${JSON.stringify(r.methods)},\n` +
      `    load: () => import(${JSON.stringify(r.module)}),\n  },`
  )
  .join("\n")

const output = await prettified(OUT, `${header}${body}\n]\n`)

if (process.argv.includes("--check")) {
  let current = ""
  try {
    current = readFileSync(OUT, "utf8")
  } catch {
    console.error("✗ mzizi-api/src/routes.generated.ts is missing. Run `pnpm api:routes`.")
    process.exit(1)
  }
  if (current !== output) {
    console.error(
      "✗ mzizi-api/src/routes.generated.ts is out of date with app/api/. Run `pnpm api:routes`."
    )
    process.exit(1)
  }
  console.log(`✓ API route table in sync — ${routes.length} routes`)
} else {
  writeFileSync(OUT, output)
  console.log(`✓ wrote ${relative(ROOT, OUT)} — ${routes.length} routes`)
}
