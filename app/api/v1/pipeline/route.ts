import { NextResponse } from "next/server"
import { OPEN_DATA_PIPELINE } from "@/lib/architecture"
import { createLogger } from "@/lib/observability"
import { isSupabaseConfigured, isSeeded, getPipeline } from "@/lib/db"

const logger = createLogger("architecture")

export async function GET() {
  try {
    const useDb =
      isSupabaseConfigured() && (await isSeeded().catch(() => false))

    if (useDb) {
      const dbPipeline = await getPipeline().catch(() => null)

      if (dbPipeline && dbPipeline.length > 0) {
        const stages = dbPipeline.map((p) => ({
          name: p.name,
          role: p.role,
          description: p.description,
          sovereignty: p.sovereignty,
        }))

        logger.info("Open data pipeline served from Supabase")

        return NextResponse.json(
          {
            "@context": "https://schema.org",
            "@type": "TechArticle",
            name: "Mukoko Open Data Pipeline",
            stages,
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
    logger.info("Open data pipeline served from constants")

    return NextResponse.json(
      {
        "@context": "https://schema.org",
        "@type": "TechArticle",
        name: "Mukoko Open Data Pipeline",
        stages: OPEN_DATA_PIPELINE,
      },
      {
        headers: {
          "Cache-Control": "public, max-age=3600, s-maxage=86400",
          "Access-Control-Allow-Origin": "*",
        },
      }
    )
  } catch (error) {
    logger.error("Pipeline API error", {
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
