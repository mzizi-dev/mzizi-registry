import { NextResponse } from "next/server"
import { createLogger } from "@/lib/observability"
import { getDocumentationPage, isSupabaseConfigured } from "@/lib/db"
import { trackApiCall } from "@/lib/metrics"

const logger = createLogger("api")

const CORS_CACHE = {
  "Cache-Control": "public, max-age=3600, s-maxage=86400",
  "Access-Control-Allow-Origin": "*",
}

const CORS = { "Access-Control-Allow-Origin": "*" }

/**
 * GET /api/v1/docs/[slug] — Single documentation page by slug.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const start = Date.now()
  try {
    const { slug } = await params

    if (!slug) {
      trackApiCall({
        endpoint: "/api/v1/docs/[slug]",
        durationMs: Date.now() - start,
        statusCode: 400,
      })
      return NextResponse.json({ error: "Invalid slug" }, { status: 400, headers: CORS })
    }

    if (!isSupabaseConfigured()) {
      trackApiCall({
        endpoint: `/api/v1/docs/${slug}`,
        durationMs: Date.now() - start,
        statusCode: 503,
      })
      return NextResponse.json({ error: "Database not configured" }, { status: 503, headers: CORS })
    }

    const page = await getDocumentationPage(slug)

    if (!page) {
      trackApiCall({
        endpoint: `/api/v1/docs/${slug}`,
        durationMs: Date.now() - start,
        statusCode: 404,
      })
      return NextResponse.json(
        { error: `Page "${slug}" not found` },
        { status: 404, headers: CORS }
      )
    }

    trackApiCall({
      endpoint: `/api/v1/docs/${slug}`,
      durationMs: Date.now() - start,
      statusCode: 200,
    })

    return NextResponse.json(page, { headers: CORS_CACHE })
  } catch (error) {
    logger.error("Docs page error", {
      error: error instanceof Error ? error : new Error(String(error)),
    })
    trackApiCall({
      endpoint: "/api/v1/docs/[slug]",
      durationMs: Date.now() - start,
      statusCode: 500,
    })
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: CORS })
  }
}
