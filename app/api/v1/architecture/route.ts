import { NextResponse } from "next/server"
import { createLogger } from "@/lib/observability"
import { isSupabaseConfigured, getArchitectureSnapshot } from "@/lib/db"
import { trackApiCall } from "@/lib/metrics"

const logger = createLogger("architecture-snapshot")

const CORS_CACHE = {
  "Cache-Control": "public, max-age=3600, s-maxage=86400",
  "Access-Control-Allow-Origin": "*",
}

const CORS = { "Access-Control-Allow-Origin": "*" }

export const revalidate = 3600

/**
 * GET /api/v1/architecture
 *
 * Full 3D-architecture snapshot — every axis with its layers, covenants,
 * stakeholders, implementation rules, and live component counts. Single
 * call powers the explorer page at `/architecture`.
 *
 * Wraps the `get_architecture()` SQL helper. Counts are joined live from
 * the `components` table — never hardcoded.
 */
export async function GET() {
  const start = Date.now()
  try {
    if (!isSupabaseConfigured()) {
      trackApiCall({
        endpoint: "/api/v1/architecture",
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

    const axes = await getArchitectureSnapshot()
    trackApiCall({
      endpoint: "/api/v1/architecture",
      durationMs: Date.now() - start,
      statusCode: 200,
    })

    return NextResponse.json(
      {
        data: axes,
        meta: { axes_count: axes.length, version: "v1" },
      },
      { headers: CORS_CACHE }
    )
  } catch (error) {
    logger.error("Architecture snapshot error", {
      error: error instanceof Error ? error : new Error(String(error)),
    })
    trackApiCall({
      endpoint: "/api/v1/architecture",
      durationMs: Date.now() - start,
      statusCode: 500,
    })
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: CORS })
  }
}
