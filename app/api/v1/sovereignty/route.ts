import { NextResponse } from "next/server"
import {
  SOVEREIGNTY_SUMMARY,
  REMOVED_TECHNOLOGIES,
} from "@/lib/architecture"
import { createLogger } from "@/lib/observability"

const logger = createLogger("architecture")

export async function GET() {
  try {
    logger.info("Sovereignty assessments served")

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
