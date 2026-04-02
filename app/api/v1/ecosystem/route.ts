import { NextResponse } from "next/server"
import {
  ARCHITECTURE_PRINCIPLES,
  FRAMEWORK_DECISION,
} from "@/lib/architecture"
import { createLogger } from "@/lib/observability"
import {
  isSupabaseConfigured,
  isSeeded,
  getArchitecturePrinciples,
  getFrameworkDecision,
} from "@/lib/db"

const logger = createLogger("architecture")

export async function GET() {
  try {
    const useDb =
      isSupabaseConfigured() && (await isSeeded().catch(() => false))

    if (useDb) {
      const [dbPrinciples, dbFramework] = await Promise.all([
        getArchitecturePrinciples().catch(() => null),
        getFrameworkDecision().catch(() => null),
      ])

      if (dbPrinciples && dbPrinciples.length > 0) {
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
          : FRAMEWORK_DECISION

        logger.info("Ecosystem architecture served from Supabase")

        return NextResponse.json(
          {
            "@context": "https://schema.org",
            "@type": "TechArticle",
            name: "Mukoko Ecosystem Architecture",
            principles,
            frameworkDecision,
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
    logger.info("Ecosystem architecture served from constants")

    return NextResponse.json(
      {
        "@context": "https://schema.org",
        "@type": "TechArticle",
        name: "Mukoko Ecosystem Architecture",
        principles: ARCHITECTURE_PRINCIPLES,
        frameworkDecision: FRAMEWORK_DECISION,
      },
      {
        headers: {
          "Cache-Control": "public, max-age=3600, s-maxage=86400",
          "Access-Control-Allow-Origin": "*",
        },
      }
    )
  } catch (error) {
    logger.error("Ecosystem API error", {
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
