import { NextResponse } from "next/server"
import { createLogger } from "@/lib/observability"
import { getUsageStats } from "@/lib/metrics"
import { readNodeCounts } from "@/lib/registry"

const logger = createLogger("api")

/**
 * Count components per node, from the registry on disk.
 *
 * This used to `select("name, layer, source_code")` from the `components` view
 * and treat any error as "no data" by returning `{}`. Two things were wrong
 * with that, and the second hid the first:
 *
 *   - The component set is not in the database. It is `registry.json` plus the
 *     files under `components/registry/`, both of which are in the deployed
 *     bundle. Asking Postgres how many components exist is a network round trip
 *     to a less authoritative answer than a local read.
 *   - The `catch`/`if (error) return {}` meant a broken query was
 *     indistinguishable from an empty registry. `/api/v1/stats` served
 *     `"layers": {}` and looked healthy. When `source_code` was dropped from
 *     the view, the query started failing with 42703 and nothing changed in the
 *     response — which is precisely the failure mode the whole extraction was
 *     about.
 *
 * Keyed by node number as a string, so the shape consumers already parse is
 * unchanged. A registry with no components yields `{}` — but now that means the
 * registry is empty, not that a query failed.
 */
function getLayerBreakdown(): Record<string, number> {
  const counts = readNodeCounts()
  return Object.fromEntries(Object.entries(counts).map(([node, total]) => [node, total]))
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "public, max-age=60, s-maxage=120",
}

/**
 * GET /api/v1/stats — Public usage statistics
 *
 * Returns aggregate API and MCP usage data for the observability dashboard.
 * Aligned with the open data philosophy — all data is public.
 *
 * Query params:
 *   ?days=7|30|90  — lookback period (default 30)
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const daysParam = url.searchParams.get("days")
    const days = daysParam ? Math.min(Math.max(parseInt(daysParam, 10) || 30, 1), 90) : 30

    const stats = await getUsageStats(days)
    const layers = getLayerBreakdown()

    logger.info("Stats served", {
      data: { days, totalCalls: stats.total_api_calls + stats.total_mcp_calls },
    })

    return NextResponse.json(
      {
        "@context": "https://schema.org",
        "@type": "Dataset",
        name: "Mzizi — Usage Statistics",
        description:
          "Public API and MCP usage metrics for the Mzizi component registry. Open data aligned with the bundu ecosystem philosophy.",
        license: "https://creativecommons.org/licenses/by/4.0/",
        ...stats,
        layers,
      },
      { headers: CORS }
    )
  } catch (error) {
    logger.error("Stats error", {
      error: error instanceof Error ? error : new Error(String(error)),
    })
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: CORS })
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: { ...CORS, Allow: "GET, OPTIONS" } })
}
