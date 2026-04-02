import { NextResponse } from "next/server"
import { createLogger } from "@/lib/observability"
import {
  isSupabaseConfigured,
  isSeeded,
  getLocalDataLayer,
  getCloudLayer,
  getDataOwnership,
} from "@/lib/db"

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
          message:
            "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
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

    const [dbLocal, dbCloud, dbOwnership] = await Promise.all([
      getLocalDataLayer(),
      getCloudLayer(),
      getDataOwnership(),
    ])

    const localDataLayer = dbLocal.map((t) => ({
      name: t.name,
      role: t.role,
      platform: t.platform,
      description: t.description,
      sovereignty: t.sovereignty,
    }))

    const cloudLayer = dbCloud.map((s) => ({
      name: s.name,
      role: s.role,
      consistencyModel: s.consistency_model,
      database: s.database,
      dataCategories: s.data_categories,
      description: s.description,
      sovereignty: s.sovereignty,
    }))

    const dataOwnership = dbOwnership.map((r) => ({
      category: r.category,
      consistencyModel: r.consistency_model,
      database: r.database,
      examples: r.examples,
      conflictResolution: r.conflict_resolution,
      ownership: r.ownership,
      description: r.description,
    }))

    logger.info("Data layer architecture served")

    return NextResponse.json(
      {
        "@context": "https://schema.org",
        "@type": "TechArticle",
        name: "Mukoko Data Layer Architecture",
        localDataLayer,
        cloudLayer,
        dataOwnership,
      },
      { headers: CORS_CACHE }
    )
  } catch (error) {
    logger.error("Data layer API error", {
      error: error instanceof Error ? error : new Error(String(error)),
    })
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }
    )
  }
}
