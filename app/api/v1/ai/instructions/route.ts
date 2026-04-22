import { NextResponse } from "next/server"
import { createLogger } from "@/lib/observability"
import { getAllAiInstructions, isSupabaseConfigured } from "@/lib/db"
import { trackApiCall } from "@/lib/metrics"

const logger = createLogger("api")

const CORS_CACHE = {
  "Cache-Control": "public, max-age=300, s-maxage=3600",
  "Access-Control-Allow-Origin": "*",
}

const CORS = { "Access-Control-Allow-Origin": "*" }

/**
 * GET /api/v1/ai/instructions — List all AI instructions.
 */
export async function GET() {
  const start = Date.now()
  try {
    if (!isSupabaseConfigured()) {
      trackApiCall({
        endpoint: "/api/v1/ai/instructions",
        durationMs: Date.now() - start,
        statusCode: 503,
      })
      return NextResponse.json({ error: "Database not configured" }, { status: 503, headers: CORS })
    }

    const instructions = await getAllAiInstructions()

    const items = instructions.map((i) => ({
      name: i.name,
      target: i.target,
      title: i.title,
      description: i.description,
      version: i.version,
      updated_at: i.updated_at,
    }))

    trackApiCall({
      endpoint: "/api/v1/ai/instructions",
      durationMs: Date.now() - start,
      statusCode: 200,
    })

    return NextResponse.json(
      { data: items, meta: { total: items.length } },
      { headers: CORS_CACHE }
    )
  } catch (error) {
    logger.error("AI instructions error", {
      error: error instanceof Error ? error : new Error(String(error)),
    })
    trackApiCall({
      endpoint: "/api/v1/ai/instructions",
      durationMs: Date.now() - start,
      statusCode: 500,
    })
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: CORS })
  }
}
