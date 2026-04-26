import { NextResponse } from "next/server"
import { createLogger } from "@/lib/observability"
import { getSkillsSummary, isSupabaseConfigured } from "@/lib/db"
import { trackApiCall } from "@/lib/metrics"

const logger = createLogger("skills-summary")

const CORS_CACHE = {
  "Cache-Control": "public, max-age=3600, s-maxage=86400",
  "Access-Control-Allow-Origin": "*",
}

const CORS = { "Access-Control-Allow-Origin": "*" }

export const revalidate = 3600

/**
 * GET /api/v1/skills/summary
 *
 * Lightweight skill index — same shape as `GET /api/v1/skills` but
 * served via the `get_skills_summary()` SQL helper. Useful for clients
 * that explicitly want the summary contract (e.g. the CLI's `skills
 * update` subcommand re-fetches this to detect version drift cheaply).
 *
 * The two routes overlap in shape today, but reserving the `/summary`
 * URL gives us room to evolve `GET /api/v1/skills` (e.g. add filtering,
 * pagination) without breaking the contract `nyuchi-design skills
 * update` depends on.
 */
export async function GET() {
  const start = Date.now()
  try {
    if (!isSupabaseConfigured()) {
      trackApiCall({
        endpoint: "/api/v1/skills/summary",
        durationMs: Date.now() - start,
        statusCode: 503,
      })
      return NextResponse.json({ error: "Database not configured" }, { status: 503, headers: CORS })
    }

    const skills = await getSkillsSummary()
    trackApiCall({
      endpoint: "/api/v1/skills/summary",
      durationMs: Date.now() - start,
      statusCode: 200,
    })

    return NextResponse.json(
      { data: skills, meta: { count: skills.length } },
      { headers: CORS_CACHE }
    )
  } catch (error) {
    logger.error("Skills summary error", {
      error: error instanceof Error ? error : new Error(String(error)),
    })
    trackApiCall({
      endpoint: "/api/v1/skills/summary",
      durationMs: Date.now() - start,
      statusCode: 500,
    })
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: CORS })
  }
}
