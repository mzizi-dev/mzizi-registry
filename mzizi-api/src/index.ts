/**
 * `api.mzizi.dev` — the Mzizi public API as a standalone Cloudflare Worker.
 *
 * WHAT THIS IS FOR. The API and the website have different shapes: the API is
 * 36 JSON endpoints with long cache lives and cross-origin consumers, the site
 * is pages. Serving both from one deployment means a page change redeploys the
 * API and an API change redeploys the site. Splitting them is what the move to
 * Astro needs — Astro renders pages, and the data behind them lives here.
 *
 * WHAT IT IS NOT. It is not a reimplementation. Every handler is the exact
 * module `app/api/**\/route.ts` that the Next app serves, imported unmodified;
 * `wrangler.jsonc` aliases `next/server` to a small shim so those modules load
 * outside Next. There is one copy of every endpoint, and no way for the two
 * surfaces to drift.
 */

import { handle } from "./router"
import { createLogger } from "@/lib/observability"

const logger = createLogger("api-worker")

export default {
  async fetch(request: Request): Promise<Response> {
    try {
      return await handle(request)
    } catch (error) {
      // A handler that throws must not take the Worker's isolate with it, and
      // must not leak an internal message to a public API. The detail goes to
      // the log; the caller gets a 500 that says only that.
      // `LogContext.error` is typed `Error`, and the logger prints it with the
      // stack — so the thrown value is normalised rather than stringified,
      // which is what keeps a stack trace in the log for a non-Error throw.
      logger.error("Unhandled error serving request", {
        error: error instanceof Error ? error : new Error(String(error)),
        data: { url: request.url, method: request.method },
      })
      return Response.json(
        { error: "Internal server error" },
        { status: 500, headers: { "access-control-allow-origin": "*" } }
      )
    }
  },
}
