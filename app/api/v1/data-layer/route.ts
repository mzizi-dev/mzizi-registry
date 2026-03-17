import { NextResponse } from "next/server"
import {
  LOCAL_DATA_LAYER,
  CLOUD_LAYER,
  DATA_OWNERSHIP_RULES,
} from "@/lib/architecture"
import { createLogger } from "@/lib/observability"

const logger = createLogger("architecture")

export async function GET() {
  try {
    logger.info("Data layer architecture served")

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
      { status: 500 }
    )
  }
}
