import { NextResponse } from "next/server"
import { createLogger } from "@/lib/observability"
import { getLocalDataLayer, getCloudLayer, getDataOwnership } from "@/lib/db"

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
