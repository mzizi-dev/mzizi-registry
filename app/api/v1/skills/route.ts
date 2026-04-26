import { NextResponse } from "next/server"
import { createLogger } from "@/lib/observability"
import { isSupabaseConfigured, listSkills } from "@/lib/db"
import { trackApiCall } from "@/lib/metrics"

const logger = createLogger("skills-list")

const CORS_CACHE = {
  "Cache-Control": "public, max-age=3600, s-maxage=86400",
  "Access-Control-Allow-Origin": "*",
}

const CORS = { "Access-Control-Allow-Origin": "*" }

export const revalidate = 3600

/**
 * GET /api/v1/skills
 *
 * List every published skill from the Supabase `skills` table. Returns
 * the lightweight summary shape (no `body_mdx`) — use
 * `GET /api/v1/skills/{name}` to fetch a single skill's MDX body.
 *
 * Wraps the `list_skills()` SQL helper. Counts and metadata are joined
 * live; never hardcoded.
 */
export async function GET() {
  const start = Date.now()
  try {
    if (!isSupabaseConfigured()) {
      trackApiCall({
        endpoint: "/api/v1/skills",
        durationMs: Date.now() - start,
        statusCode: 503,
      })
      return NextResponse.json(
        {
          error: "Database not configured",
          message: "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
        },
        { status: 503, headers: CORS }
      )
    }

    const skills = await listSkills()
    trackApiCall({
      endpoint: "/api/v1/skills",
      durationMs: Date.now() - start,
      statusCode: 200,
    })

    return NextResponse.json(
      { data: skills, meta: { count: skills.length } },
      { headers: CORS_CACHE }
    )
  } catch (error) {
    logger.error("Skills list error", {
      error: error instanceof Error ? error : new Error(String(error)),
    })
    trackApiCall({
      endpoint: "/api/v1/skills",
      durationMs: Date.now() - start,
      statusCode: 500,
    })
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: CORS })
  }
}
