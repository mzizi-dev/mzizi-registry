import { NextResponse } from "next/server"
import { createLogger } from "@/lib/observability"
import { getPipeline } from "@/lib/db"

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
