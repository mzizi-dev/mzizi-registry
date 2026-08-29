/**
 * The router for `api.mzizi.dev`.
 *
 * Next derives routing from the filesystem at build time. A standalone Worker
 * has no such convention, so the mapping is a generated table
 * (`routes.generated.ts`, written by `scripts/generate-api-routes.mjs`) and this
 * is the matcher over it.
 *
 * The table is ordered at generation time so a literal segment always precedes a
 * parameter that would also match it — `/api/v1/skills/summary` before
 * `/api/v1/skills/:name`. That ordering is why matching can be a linear scan
 * taking the first hit, and why the precedence is visible in the committed
 * artifact rather than hidden in a sort here.
 */

import { ROUTES } from "./routes.generated"

/**
 * A Next route module, seen from the router: HTTP-method exports plus whatever
 * else the file declares (`revalidate`, `dynamic`, …).
 *
 * The members are `unknown` rather than `Handler`, and that is forced rather
 * than lazy. A handler for `/api/v1/skills/:name` is typed
 * `(req, { params: Promise<{ name: string }> }) => …`, and a router holding a
 * table of many routes can only offer `Promise<Record<string, string>>`.
 * Function parameters are contravariant, so the specific handler is NOT
 * assignable to the general signature — declaring `GET?: Handler` makes every
 * entry in the generated table a type error.
 *
 * What actually guarantees a handler receives the params it asks for is the
 * generator: `:name` in the pattern and `{ name: string }` in the handler both
 * come from the directory literally called `[name]`, so they cannot disagree
 * without someone renaming a folder and its own route file's types together.
 * That is a real invariant, and it lives outside the type system — so it is
 * written down here rather than papered over with a lie about the types.
 */
export type RouteModule = {
  readonly [method: string]: unknown
}

export type Handler = (
  request: Request,
  context: { params: Promise<Record<string, string>> }
) => Promise<Response> | Response

export type Match = {
  readonly params: Record<string, string>
  readonly methods: readonly string[]
  readonly load: () => Promise<RouteModule>
}

/**
 * Normalise an incoming pathname to the form the generated table uses.
 *
 * The table keys are the app's own paths — `/api/v1/skills` — because the file
 * tree is the source of truth and a table that renamed them would be a second
 * naming scheme to keep in step. But on `api.mzizi.dev` the `/api` prefix is
 * redundant, and asking callers to write `api.mzizi.dev/api/v1/...` would be
 * silly. So BOTH forms resolve: `/v1/skills` and `/api/v1/skills` are the same
 * route.
 *
 * That is not only a convenience. It is what lets `mzizi.dev/api/v1/*` be
 * routed to this Worker later without changing a single published URL — the
 * paths consumers already have keep working when the traffic moves.
 */
export function normalisePath(pathname: string): string {
  // Collapse duplicate slashes and drop a trailing one, so `/v1/skills/` and
  // `//v1//skills` do not 404 on a technicality. The root stays `/`.
  let path = pathname.replace(/\/{2,}/g, "/")
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1)
  if (path === "/api" || path.startsWith("/api/")) return path
  return path === "/" ? "/api" : "/api" + path
}

/** Match a normalised path against the table. Returns null when nothing matches. */
export function match(path: string): Match | null {
  const parts = path.split("/").filter(Boolean)

  for (const route of ROUTES) {
    const pattern = route.pattern.split("/").filter(Boolean)
    if (pattern.length !== parts.length) continue

    const params: Record<string, string> = {}
    let ok = true
    for (let i = 0; i < pattern.length; i++) {
      const seg = pattern[i]!
      if (seg.startsWith(":")) {
        // An empty segment cannot fill a parameter. `filter(Boolean)` above
        // already removes them, so this is belt-and-braces against a pattern
        // change rather than a live case.
        if (!parts[i]) {
          ok = false
          break
        }
        params[seg.slice(1)] = decodeURIComponent(parts[i]!)
      } else if (seg !== parts[i]) {
        ok = false
        break
      }
    }
    if (ok) return { params, methods: route.methods, load: route.load }
  }
  return null
}

const JSON_HEADERS = {
  "content-type": "application/json",
  "access-control-allow-origin": "*",
}

/**
 * Resolve a request to a response.
 *
 * Two behaviours here exist to match Next rather than because a router needs
 * them, and both would be silent incompatibilities if omitted:
 *
 *   HEAD    Next serves HEAD from a route's GET when the module does not
 *           export one. A router that 405'd instead would break every
 *           conditional-request and link-checking client.
 *   OPTIONS Next auto-implements OPTIONS with an `Allow` header. This is a
 *           PUBLIC, CORS-enabled API: without it, a browser preflight fails
 *           and every cross-origin caller breaks — while curl, and therefore
 *           any smoke test written with curl, still passes.
 */
export async function handle(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const path = normalisePath(url.pathname)
  const found = match(path)

  if (!found) {
    return Response.json(
      { error: "Not found", path: url.pathname },
      { status: 404, headers: JSON_HEADERS }
    )
  }

  const allowed = new Set<string>(found.methods)
  if (allowed.has("GET")) allowed.add("HEAD")
  allowed.add("OPTIONS")

  if (!allowed.has(request.method)) {
    return Response.json(
      { error: "Method not allowed", method: request.method },
      {
        status: 405,
        headers: { ...JSON_HEADERS, allow: [...allowed].join(", ") },
      }
    )
  }

  const mod = await found.load()
  const context = { params: Promise.resolve(found.params) }

  if (request.method === "OPTIONS" && !mod.OPTIONS) {
    return new Response(null, {
      status: 204,
      headers: {
        allow: [...allowed].join(", "),
        "access-control-allow-origin": "*",
        "access-control-allow-methods": [...allowed].join(", "),
        "access-control-allow-headers": "content-type",
      },
    })
  }

  if (request.method === "HEAD" && !mod.HEAD) {
    const response = await (mod.GET as Handler)(request, context)
    // A HEAD response carries the headers of the GET and no body. Constructing
    // it from `response.headers` rather than returning `response` keeps
    // `content-length` and `content-type` intact while dropping the payload.
    return new Response(null, { status: response.status, headers: response.headers })
  }

  const handler = mod[request.method] as Handler
  return handler(request, context)
}
