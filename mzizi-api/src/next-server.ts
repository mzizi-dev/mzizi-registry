/**
 * A stand-in for `next/server`, so the API Worker can serve the Next route
 * handlers without pulling in Next.
 *
 * WHY THIS EXISTS. All 36 route handlers under `app/api/` are already written
 * against Web standards: their first parameter is typed as a plain `Request`
 * and their dynamic params arrive as a `Promise`. The only thing any of them
 * imports from `next/server` is `NextResponse`.
 *
 * `wrangler.jsonc` aliases `next/server` to this file. That is what lets
 * `mzizi-api` import the handlers AS THEY ARE, rather than keeping a second
 * copy of every route. A second copy is the defect this repo has spent the most
 * effort removing — component source in a database column, skills in a synced
 * table, doctrine in eight tables that did not exist. Forking 36 route handlers
 * to change one import would have recreated it in a new place.
 *
 * If a handler ever needs something else from `next/server` — `after()`,
 * middleware helpers, the parts of `NextRequest` that are not on `Request` —
 * it belongs here, implemented against the Workers runtime, or the handler
 * belongs in a shared module both surfaces import. What must not happen is the
 * two surfaces drifting apart.
 */

/**
 * `NextResponse` is a subclass of `Response`, and this has to be one too.
 *
 * An earlier version of this file exported a plain object with a single `json`
 * method, on the strength of a grep for `NextResponse\.` that found 101 hits
 * and every one of them `.json`. That grep could not see `new NextResponse(…)`,
 * which `app/api/openapi/route.ts` uses twice — so the shim typechecked, built,
 * and would have thrown "NextResponse is not a constructor" at request time on
 * exactly one endpoint.
 *
 * Extending `Response` rather than reimplementing it means the constructor,
 * `json`, and every other member behave as the platform defines them, so the
 * next unnoticed usage works rather than being the next outage.
 */
export class NextResponse extends Response {
  /**
   * `Response.json` is inherited, but it is redeclared here for a reason:
   * `Response.json` returns a `Response`, and callers that annotate a
   * `NextResponse` need the narrower type. The runtime behaviour is identical —
   * both set `content-type: application/json` and both honour
   * `{ status, headers }`, which is all any call site passes.
   */
  static json(body: unknown, init?: ResponseInit): NextResponse {
    const response = Response.json(body, init)
    return new NextResponse(response.body, response)
  }
}

/**
 * Exported so a handler that annotates its parameter as `NextRequest` still
 * typechecks. Nothing in `app/api/` does today, and this is deliberately the
 * plain `Request` rather than a richer fake: a type that promises `nextUrl` or
 * `geo` while the runtime provides neither would be worse than absent.
 */
export type NextRequest = Request
