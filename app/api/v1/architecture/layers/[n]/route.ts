import { NextResponse } from "next/server"
import { createLogger } from "@/lib/observability"
import { isSupabaseConfigured, getLayerDetail } from "@/lib/db"
import { trackApiCall } from "@/lib/metrics"

const logger = createLogger("architecture-layer-detail")

const CORS_CACHE = {
  "Cache-Control": "public, max-age=3600, s-maxage=86400",
  "Access-Control-Allow-Origin": "*",
}

const CORS = { "Access-Control-Allow-Origin": "*" }

export const revalidate = 3600

/**
 * GET /api/v1/architecture/layers/[n]
 *
 * Single-layer detail (covenant, stakeholder, implementation rules,
 * category breakdown). Wraps `get_layer_detail(p_layer_number int)`.
 *
 * Returns 400 if `[n]` is not an integer between 1 and 10.
 * Returns 404 if the layer number is in range but the row is missing.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ n: string }> }) {
  const start = Date.now()
  const { n } = await params
  const parsed = Number.parseInt(n, 10)

  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 10) {
    trackApiCall({
      endpoint: "/api/v1/architecture/layers/[n]",
      durationMs: Date.now() - start,
      statusCode: 400,
    })
    return NextResponse.json(
      { error: "layer must be an integer 1-10", received: n },
      { status: 400, headers: CORS }
    )
  }

  try {
    if (!isSupabaseConfigured()) {
      trackApiCall({
        endpoint: `/api/v1/architecture/layers/${parsed}`,
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

    const detail = await getLayerDetail(parsed)
    if (!detail) {
      trackApiCall({
        endpoint: `/api/v1/architecture/layers/${parsed}`,
        durationMs: Date.now() - start,
        statusCode: 404,
      })
      return NextResponse.json(
        { error: `Layer ${parsed} not found` },
        { status: 404, headers: CORS }
      )
    }

    trackApiCall({
      endpoint: `/api/v1/architecture/layers/${parsed}`,
      durationMs: Date.now() - start,
      statusCode: 200,
    })
    return NextResponse.json({ data: detail }, { headers: CORS_CACHE })
  } catch (error) {
    logger.error("Layer detail error", {
      error: error instanceof Error ? error : new Error(String(error)),
    })
    trackApiCall({
      endpoint: `/api/v1/architecture/layers/${parsed}`,
      durationMs: Date.now() - start,
      statusCode: 500,
    })
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: CORS })
  }
}
