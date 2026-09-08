/**
 * Shared handler behind `ui.mzizi.dev` and `plus.mzizi.dev`.
 *
 * WHAT THIS IS FOR. `mzizi.dev` renders every node together — primitives next
 * to safety gates next to doctrine. The split puts the seven viewable nodes
 * (tokens, primitives, brand, pages, shell) on `ui.mzizi.dev` and the five
 * non-visual rungs/logic nodes (safety, resilience, assurance, fundi,
 * discovery — documentation for now, until `n12`'s directory exists) on
 * `plus.mzizi.dev` as a toolchain, matching the doctrine's own node/rung split
 * (`content/doctrine/documentation/dna-helix-overview.mdx`).
 *
 * WHAT IT IS NOT. Like `mzizi-api`, this does not reimplement `mzizi.dev`'s
 * pages — Next's rendering pipeline can't be cherry-picked into a standalone
 * Worker the way a route handler function can. Instead this Worker fetches
 * the real page from the `mzizi.dev` origin and either serves it (the request
 * belongs on this subdomain) or 302s to the canonical `mzizi.dev` URL (it
 * doesn't). There is exactly one rendering of every page; this only ever
 * decides which subdomain is allowed to show it.
 */

import { NODE_MAP } from "./node-map.generated"

export type DomainProxyConfig = {
  /** The subdomain this config serves, e.g. `"ui.mzizi.dev"`. Used only for logging. */
  readonly domain: string
  /** Node ids this subdomain may serve, e.g. `["n1", "n2", "n3", "n6", "n7"]`. */
  readonly allowedNodes: ReadonlySet<string>
  /**
   * Path prefixes whose `:name` segment is a registry item — gated per-item
   * against `allowedNodes` via `NODE_MAP`. E.g. `/components` gates
   * `/components/button` by looking up `"button"`.
   */
  readonly gatedPrefixes: readonly string[]
  /**
   * Path prefixes served unconditionally on this subdomain — no per-item
   * lookup, because everything under them already belongs to exactly one
   * subdomain's node set (e.g. all of `/skills` is n12/toolchain content).
   * `/` (exact) is implied and always allowed.
   */
  readonly staticPrefixes: readonly string[]
}

/** Paths every subdomain proxies through unconditionally — not node content. */
const SHARED_PREFIXES = ["/.well-known", "/privacy", "/terms", "/robots.txt", "/favicon.ico"]

const ORIGIN = "https://mzizi.dev"

function matchesPrefix(pathname: string, prefixes: readonly string[]): boolean {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(prefix + "/"))
}

/**
 * `/components/button` -> `"button"`. Only the first segment after the
 * gated prefix is the item name; anything deeper (there is none today) falls
 * through to the "not this subdomain" branch rather than guessing.
 */
function itemNameFrom(pathname: string, prefix: string): string | null {
  const rest = pathname.slice(prefix.length).replace(/^\/+/, "")
  if (!rest || rest.includes("/")) return null
  return decodeURIComponent(rest)
}

export function createDomainProxyHandler(config: DomainProxyConfig) {
  return async function handle(request: Request): Promise<Response> {
    const url = new URL(request.url)
    const { pathname } = url

    if (pathname === "/" || matchesPrefix(pathname, SHARED_PREFIXES)) {
      return proxy(request, url)
    }

    if (matchesPrefix(pathname, config.staticPrefixes)) {
      return proxy(request, url)
    }

    const gatedPrefix = config.gatedPrefixes.find((prefix) => pathname.startsWith(prefix + "/"))
    if (gatedPrefix) {
      const name = itemNameFrom(pathname, gatedPrefix)
      const node = name ? NODE_MAP[name] : undefined
      if (node && config.allowedNodes.has(node)) {
        return proxy(request, url)
      }
      // Either the item doesn't exist, isn't a single-node item, or belongs to
      // a node this subdomain doesn't serve — either way the canonical answer
      // lives on mzizi.dev, not a bare 404 that strands the visitor.
      return Response.redirect(ORIGIN + pathname + url.search, 302)
    }

    return Response.redirect(ORIGIN + pathname + url.search, 302)
  }
}

/** Fetch the real page from the `mzizi.dev` origin and return it verbatim. */
async function proxy(request: Request, url: URL): Promise<Response> {
  const upstream = new URL(url.pathname + url.search, ORIGIN)
  const upstreamRequest = new Request(upstream, request)
  upstreamRequest.headers.set("host", "mzizi.dev")
  return fetch(upstreamRequest)
}
