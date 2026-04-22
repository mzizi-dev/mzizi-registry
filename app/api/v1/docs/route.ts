import { NextResponse } from "next/server"
import { createLogger } from "@/lib/observability"
import {
  getAllDocumentationPages,
  getDocumentationPagesByCategory,
  isSupabaseConfigured,
} from "@/lib/db"
import { trackApiCall } from "@/lib/metrics"

const logger = createLogger("api")

const CORS_CACHE = {
  "Cache-Control": "public, max-age=3600, s-maxage=86400",
  "Access-Control-Allow-Origin": "*",
}

const CORS = { "Access-Control-Allow-Origin": "*" }

/**
 * GET /api/v1/docs — List all published documentation pages.
 *
 * Query params:
 *   ?category=getting-started|architecture|contributor|api-reference|brand
 */
export async function GET(request: Request) {
  const start = Date.now()
  try {
    if (!isSupabaseConfigured()) {
      trackApiCall({ endpoint: "/api/v1/docs", durationMs: Date.now() - start, statusCode: 503 })
      return NextResponse.json({ error: "Database not configured" }, { status: 503, headers: CORS })
    }

    const url = new URL(request.url)
    const category = url.searchParams.get("category")

    const pages = category
      ? await getDocumentationPagesByCategory(category)
      : await getAllDocumentationPages()

    const items = pages.map((p) => ({
      slug: p.slug,
      title: p.title,
      category: p.category,
      description: p.description,
      sort_order: p.sort_order,
      updated_at: p.updated_at,
    }))

    trackApiCall({ endpoint: "/api/v1/docs", durationMs: Date.now() - start, statusCode: 200 })

    return NextResponse.json(
      { data: items, meta: { total: items.length, category } },
      { headers: CORS_CACHE }
    )
  } catch (error) {
    logger.error("Docs list error", {
      error: error instanceof Error ? error : new Error(String(error)),
    })
    trackApiCall({ endpoint: "/api/v1/docs", durationMs: Date.now() - start, statusCode: 500 })
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: CORS })
  }
}
