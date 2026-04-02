import { NextResponse } from "next/server"
import {
  LOCAL_DATA_LAYER,
  CLOUD_LAYER,
  DATA_OWNERSHIP_RULES,
} from "@/lib/architecture"
import { createLogger } from "@/lib/observability"
import {
  isSupabaseConfigured,
  isSeeded,
  getLocalDataLayer,
  getCloudLayer,
  getDataOwnership,
} from "@/lib/db"

const logger = createLogger("architecture")

export async function GET() {
  try {
    const useDb =
      isSupabaseConfigured() && (await isSeeded().catch(() => false))

    if (useDb) {
      const [dbLocal, dbCloud, dbOwnership] = await Promise.all([
        getLocalDataLayer().catch(() => null),
        getCloudLayer().catch(() => null),
        getDataOwnership().catch(() => null),
      ])

      if (dbLocal && dbLocal.length > 0) {
        const localDataLayer = dbLocal.map((t) => ({
          name: t.name,
          role: t.role,
          platform: t.platform,
          description: t.description,
          sovereignty: t.sovereignty,
        }))

        const cloudLayer = (dbCloud ?? []).map((s) => ({
          name: s.name,
          role: s.role,
          consistencyModel: s.consistency_model,
          database: s.database,
          dataCategories: s.data_categories,
          description: s.description,
          sovereignty: s.sovereignty,
        }))

        const dataOwnership = (dbOwnership ?? []).map((r) => ({
          category: r.category,
          consistencyModel: r.consistency_model,
          database: r.database,
          examples: r.examples,
          conflictResolution: r.conflict_resolution,
          ownership: r.ownership,
          description: r.description,
        }))

        logger.info("Data layer architecture served from Supabase")

        return NextResponse.json(
          {
            "@context": "https://schema.org",
            "@type": "TechArticle",
            name: "Mukoko Data Layer Architecture",
            localDataLayer,
            cloudLayer,
            dataOwnership,
          },
          {
            headers: {
              "Cache-Control": "public, max-age=3600, s-maxage=86400",
              "Access-Control-Allow-Origin": "*",
            },
          }
        )
      }
    }

    // Fallback to hardcoded constants
    logger.info("Data layer architecture served from constants")

    return NextResponse.json(
      {
        "@context": "https://schema.org",
        "@type": "TechArticle",
        name: "Mukoko Data Layer Architecture",
        localDataLayer: LOCAL_DATA_LAYER,
        cloudLayer: CLOUD_LAYER,
        dataOwnership: DATA_OWNERSHIP_RULES,
      },
      {
        headers: {
          "Cache-Control": "public, max-age=3600, s-maxage=86400",
          "Access-Control-Allow-Origin": "*",
        },
      }
    )
  } catch (error) {
    logger.error("Data layer API error", {
      error: error instanceof Error ? error : new Error(String(error)),
    })
    return NextResponse.json(
      { error: "Internal server error" },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      }
    )
  }
}
