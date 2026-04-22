import { NextResponse } from "next/server"
import { createLogger } from "@/lib/observability"
import { getFundiIssue, isSupabaseConfigured } from "@/lib/db"
import { trackApiCall } from "@/lib/metrics"

const logger = createLogger("api")

const CORS_CACHE = {
  "Cache-Control": "public, max-age=60, s-maxage=300",
  "Access-Control-Allow-Origin": "*",
}

const CORS = { "Access-Control-Allow-Origin": "*" }

/**
 * GET /api/v1/fundi/[id] — Single Fundi issue.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const start = Date.now()
  try {
    const { id: idStr } = await params
    const id = Number.parseInt(idStr, 10)

    if (!Number.isFinite(id)) {
      trackApiCall({
        endpoint: "/api/v1/fundi/[id]",
        durationMs: Date.now() - start,
        statusCode: 400,
      })
      return NextResponse.json({ error: "Invalid issue id" }, { status: 400, headers: CORS })
    }

    if (!isSupabaseConfigured()) {
      trackApiCall({
        endpoint: `/api/v1/fundi/${id}`,
        durationMs: Date.now() - start,
        statusCode: 503,
      })
      return NextResponse.json({ error: "Database not configured" }, { status: 503, headers: CORS })
    }

    const issue = await getFundiIssue(id)

    if (!issue) {
      trackApiCall({
        endpoint: `/api/v1/fundi/${id}`,
        durationMs: Date.now() - start,
        statusCode: 404,
      })
      return NextResponse.json({ error: `Issue ${id} not found` }, { status: 404, headers: CORS })
    }

    trackApiCall({
      endpoint: `/api/v1/fundi/${id}`,
      durationMs: Date.now() - start,
      statusCode: 200,
    })

    return NextResponse.json(issue, { headers: CORS_CACHE })
  } catch (error) {
    logger.error("Fundi issue error", {
      error: error instanceof Error ? error : new Error(String(error)),
    })
    trackApiCall({
      endpoint: "/api/v1/fundi/[id]",
      durationMs: Date.now() - start,
      statusCode: 500,
    })
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: CORS })
  }
}
