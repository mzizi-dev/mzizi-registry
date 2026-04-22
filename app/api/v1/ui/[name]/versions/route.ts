import { NextResponse } from "next/server"
import { createLogger } from "@/lib/observability"
import { getComponentVersions, isSupabaseConfigured } from "@/lib/db"
import { trackApiCall } from "@/lib/metrics"

const logger = createLogger("api")

const CORS_CACHE = {
  "Cache-Control": "public, max-age=300, s-maxage=3600",
  "Access-Control-Allow-Origin": "*",
}

const CORS = { "Access-Control-Allow-Origin": "*" }

/**
 * GET /api/v1/ui/[name]/versions — Component version history.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ name: string }> }) {
  const start = Date.now()
  try {
    const { name } = await params

    if (!name || typeof name !== "string") {
      trackApiCall({
        endpoint: "/api/v1/ui/[name]/versions",
        durationMs: Date.now() - start,
        statusCode: 400,
      })
      return NextResponse.json({ error: "Invalid component name" }, { status: 400, headers: CORS })
    }

    if (!isSupabaseConfigured()) {
      trackApiCall({
        endpoint: `/api/v1/ui/${name}/versions`,
        durationMs: Date.now() - start,
        statusCode: 503,
        componentName: name,
      })
      return NextResponse.json({ error: "Database not configured" }, { status: 503, headers: CORS })
    }

    const versions = await getComponentVersions(name)

    trackApiCall({
      endpoint: `/api/v1/ui/${name}/versions`,
      durationMs: Date.now() - start,
      statusCode: 200,
      componentName: name,
    })

    return NextResponse.json(
      {
        data: versions,
        meta: { total: versions.length, component: name },
      },
      { headers: CORS_CACHE }
    )
  } catch (error) {
    logger.error("Component versions error", {
      error: error instanceof Error ? error : new Error(String(error)),
    })
    trackApiCall({
      endpoint: "/api/v1/ui/[name]/versions",
      durationMs: Date.now() - start,
      statusCode: 500,
    })
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: CORS })
  }
}
