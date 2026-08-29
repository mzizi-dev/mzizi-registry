import { NextResponse } from "next/server"
import { createLogger } from "@/lib/observability"
import { listSkills, skillsVersion } from "@/lib/skills"
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
 * Every published skill, without `body_mdx` — use `GET /api/v1/skills/{name}`
 * for one in full.
 *
 * Served from `@nyuchi/mzizi-skills`, the published bundle, not from Supabase.
 * The `isSupabaseConfigured()` guard that stood here is gone with the store it
 * guarded: a missing anon key made this route answer 503 for content that ships
 * in the deployment, and pointed whoever hit it at a credential that would not
 * have helped. See `lib/skills.ts` for why the database copy was removed.
 */
export async function GET() {
  const start = Date.now()
  try {
    const skills = listSkills()
    trackApiCall({
      endpoint: "/api/v1/skills",
      durationMs: Date.now() - start,
      statusCode: 200,
    })

    return NextResponse.json(
      { data: skills, meta: { count: skills.length, version: skillsVersion() } },
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
