import { NextResponse } from "next/server"
import {
  ARCHITECTURE_PRINCIPLES,
  FRAMEWORK_DECISION,
} from "@/lib/architecture"
import { createLogger } from "@/lib/observability"

const logger = createLogger("architecture")

export async function GET() {
  try {
    logger.info("Ecosystem architecture served")

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
      { status: 500 }
    )
  }
}
