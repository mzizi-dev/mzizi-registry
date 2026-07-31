import { NextResponse } from "next/server"
import { createLogger } from "@/lib/observability"
import { isSupabaseConfigured, getHelixModel } from "@/lib/db"
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
 * Full snapshot of the Mzizi DNA double helix — every node and rung with
 * its covenant, stakeholder, implementation rules and live component
 * count, plus the strands that group them by backbone. Single call powers
 * the explorer page at `/architecture`.
 *
 * Reads `component_documents` / `documentation-architecture-{nodes,strands}`
 * via `getHelixModel()` — the same source of truth the MCP serves. Counts
 * come from `get_node_counts()` and are never hardcoded.
 *
 * This route previously reshaped the `get_architecture()` RPC into a
 * nested `axes[].layers[]` payload with an `axis_geometry` field and an
 * `axes_count` in `meta`. That model is retired: there are no axes, no
 * outliers, no 3D and no X/Y/Z (§6.2). `openapi.yaml` has documented the
 * helix shape here since the axis routes were retired, so this is the code
 * catching up to its own published contract — not a new contract.
 *
 * `get_architecture()` is separately known to return no rows in
 * production. Nothing here fabricates a fallback: an empty model returns
 * `200` with empty arrays and `meta.empty: true` so a consumer can tell
 * "the collection is empty" from "the request failed".
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

    const model = await getHelixModel()
    trackApiCall({
      endpoint: "/api/v1/architecture",
      durationMs: Date.now() - start,
      statusCode: 200,
    })

    const empty = model.nodes.length === 0 && model.rungs.length === 0 && model.strands.length === 0

    return NextResponse.json(
      {
        data: model,
        meta: {
          model: "mzizi-dna-helix",
          node_count: model.nodes.length,
          rung_count: model.rungs.length,
          strand_count: model.strands.length,
          empty,
          source: "component_documents/documentation-architecture-{nodes,strands}",
          version: "v1",
        },
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
