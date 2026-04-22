import { NextResponse } from "next/server"
import { createLogger } from "@/lib/observability"
import { getChangelogByVersion, isSupabaseConfigured } from "@/lib/db"
import { trackApiCall } from "@/lib/metrics"

const logger = createLogger("api")

const CORS_CACHE = {
  "Cache-Control": "public, max-age=3600, s-maxage=86400",
  "Access-Control-Allow-Origin": "*",
}

const CORS = { "Access-Control-Allow-Origin": "*" }

/**
 * GET /api/v1/changelog/[version] — Single changelog entry by version.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ version: string }> }) {
  const start = Date.now()
  try {
    const { version } = await params

    if (!version) {
      trackApiCall({
        endpoint: "/api/v1/changelog/[version]",
        durationMs: Date.now() - start,
        statusCode: 400,
      })
      return NextResponse.json({ error: "Invalid version" }, { status: 400, headers: CORS })
    }

    if (!isSupabaseConfigured()) {
      trackApiCall({
        endpoint: `/api/v1/changelog/${version}`,
        durationMs: Date.now() - start,
        statusCode: 503,
      })
      return NextResponse.json({ error: "Database not configured" }, { status: 503, headers: CORS })
    }

    const entry = await getChangelogByVersion(version)

    if (!entry) {
      trackApiCall({
        endpoint: `/api/v1/changelog/${version}`,
        durationMs: Date.now() - start,
        statusCode: 404,
      })
      return NextResponse.json(
        { error: `Version "${version}" not found` },
        { status: 404, headers: CORS }
      )
    }

    trackApiCall({
      endpoint: `/api/v1/changelog/${version}`,
      durationMs: Date.now() - start,
      statusCode: 200,
    })

    return NextResponse.json(entry, { headers: CORS_CACHE })
  } catch (error) {
    logger.error("Changelog entry error", {
      error: error instanceof Error ? error : new Error(String(error)),
    })
    trackApiCall({
      endpoint: "/api/v1/changelog/[version]",
      durationMs: Date.now() - start,
      statusCode: 500,
    })
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: CORS })
  }
}
