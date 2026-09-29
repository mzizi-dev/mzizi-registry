import { NextResponse } from "next/server"
import { createLogger } from "@/lib/observability"
import { getChangelogEntries } from "@/lib/db"

const logger = createLogger("api")

const CORS_CACHE = {
  "Cache-Control": "public, max-age=600, s-maxage=3600",
  "Access-Control-Allow-Origin": "*",
}

const CORS = { "Access-Control-Allow-Origin": "*" }

/**
 * GET /api/v1/changelog — Full changelog, most recent first.
 */
export async function GET() {
  try {
    // No `isSupabaseConfigured()` guard: the release history is
    // `lib/changelog.generated.ts` now, generated from
    // `content/changelog/releases.json`. The guard used to be the whole
    // response on a deployment without database credentials.
    const entries = await getChangelogEntries()

    return NextResponse.json(
      { data: entries, meta: { total: entries.length } },
      { headers: CORS_CACHE }
    )
  } catch (error) {
    logger.error("Changelog error", {
      error: error instanceof Error ? error : new Error(String(error)),
    })
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: CORS })
  }
}
