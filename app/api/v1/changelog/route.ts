import { NextResponse } from "next/server"
import { createLogger } from "@/lib/observability"
import { getChangelogEntries, isSupabaseConfigured } from "@/lib/db"
import { trackApiCall } from "@/lib/metrics"

const logger = createLogger("api")

const CORS_CACHE = {
  "Cache-Control": "public, max-age=600, s-maxage=3600",
  "Access-Control-Allow-Origin": "*",
}

const CORS = { "Access-Control-Allow-Origin": "*" }

/**
 * GET /api/v1/changelog — Full changelog, most recent first.
 */
export async function GET() {
  const start = Date.now()
  try {
    if (!isSupabaseConfigured()) {
      trackApiCall({
        endpoint: "/api/v1/changelog",
        durationMs: Date.now() - start,
        statusCode: 503,
      })
      return NextResponse.json({ error: "Database not configured" }, { status: 503, headers: CORS })
    }

    const entries = await getChangelogEntries()

    trackApiCall({ endpoint: "/api/v1/changelog", durationMs: Date.now() - start, statusCode: 200 })

    return NextResponse.json(
      { data: entries, meta: { total: entries.length } },
      { headers: CORS_CACHE }
    )
  } catch (error) {
    logger.error("Changelog error", {
      error: error instanceof Error ? error : new Error(String(error)),
    })
    trackApiCall({ endpoint: "/api/v1/changelog", durationMs: Date.now() - start, statusCode: 500 })
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: CORS })
  }
}
