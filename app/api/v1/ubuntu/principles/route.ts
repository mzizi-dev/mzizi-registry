import { NextResponse } from "next/server"
import { createLogger } from "@/lib/observability"
import { isSupabaseConfigured, getUbuntuPrinciples } from "@/lib/db"

const logger = createLogger("ubuntu-principles")

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

    const rows = await getUbuntuPrinciples()

    const principles = rows.map((r) => ({
      name: r.name,
      shona: r.shona,
      title: r.title,
      description: r.description,
      expression: r.expression,
      source: r.source,
      sortOrder: r.sort_order,
    }))

    logger.info("Ubuntu principles served", { data: { count: principles.length } })

    return NextResponse.json(
      {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "Ubuntu Principles",
        description:
          "The five operating principles — rules that translate Ubuntu to software engineering decisions.",
        itemListElement: principles,
      },
      { headers: CORS_CACHE }
    )
  } catch (error) {
    logger.error("Ubuntu principles API error", {
      error: error instanceof Error ? error : new Error(String(error)),
    })
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }
    )
  }
}
