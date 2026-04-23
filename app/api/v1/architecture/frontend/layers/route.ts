import { NextResponse } from "next/server"
import { createLogger } from "@/lib/observability"
import { isSupabaseConfigured, getArchitectureFrontendLayers } from "@/lib/db"

const logger = createLogger("architecture-frontend-layers")

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

    const rows = await getArchitectureFrontendLayers()

    const layers = rows.map((r) => ({
      layerNumber: r.layer_number,
      subLabel: r.sub_label,
      title: r.title,
      axisName: r.axis_name,
      role: r.role,
      description: r.description,
      covenant: r.covenant,
      stakeholder: r.stakeholder,
      implementationRules: r.implementation_rules,
      sortOrder: r.sort_order,
    }))

    logger.info("Frontend layers served", { data: { count: layers.length } })

    return NextResponse.json(
      {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "3D Frontend Architecture — Layers",
        description:
          "Ten layers of the 3D frontend architecture (L1 tokens through L10 documentation). Each layer belongs to exactly one axis.",
        itemListElement: layers,
      },
      { headers: CORS_CACHE }
    )
  } catch (error) {
    logger.error("Frontend layers API error", {
      error: error instanceof Error ? error : new Error(String(error)),
    })
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }
    )
  }
}
