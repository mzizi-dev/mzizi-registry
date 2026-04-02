import { NextResponse } from "next/server"
import { OPEN_DATA_PIPELINE } from "@/lib/architecture"
import { createLogger } from "@/lib/observability"

const logger = createLogger("architecture")

export async function GET() {
  try {
    logger.info("Open data pipeline served")

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
