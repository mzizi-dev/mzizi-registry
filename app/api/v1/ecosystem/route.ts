import { NextResponse } from "next/server"
import { createLogger } from "@/lib/observability"
import { getArchitecturePrinciples, getFrameworkDecision } from "@/lib/db"

const logger = createLogger("architecture")

const CORS_CACHE = {
  "Cache-Control": "public, max-age=3600, s-maxage=86400",
  "Access-Control-Allow-Origin": "*",
}

export async function GET() {
  try {
    // The `isSupabaseConfigured()` guard that stood here is gone with the store it guarded.
    // Doctrine is MDX under `content/doctrine/` read through `lib/doctrine.ts` (CLAUDE.md
    // §15.17), so a missing anon key made this route answer 503 — "Database not configured" —
    // for content sitting in the deployed bundle, and pointed whoever hit it at a credential
    // that would not have helped. A precondition that no longer holds does not fail safe.

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
