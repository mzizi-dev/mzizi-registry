import { NextResponse } from "next/server"
import { createLogger } from "@/lib/observability"
import { isSupabaseConfigured, isSeeded, getPipeline } from "@/lib/db"

const logger = createLogger("architecture")

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

    if (!(await isSeeded().catch(() => false))) {
      return NextResponse.json(
        {
          error: "Database not seeded",
          message: "Run pnpm db:seed or POST /api/v1/db with action: seed.",
        },
        { status: 503, headers: { "Access-Control-Allow-Origin": "*" } }
      )
    }

    const dbPipeline = await getPipeline()

    const stages = dbPipeline.map((p) => ({
      name: p.name,
      role: p.role,
      description: p.description,
      sovereignty: p.sovereignty,
    }))

    logger.info("Open data pipeline served")

    return NextResponse.json(
      {
        "@context": "https://schema.org",
        "@type": "TechArticle",
        name: "Mukoko Open Data Pipeline",
        stages,
      },
      { headers: CORS_CACHE }
    )
  } catch (error) {
    logger.error("Pipeline API error", {
      error: error instanceof Error ? error : new Error(String(error)),
    })
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }
    )
  }
}
