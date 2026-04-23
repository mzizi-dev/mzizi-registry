import { NextResponse } from "next/server"
import { createLogger } from "@/lib/observability"
import { isSupabaseConfigured, getArchitectureFrontendAxes } from "@/lib/db"

const logger = createLogger("architecture-frontend-axes")

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

    const rows = await getArchitectureFrontendAxes()

    const axes = rows.map((r) => ({
      name: r.name,
      title: r.title,
      description: r.description,
      geometry: r.geometry,
      metaphor: r.metaphor,
      sortOrder: r.sort_order,
    }))

    logger.info("Frontend axes served", { data: { count: axes.length } })

    return NextResponse.json(
      {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "3D Frontend Architecture — Axes",
        description:
          "Five axes of the 3D frontend architecture: X (horizontal composition), Y (vertical infrastructure), Z (depth observation), Outside (actors beyond the build), Documentation (self-describing system).",
        itemListElement: axes,
      },
      { headers: CORS_CACHE }
    )
  } catch (error) {
    logger.error("Frontend axes API error", {
      error: error instanceof Error ? error : new Error(String(error)),
    })
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }
    )
  }
}
