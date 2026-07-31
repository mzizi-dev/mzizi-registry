import { NextResponse } from "next/server"
import { trackApiCall } from "@/lib/metrics"

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "public, max-age=3600, s-maxage=86400",
}

/**
 * GET /api/v1/architecture/layers/[n] — HTTP 410 Gone.
 *
 * Retired with the layer era. This route wrapped
 * `get_layer_detail(p_layer_number int)` and served an **`axis_name`** on
 * every row, behind a `1-10` bound that rejected any node above ten. Both
 * halves were the retired model: nothing belongs to an axis because there
 * are none, and the node set is never capped — that bound is exactly what
 * made N11 unreachable.
 *
 * Replaced by `/api/v1/architecture/nodes/{n}`, which reads the helix
 * collection the MCP serves and takes no upper bound. The rename is not
 * cosmetic: the `layers` segment was previously kept "for URL stability",
 * and a stable URL serving retired vocabulary is how this drift spread.
 * Consumers get a `migrated_to` pointer rather than a bare 404, the same
 * way `/api/v1/docs*` and the axis routes do.
 *
 * The SITE path `/architecture/layers/{n}` is a permanent redirect to
 * `/architecture/nodes/{n}` (see `next.config.mjs`) — a human following an
 * old link lands on the page, while a machine reading the API contract is
 * told plainly that the shape changed.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ n: string }> }) {
  const { n } = await params
  trackApiCall({
    endpoint: "/api/v1/architecture/layers/[n]",
    durationMs: 0,
    statusCode: 410,
  })
  return NextResponse.json(
    {
      error: "Gone",
      message:
        "The layer model is retired. Mzizi serves the DNA double helix — nodes on strands, held by cross-cutting rungs. This route served an axis_name per row behind a 1-10 bound; node numbers are labels, not a sequence, and the set is never capped.",
      model: "mzizi-dna-helix",
      migrated_to: {
        "node detail": `https://mzizi.dev/api/v1/architecture/nodes/${encodeURIComponent(n)}`,
        architecture: "https://mzizi.dev/api/v1/architecture",
        "nodes + strands (MCP)": "get_node_documents",
      },
    },
    { status: 410, headers: CORS }
  )
}
