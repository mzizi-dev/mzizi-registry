import { NextResponse } from "next/server"
import { createLogger } from "@/lib/observability"
import {
  isSupabaseConfigured,
  isSeeded,
  getSovereignty,
  getRemovedTechnologies,
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

    const [dbSovereignty, dbRemoved] = await Promise.all([
      getSovereignty(),
      getRemovedTechnologies(),
    ])

    const assessments = dbSovereignty.map((a) => ({
      technology: a.technology,
      role: a.role,
      license: a.license,
      governance: a.governance,
      sovereigntyRisk: a.sovereignty_risk,
      forkable: a.forkable,
      selfHostable: a.self_hostable,
      rationale: a.rationale,
    }))

    const removedTechnologies = dbRemoved.map((r) => ({
      name: r.name,
      previousRole: r.previous_role,
      reason: r.reason,
      replacement: r.replacement,
      migrationPath: r.migration_path,
    }))

    logger.info("Sovereignty assessments served")

    return NextResponse.json(
      {
        "@context": "https://schema.org",
        "@type": "TechArticle",
        name: "Mukoko Technology Sovereignty",
        assessments,
        removedTechnologies,
      },
      { headers: CORS_CACHE }
    )
  } catch (error) {
    logger.error("Sovereignty API error", {
      error: error instanceof Error ? error : new Error(String(error)),
    })
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }
    )
  }
}
