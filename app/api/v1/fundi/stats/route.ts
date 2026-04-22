import { NextResponse } from "next/server"
import { createLogger } from "@/lib/observability"
import { getFundiStats, isSupabaseConfigured } from "@/lib/db"
import { trackApiCall } from "@/lib/metrics"

const logger = createLogger("api")

const CORS_CACHE = {
  "Cache-Control": "public, max-age=60, s-maxage=300",
  "Access-Control-Allow-Origin": "*",
}

const CORS = { "Access-Control-Allow-Origin": "*" }

/**
 * GET /api/v1/fundi/stats — Aggregate Fundi issue stats (total, open, resolved, by layer).
 */
export async function GET() {
  const start = Date.now()
  try {
    if (!isSupabaseConfigured()) {
      trackApiCall({
        endpoint: "/api/v1/fundi/stats",
        durationMs: Date.now() - start,
        statusCode: 503,
      })
      return NextResponse.json({ error: "Database not configured" }, { status: 503, headers: CORS })
    }

    const stats = await getFundiStats()

    trackApiCall({
      endpoint: "/api/v1/fundi/stats",
      durationMs: Date.now() - start,
      statusCode: 200,
    })

    return NextResponse.json(stats, { headers: CORS_CACHE })
  } catch (error) {
    logger.error("Fundi stats error", {
      error: error instanceof Error ? error : new Error(String(error)),
    })
    trackApiCall({
      endpoint: "/api/v1/fundi/stats",
      durationMs: Date.now() - start,
      statusCode: 500,
    })
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: CORS })
  }
}
