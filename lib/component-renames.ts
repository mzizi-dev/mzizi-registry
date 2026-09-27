/**
 * Registry items that were renamed, old name → new name.
 *
 * WHY THIS EXISTS. On 2026-09-27 every `nyuchi-*` component became `mzizi-*`
 * (Mzizi owns the registry; Nyuchi is the operator). The old names are baked
 * into links, docs, `components.json` files and `npx shadcn add` commands that
 * this repo does not control, so they must keep resolving. The map lives in
 * `component-renames.json` so `next.config.mjs` (plain ESM, no TS loader) can
 * read the same data the TypeScript surfaces do — one list, no drift.
 *
 * Three consumers:
 *   - `next.config.mjs` 308-redirects every old public URL form (pages, API v1
 *     item routes, on both `/api/v1/*` and the `/v1/*` shape `api.mzizi.dev`
 *     serves) to the new slug.
 *   - `mzizi-api/src/router.ts` does the same for the standalone API Worker.
 *   - `lib/registry.ts` `readComponent` resolves an old name to the renamed item,
 *     so non-HTTP lookups (the MCP `get_component` tool) keep answering.
 *
 * Entries are never removed: a redirect that stops working is a broken link.
 */

import renames from "./component-renames.json"

export const COMPONENT_RENAMES: Readonly<Record<string, string>> = renames

/** The current name for a renamed component, or `undefined` if `name` was never renamed. */
export function renamedComponent(name: string): string | undefined {
  return Object.prototype.hasOwnProperty.call(COMPONENT_RENAMES, name)
    ? COMPONENT_RENAMES[name]
    : undefined
}

/**
 * Every name a component has been known by, current first: `mzizi-footer` →
 * `["mzizi-footer", "nyuchi-footer"]`. Database rows keyed by component name
 * (`component_versions`) are read under all of them, so a deploy does not depend
 * on the forward data migration having run first — and history recorded under
 * the old name stays visible after it has.
 */
export function componentNameHistory(name: string): string[] {
  const current = renamedComponent(name) ?? name
  const previous = Object.keys(COMPONENT_RENAMES).filter((old) => COMPONENT_RENAMES[old] === current)
  return [current, ...previous]
}

/**
 * Path prefixes whose next segment is a registry item name. Kept in step with
 * `COMPONENT_PATH_PREFIXES` in `next.config.mjs`.
 */
export const COMPONENT_PATH_PREFIXES = [
  "/components",
  "/source",
  "/playground",
  "/changelog",
  "/api/v1/ui",
  "/api/v1/rs",
  "/api/health",
  "/api/chaos",
  "/v1/ui",
  "/v1/rs",
] as const

/**
 * If `pathname` addresses a renamed component (`/v1/ui/nyuchi-footer/docs`),
 * the same path with the new name (`/v1/ui/mzizi-footer/docs`); otherwise null.
 */
export function renamedComponentPath(pathname: string): string | null {
  for (const prefix of COMPONENT_PATH_PREFIXES) {
    if (!pathname.startsWith(prefix + "/")) continue
    const rest = pathname.slice(prefix.length + 1)
    const slash = rest.indexOf("/")
    const segment = slash === -1 ? rest : rest.slice(0, slash)
    const next = renamedComponent(segment)
    if (!next) return null
    return `${prefix}/${next}${slash === -1 ? "" : rest.slice(slash)}`
  }
  return null
}
