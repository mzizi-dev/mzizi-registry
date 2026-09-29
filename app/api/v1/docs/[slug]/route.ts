import { NextResponse } from "next/server"

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "public, max-age=3600, s-maxage=86400",
}

/**
 * GET /api/v1/docs/[slug] — Soft-410 Gone.
 *
 * Long-form documentation moved to the Mzizi docs site at docs.mzizi.dev
 * (mzizi-dev/mzizi-docs). See `app/api/v1/docs/route.ts` for the per-slug → URL map.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return NextResponse.json(
    {
      error: "Gone",
      message:
        "Long-form documentation now lives in the standalone Mzizi docs site. See GET /api/v1/docs for the per-slug → URL migration map, or browse https://docs.mzizi.dev.",
      slug,
    },
    { status: 410, headers: CORS }
  )
}
