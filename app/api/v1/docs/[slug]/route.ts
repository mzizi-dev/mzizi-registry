import { NextResponse } from "next/server"
import { trackApiCall } from "@/lib/metrics"

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "public, max-age=3600, s-maxage=86400",
}

/**
 * GET /api/v1/docs/[slug] — Soft-410 Gone.
 *
 * Long-form documentation moved into the repo as MDX. See
 * `app/api/v1/docs/route.ts` for the per-slug → URL migration map.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  trackApiCall({ endpoint: `/api/v1/docs/${slug}`, durationMs: 0, statusCode: 410 })
  return NextResponse.json(
    {
      error: "Gone",
      message:
        "Long-form documentation now lives in the repo as MDX. See GET /api/v1/docs for the per-slug → URL migration map, or browse https://design.nyuchi.com/docs.",
      slug,
    },
    { status: 410, headers: CORS }
  )
}
