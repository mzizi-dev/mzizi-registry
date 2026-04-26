import { NextResponse } from "next/server"
import { trackApiCall } from "@/lib/metrics"

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "public, max-age=3600, s-maxage=86400",
}

/**
 * GET /api/v1/docs — Soft-410 Gone.
 *
 * Long-form documentation moved into the repo as MDX (CLAUDE.md §15.18).
 * The `documentation_pages` Supabase table is HISTORICAL — content was
 * migrated in PR #57 to:
 *
 *   /architecture, /architecture/fundi, /architecture/layers,
 *   /architecture/component-backlinks, /brand, /foundations/tokens,
 *   /docs, /docs/installation, /docs/api-reference, /docs/contributing
 *
 * Returns HTTP 410 with a migration note so consumers know to fetch
 * the live MDX instead of relying on the API.
 */
export async function GET() {
  trackApiCall({ endpoint: "/api/v1/docs", durationMs: 0, statusCode: 410 })
  return NextResponse.json(
    {
      error: "Gone",
      message:
        "Long-form documentation now lives in the repo as MDX. The documentation_pages Supabase table is historical. See https://design.nyuchi.com/docs and CLAUDE.md §15.18.",
      migrated_to: {
        "3d-architecture": "https://design.nyuchi.com/architecture",
        "fundi-guide": "https://design.nyuchi.com/architecture/fundi",
        "layer-decision-guide": "https://design.nyuchi.com/architecture/layers",
        "component-backlinks": "https://design.nyuchi.com/architecture/component-backlinks",
        "brand-guidelines": "https://design.nyuchi.com/brand",
        "semantic-tokens": "https://design.nyuchi.com/foundations/tokens",
        introduction: "https://design.nyuchi.com/docs",
        installation: "https://design.nyuchi.com/docs/installation",
        "api-reference": "https://design.nyuchi.com/docs/api-reference",
        contributing: "https://design.nyuchi.com/docs/contributing",
      },
    },
    { status: 410, headers: CORS }
  )
}
