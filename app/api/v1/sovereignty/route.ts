import { NextResponse } from "next/server"
import {
  SOVEREIGNTY_SUMMARY,
  REMOVED_TECHNOLOGIES,
} from "@/lib/architecture"
import { createLogger } from "@/lib/observability"
import {
  isSupabaseConfigured,
  isSeeded,
  getSovereignty,
  getRemovedTechnologies,
} from "@/lib/db"

const logger = createLogger("architecture")

export async function GET() {
  try {
    const useDb =
      isSupabaseConfigured() && (await isSeeded().catch(() => false))

    if (useDb) {
      const [dbSovereignty, dbRemoved] = await Promise.all([
        getSovereignty().catch(() => null),
        getRemovedTechnologies().catch(() => null),
      ])

      if (dbSovereignty && dbSovereignty.length > 0) {
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

        const removedTechnologies = (dbRemoved ?? []).map((r) => ({
          name: r.name,
          previousRole: r.previous_role,
          reason: r.reason,
          replacement: r.replacement,
          migrationPath: r.migration_path,
        }))

        logger.info("Sovereignty assessments served from Supabase")

        return NextResponse.json(
          {
            "@context": "https://schema.org",
            "@type": "TechArticle",
            name: "Mukoko Technology Sovereignty",
            assessments,
            removedTechnologies,
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
    logger.info("Sovereignty assessments served from constants")

    return NextResponse.json(
      {
        "@context": "https://schema.org",
        "@type": "TechArticle",
        name: "Mukoko Technology Sovereignty",
        assessments: SOVEREIGNTY_SUMMARY,
        removedTechnologies: REMOVED_TECHNOLOGIES,
      },
      {
        headers: {
          "Cache-Control": "public, max-age=3600, s-maxage=86400",
          "Access-Control-Allow-Origin": "*",
        },
      }
    )
  } catch (error) {
    logger.error("Sovereignty API error", {
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
