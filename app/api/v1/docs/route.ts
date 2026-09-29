import { NextResponse } from "next/server"

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "public, max-age=3600, s-maxage=86400",
}

/**
 * GET /api/v1/docs — Soft-410 Gone.
 *
 * Long-form documentation now lives in mzizi-dev/mzizi-docs, published
 * at docs.mzizi.dev. The `documentation_pages` Supabase table
 * is HISTORICAL.
 *
 * Returns HTTP 410 with a migration note so consumers know to fetch
 * the live docs site instead of relying on the API.
 */
export async function GET() {
  return NextResponse.json(
    {
      error: "Gone",
      message:
        "Long-form documentation now lives in the Mzizi docs site at https://docs.mzizi.dev (source: mzizi-dev/mzizi-docs). The documentation_pages Supabase table is historical.",
      migrated_to: {
        "3d-architecture": "https://docs.mzizi.dev/architecture/overview",
        "fundi-guide": "https://docs.mzizi.dev/tooling",
        "layer-decision-guide": "https://docs.mzizi.dev/architecture/nodes",
        "component-backlinks": "https://docs.mzizi.dev/architecture/backlinks",
        "brand-guidelines": "https://docs.mzizi.dev/foundations/overview",
        "semantic-tokens": "https://docs.mzizi.dev/foundations/tokens",
        introduction: "https://docs.mzizi.dev",
        installation: "https://docs.mzizi.dev/registry/consuming",
        "api-reference": "https://docs.mzizi.dev/registry/overview",
        contributing: "https://docs.mzizi.dev/registry/contributing",
      },
    },
    { status: 410, headers: CORS }
  )
}
