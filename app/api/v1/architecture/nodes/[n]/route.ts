import { NextResponse } from "next/server"
import { createLogger } from "@/lib/observability"
import { isSupabaseConfigured, getHelixNode } from "@/lib/db"
import { trackApiCall } from "@/lib/metrics"

const logger = createLogger("architecture-node-detail")

const CORS_CACHE = {
  "Cache-Control": "public, max-age=3600, s-maxage=86400",
  "Access-Control-Allow-Origin": "*",
}

const CORS = { "Access-Control-Allow-Origin": "*" }

export const revalidate = 3600

/**
 * GET /api/v1/architecture/nodes/[n]
 *
 * One element of the Mzizi DNA double helix — a node on a strand or a
 * cross-cutting rung — with its covenant, stakeholder, implementation
 * rules and live component count. Reads
 * `component_documents` / `documentation-architecture-nodes` via
 * `getHelixNode()`, the same source of truth the MCP serves.
 *
 * Replaces `/api/v1/architecture/layers/[n]`, which wrapped
 * `get_layer_detail(p_layer_number)` and served an `axis_name` per row.
 *
 * **There is no upper bound on `n`.** Node numbers are labels, not a
 * sequence, and the set is never capped, so a `maximum` here would be the
 * defect rather than a validation: the old `1-10` bound is precisely what
 * made N11 unreachable, and `1-11` would go on to hide N12. Whether `n`
 * exists is answered by the collection — 404, not 400.
 *
 * Returns 400 only for input that is not a positive integer at all.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ n: string }> }) {
  const start = Date.now()
  const { n } = await params
  const parsed = Number.parseInt(n, 10)

  if (!Number.isInteger(parsed) || parsed < 1 || String(parsed) !== n.trim()) {
    trackApiCall({
      endpoint: "/api/v1/architecture/nodes/[n]",
      durationMs: Date.now() - start,
      statusCode: 400,
    })
    return NextResponse.json(
      { error: "node must be a positive integer", received: n },
      { status: 400, headers: CORS }
    )
  }

  try {
    if (!isSupabaseConfigured()) {
      trackApiCall({
        endpoint: `/api/v1/architecture/nodes/${parsed}`,
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

    const element = await getHelixNode(parsed)
    if (!element) {
      trackApiCall({
        endpoint: `/api/v1/architecture/nodes/${parsed}`,
        durationMs: Date.now() - start,
        statusCode: 404,
      })
      return NextResponse.json(
        {
          error: `No node or rung numbered ${parsed}`,
          message:
            "Node numbers are labels, not a sequence — a gap is not an error. GET /api/v1/architecture lists every element the collection currently holds.",
        },
        { status: 404, headers: CORS }
      )
    }

    trackApiCall({
      endpoint: `/api/v1/architecture/nodes/${parsed}`,
      durationMs: Date.now() - start,
      statusCode: 200,
    })
    return NextResponse.json(
      { data: element, meta: { model: "mzizi-dna-helix", version: "v1" } },
      { headers: CORS_CACHE }
    )
  } catch (error) {
    logger.error("Node detail error", {
      error: error instanceof Error ? error : new Error(String(error)),
    })
    trackApiCall({
      endpoint: `/api/v1/architecture/nodes/${parsed}`,
      durationMs: Date.now() - start,
      statusCode: 500,
    })
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: CORS })
  }
}
