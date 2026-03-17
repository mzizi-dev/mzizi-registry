import { NextResponse } from "next/server"
import { BRAND_SYSTEM } from "@/lib/brand"
import { createLogger } from "@/lib/observability"

const logger = createLogger("brand")

export async function GET() {
  try {
    logger.info("Brand system served", {
      data: { version: BRAND_SYSTEM.version },
    })

    return NextResponse.json(BRAND_SYSTEM, {
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
        "Access-Control-Allow-Origin": "*",
      },
    })
  } catch (error) {
    logger.error("Brand API error", {
      error: error instanceof Error ? error : new Error(String(error)),
    })
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
