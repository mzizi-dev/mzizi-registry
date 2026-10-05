/**
 * The Astro target: what `GET /v1/astro/{name}` serves and `mzizi add --target astro`
 * installs (mzizi-registry#397).
 *
 * A component's Astro implementation is the `<name>.astro` file beside its `.tsx` (and
 * `.rs`), one component, one contract, several targets. Pure Astro: no React or other
 * framework under it, zero client JavaScript unless its contract allows one enhancement
 * script. Registry `.astro` files, and the framework-free `.ts` modules they use
 * (`ui-utils`, `ui-variants`, `app-nav`, `server-*`, …), import each other FLAT, the way
 * an installer puts them into one directory: `./button.astro`, `./ui-utils`,
 * `./server-cookies.js`. A brand asset (`components/registry/assets/`) is imported as
 * `./assets/<file>` and installs beside the component in `assets/`.
 *
 * So the document for a name is derived from its source, never restated in
 * `registry.json`: its flat imports are its `registryDependencies` (absolute
 * `/v1/astro/` URLs, never bare names), its bare imports its npm `dependencies`, and its
 * `./assets/` imports ship as base64 files beside it.
 *
 * mzizi-dev/mzizi-api-gateway bundles this module at its pinned registry commit.
 */
import ASSETS from "./registry-assets.generated.json"
import { componentTargets, readComponentSourceFor } from "./registry-source"

/** Where `mzizi add --target astro` installs every file, relative to the project root. */
export const ASTRO_INSTALL_DIR = "src/components/mzizi"

/** The origin and prefix of the Astro route, as `registryDependencies` are written. */
export const ASTRO_ROUTE = "https://api.mzizi.dev/v1/astro"

export interface AstroFile {
  /** Where the file lives in this registry. */
  path: string
  type: "registry:astro" | "registry:lib" | "registry:asset"
  /** Where it installs, relative to the project root. */
  target: string
  content: string
  /** Set on binary assets: `content` is base64. */
  encoding?: "base64"
}

export interface AstroDocument {
  $schema: string
  name: string
  type: "registry:astro" | "registry:lib"
  target: "astro"
  dependencies: string[]
  registryDependencies: string[]
  files: AstroFile[]
}

const FLAT = /^\.\/([a-z0-9]+(?:-[a-z0-9]+)*)(?:\.astro|\.js|\.ts)?$/
const ASSET = /^\.\/assets\/([A-Za-z0-9._-]+)$/
const SPECIFIERS = /(?:\bfrom\s*|\bimport\s*\(?\s*)["']([^"']+)["']/g

/** Every import specifier in a source file, in order, once each. */
export function importSpecifiers(source: string): string[] {
  return [...new Set([...source.matchAll(SPECIFIERS)].map((m) => m[1] ?? ""))]
}

/** The npm package a bare specifier names (`@scope/pkg/sub` → `@scope/pkg`). */
function packageOf(spec: string): string {
  const parts = spec.split("/")
  return spec.startsWith("@") ? parts.slice(0, 2).join("/") : (parts[0] ?? spec)
}

/**
 * A `.ts` module the Astro target may install: framework-free, so no JSX, no React, no
 * "use client", and no `@/` alias import (which only resolves in a shadcn project).
 */
function isFrameworkFree(source: string): boolean {
  if (/^\s*["']use client["']/m.test(source)) return false
  return importSpecifiers(source).every(
    (s) => !s.startsWith("@/") && !/^(react|react-dom|next|preact|vue|svelte)(\/|$)/.test(s)
  )
}

/**
 * The source the Astro target serves for a name, and its kind, or null.
 *
 * A `.ts` qualifies only when it is framework-free AND every flat import it makes
 * qualifies too, so a served document's closure always installs: `mzizi-otel.ts` is
 * framework-free, but it imports a React-only module, so it is not an Astro module.
 */
export function astroSource(
  name: string,
  seen: Set<string> = new Set()
): { ext: "astro" | "ts"; source: string } | null {
  const astro = readComponentSourceFor(name, "astro")
  if (astro !== null) return { ext: "astro", source: astro }
  const ts = readComponentSourceFor(name, "ts")
  if (ts === null || !isFrameworkFree(ts)) return null
  seen.add(name)
  for (const spec of importSpecifiers(ts)) {
    if (!spec.startsWith(".")) continue
    const flat = FLAT.exec(spec)
    if (!flat) return null
    const dep = flat[1] ?? ""
    if (!seen.has(dep) && astroSource(dep, seen) === null) return null
  }
  return { ext: "ts", source: ts }
}

/** True when `/v1/astro/{name}` answers 200. */
export function hasAstro(name: string): boolean {
  return astroSource(name) !== null
}

/**
 * The registry document for `/v1/astro/{name}`, or null when the name has no Astro
 * implementation (the route's 404). Throws when the source imports a flat name that has
 * no Astro implementation or an asset that is not in the tree: that is a registry defect
 * the build must catch, not something to serve.
 */
export function astroDocument(name: string): AstroDocument | null {
  const found = astroSource(name)
  if (!found) return null
  const targets = componentTargets(name)
  const path = `components/registry/${targets[found.ext]}`
  const files: AstroFile[] = [
    {
      path,
      type: found.ext === "astro" ? "registry:astro" : "registry:lib",
      target: `${ASTRO_INSTALL_DIR}/${name}.${found.ext}`,
      content: found.source,
    },
  ]
  const deps = new Set<string>()
  const registryDeps: string[] = []
  for (const spec of importSpecifiers(found.source)) {
    const asset = ASSET.exec(spec)
    if (asset) {
      const key = `assets/${asset[1]}`
      const content = (ASSETS as Record<string, string>)[key]
      if (content === undefined) throw new Error(`${name}: imports ${spec}, which is not at components/registry/${key}`)
      files.push({
        path: `components/registry/${key}`,
        type: "registry:asset",
        target: `${ASTRO_INSTALL_DIR}/assets/${asset[1]}`,
        content,
        encoding: "base64",
      })
      continue
    }
    const flat = FLAT.exec(spec)
    if (flat) {
      const dep = flat[1] ?? ""
      if (!hasAstro(dep)) throw new Error(`${name}: imports ${spec}, and "${dep}" has no Astro implementation`)
      const url = `${ASTRO_ROUTE}/${dep}`
      if (!registryDeps.includes(url)) registryDeps.push(url)
      continue
    }
    if (spec.startsWith(".") || spec.startsWith("/")) {
      throw new Error(`${name}: ${spec} is not a flat registry import (./<name>, ./<name>.astro or ./assets/<file>)`)
    }
    const pkg = packageOf(spec)
    if (pkg !== "astro") deps.add(pkg)
  }
  return {
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    name,
    type: found.ext === "astro" ? "registry:astro" : "registry:lib",
    target: "astro",
    dependencies: [...deps].sort(),
    registryDependencies: registryDeps,
    files,
  }
}
