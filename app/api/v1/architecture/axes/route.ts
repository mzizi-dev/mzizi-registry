import { NextResponse } from "next/server"
import { trackApiCall } from "@/lib/metrics"

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "public, max-age=3600, s-maxage=86400",
}

/**
 * GET /api/v1/architecture/axes — HTTP 410 Gone.
 *
 * The axis model is retired. Mzizi serves the **DNA double helix**: nodes on an
 * engineering backbone and a meaning backbone, held by cross-cutting rungs.
 * There are no axes, no outliers, no 3D and no X/Y/Z (§6.2).
 *
 * This route wrapped `get_axes_summary()`, which returned four rows —
 * horizontal / vertical / depth / outlier — with `node_count` and
 * `component_count` zeroed on every one, because the joins behind it stopped
 * resolving after the helix migration. It served a retired model *and* hollow
 * numbers.
 *
 * Retired rather than remapped: emitting strand data through a field named
 * `axis_geometry` would look correct and teach the wrong model to every
 * consumer that read it, which is how this drift started. Absence is the
 * correct state for anything axis-shaped, not repair.
 */
export async function GET() {
  trackApiCall({
    endpoint: "/api/v1/architecture/axes",
    durationMs: 0,
    statusCode: 410,
  })
  return NextResponse.json(
    {
      error: "Gone",
      message:
        "The axis model is retired. Mzizi serves the DNA double helix — nodes on an engineering and a meaning backbone, held by cross-cutting rungs. There are no axes and no outliers. This route previously returned four axis rows with every count zeroed.",
      model: "mzizi-dna-helix",
      migrated_to: {
        architecture: "https://mzizi.dev/api/v1/architecture",
        "node detail": "https://mzizi.dev/api/v1/architecture/layers/{n}",
        "nodes (MCP)": "get_node_documents",
        "per-node counts (MCP)": "get_node_counts",
      },
    },
    { status: 410, headers: CORS }
  )
}
