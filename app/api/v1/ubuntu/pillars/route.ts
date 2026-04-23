import { NextResponse } from "next/server"
import { createLogger } from "@/lib/observability"
import { isSupabaseConfigured, getUbuntuPillars } from "@/lib/db"

const logger = createLogger("ubuntu-pillars")

const CORS_CACHE = {
  "Cache-Control": "public, max-age=3600, s-maxage=86400",
  "Access-Control-Allow-Origin": "*",
}

export async function GET() {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        {
          error: "Database not configured",
          message: "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
        },
        { status: 503, headers: { "Access-Control-Allow-Origin": "*" } }
      )
    }

    const rows = await getUbuntuPillars()

    const pillars = rows.map((r) => ({
      name: r.name,
      shona: r.shona,
      title: r.title,
      description: r.description,
      sphere: r.sphere,
      platformSurface: r.platform_surface,
      source: r.source,
      sortOrder: r.sort_order,
    }))

    logger.info("Ubuntu pillars served", { data: { count: pillars.length } })

    return NextResponse.json(
      {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "Ubuntu Pillars",
        description:
          "The five pillars — spheres in which Ubuntu is lived. Each pillar maps a region of life to a platform surface so the doctrine translates to software.",
        itemListElement: pillars,
      },
      { headers: CORS_CACHE }
    )
  } catch (error) {
    logger.error("Ubuntu pillars API error", {
      error: error instanceof Error ? error : new Error(String(error)),
    })
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }
    )
  }
}
