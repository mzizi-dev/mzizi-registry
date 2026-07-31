import { NextResponse } from "next/server"
import { trackApiCall } from "@/lib/metrics"

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "public, max-age=3600, s-maxage=86400",
}

/**
 * GET /api/v1/architecture/frontend/layers — HTTP 410 Gone.
 *
 * Retired with the axis model. This route served `layerNumber` / `subLabel` /
 * **`axisName`** per row — layer-era vocabulary, with each entry naming the axis
 * it belonged to. The model is nodes on strands plus rungs; nothing belongs to
 * an axis, because there are none.
 *
 * The replacement is `/api/v1/architecture/layers/{n}` for per-node detail and
 * the MCP `get_node_documents` for the live node/strand documents. The path
 * segment `layers` there is retained for URL stability only — it serves nodes.
 */
export async function GET() {
  trackApiCall({
    endpoint: "/api/v1/architecture/frontend/layers",
    durationMs: 0,
    statusCode: 410,
  })
  return NextResponse.json(
    {
      error: "Gone",
      message:
        "The axis/layer model is retired. Mzizi serves the DNA double helix — nodes on strands, held by cross-cutting rungs. This route served layerNumber/axisName rows, which assumed every unit belonged to an axis.",
      model: "mzizi-dna-helix",
      migrated_to: {
        "node detail": "https://mzizi.dev/api/v1/architecture/layers/{n}",
        architecture: "https://mzizi.dev/api/v1/architecture",
        "nodes + strands (MCP)": "get_node_documents",
      },
    },
    { status: 410, headers: CORS }
  )
}
