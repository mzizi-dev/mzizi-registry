import { NextResponse } from "next/server"
import { trackApiCall } from "@/lib/metrics"

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "public, max-age=3600, s-maxage=86400",
}

/**
 * GET /api/v1/architecture/frontend/axes — HTTP 410 Gone.
 *
 * Retired with the axis model. This route served one row per axis with a
 * `geometry` field carrying `horizontal` / `vertical` / `depth` / `external`,
 * which is the retired model by name and by shape.
 *
 * Mzizi serves the DNA double helix: nodes on two backbones held by
 * cross-cutting rungs (§6.2). See /api/v1/architecture/axes for the same
 * reasoning on why this is retired rather than remapped.
 */
export async function GET() {
  trackApiCall({
    endpoint: "/api/v1/architecture/frontend/axes",
    durationMs: 0,
    statusCode: 410,
  })
  return NextResponse.json(
    {
      error: "Gone",
      message:
        "The axis model is retired. Mzizi serves the DNA double helix — nodes on an engineering and a meaning backbone, held by cross-cutting rungs. This route served axis rows with a horizontal/vertical/depth/external geometry field.",
      model: "mzizi-dna-helix",
      migrated_to: {
        architecture: "https://mzizi.dev/api/v1/architecture",
        "strands + nodes (MCP)": "get_node_documents",
      },
    },
    { status: 410, headers: CORS }
  )
}
