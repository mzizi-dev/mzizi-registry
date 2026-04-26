import { NextResponse } from "next/server"
import { createLogger } from "@/lib/observability"
import { isSupabaseConfigured, getAxesSummary } from "@/lib/db"
import { trackApiCall } from "@/lib/metrics"

const logger = createLogger("architecture-axes-summary")

const CORS_CACHE = {
  "Cache-Control": "public, max-age=3600, s-maxage=86400",
  "Access-Control-Allow-Origin": "*",
}

const CORS = { "Access-Control-Allow-Origin": "*" }

export const revalidate = 3600

/**
 * GET /api/v1/architecture/axes
 *
 * One row per axis with `layer_count` and `component_count` joined live
 * from `architecture_frontend_layers` and `components`. Wraps the
 * `get_axes_summary()` SQL helper.
 */
export async function GET() {
  const start = Date.now()
  try {
    if (!isSupabaseConfigured()) {
      trackApiCall({
        endpoint: "/api/v1/architecture/axes",
        durationMs: Date.now() - start,
        statusCode: 503,
      })
      return NextResponse.json(
        {
          error: "Database not configured",
          message: "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
        },
        { status: 503, headers: CORS }
      )
    }

    const axes = await getAxesSummary()
    trackApiCall({
      endpoint: "/api/v1/architecture/axes",
      durationMs: Date.now() - start,
      statusCode: 200,
    })

    return NextResponse.json({ data: axes, meta: { count: axes.length } }, { headers: CORS_CACHE })
  } catch (error) {
    logger.error("Axes summary error", {
      error: error instanceof Error ? error : new Error(String(error)),
    })
    trackApiCall({
      endpoint: "/api/v1/architecture/axes",
      durationMs: Date.now() - start,
      statusCode: 500,
    })
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: CORS })
  }
}
