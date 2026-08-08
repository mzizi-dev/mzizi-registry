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

    const entries = await getChangelogByVersion(version)

    if (entries.length === 0) {
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

    // `data` is an ARRAY, matching `/api/v1/changelog`, because a version is not
    // unique: eight of them carry two or three entries with different titles and
    // content. Serving the first would drop real release notes, and the previous
    // `.single()` served none at all — PostgREST answers PGRST116 for "more than
    // one row" as well as "no rows", so those eight versions 404'd.
    //
    // The first entry is also spread at the top level so a consumer written
    // against the old single-object shape keeps working.
    return NextResponse.json(
      {
        ...entries[0],
        data: entries,
        meta: { version, entries: entries.length },
      },
      { headers: CORS_CACHE }
    )
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
