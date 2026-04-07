import { NextResponse } from "next/server"
import { createLogger } from "@/lib/observability"
import {
  isSupabaseConfigured,
  isSeeded,
  getArchitecturePrinciples,
  getFrameworkDecision,
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

    const [dbPrinciples, dbFramework] = await Promise.all([
      getArchitecturePrinciples(),
      getFrameworkDecision(),
    ])

    const principles = dbPrinciples.map((p) => ({
      name: p.name,
      title: p.title,
      description: p.description,
      rationale: p.rationale,
      implementation: p.implementation,
    }))

    const frameworkDecision = dbFramework
      ? {
          name: dbFramework.name,
          approach: dbFramework.approach,
          framework: dbFramework.framework,
          rationale: dbFramework.rationale,
          sovereigntyAdvantage: dbFramework.sovereignty_advantage,
          platforms: dbFramework.platforms,
          harmonyOs: dbFramework.harmony_os,
        }
      : null

    logger.info("Ecosystem architecture served")

    return NextResponse.json(
      {
        "@context": "https://schema.org",
        "@type": "TechArticle",
        name: "Mukoko Ecosystem Architecture",
        principles,
        frameworkDecision,
      },
      { headers: CORS_CACHE }
    )
  } catch (error) {
    logger.error("Ecosystem API error", {
      error: error instanceof Error ? error : new Error(String(error)),
    })
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }
    )
  }
}
