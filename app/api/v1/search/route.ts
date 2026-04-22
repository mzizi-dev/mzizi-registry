import { NextResponse } from "next/server"
import { createLogger } from "@/lib/observability"
import {
  searchComponents,
  getComponentsByLayer,
  getComponentsByCategory,
  isSupabaseConfigured,
} from "@/lib/db"
import { trackApiCall } from "@/lib/metrics"

const logger = createLogger("api")

const CORS_CACHE = {
  "Cache-Control": "public, max-age=300, s-maxage=3600",
  "Access-Control-Allow-Origin": "*",
}

const CORS = { "Access-Control-Allow-Origin": "*" }

/**
 * GET /api/v1/search?q=&layer=&category=
 *
 * Search components by name or description, optionally filtered by layer and/or category.
 */
export async function GET(request: Request) {
  const start = Date.now()
  try {
    const url = new URL(request.url)
    const q = (url.searchParams.get("q") ?? "").trim()
    const layer = url.searchParams.get("layer")
    const category = url.searchParams.get("category")

    if (!isSupabaseConfigured()) {
      trackApiCall({ endpoint: "/api/v1/search", durationMs: Date.now() - start, statusCode: 503 })
      return NextResponse.json({ error: "Database not configured" }, { status: 503, headers: CORS })
    }

    let results
    if (q) {
      results = await searchComponents(q)
    } else if (layer) {
      results = await getComponentsByLayer(layer)
    } else if (category) {
      results = await getComponentsByCategory(category)
    } else {
      trackApiCall({ endpoint: "/api/v1/search", durationMs: Date.now() - start, statusCode: 400 })
      return NextResponse.json(
        { error: "At least one of q, layer, or category is required" },
        { status: 400, headers: CORS }
      )
    }

    if (layer) results = results.filter((c) => c.layer === layer)
    if (category) results = results.filter((c) => c.category === category)

    const items = results.map((c) => ({
      name: c.name,
      type: c.registry_type,
      description: c.description,
      category: c.category,
      layer: c.layer,
    }))

    trackApiCall({ endpoint: "/api/v1/search", durationMs: Date.now() - start, statusCode: 200 })

    return NextResponse.json(
      {
        data: items,
        meta: { total: items.length, query: q || null, layer, category },
      },
      { headers: CORS_CACHE }
    )
  } catch (error) {
    logger.error("Search error", {
      error: error instanceof Error ? error : new Error(String(error)),
    })
    trackApiCall({ endpoint: "/api/v1/search", durationMs: Date.now() - start, statusCode: 500 })
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: CORS })
  }
}
