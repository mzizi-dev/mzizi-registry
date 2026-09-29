import { NextResponse } from "next/server"
import { createLogger } from "@/lib/observability"
import { listSkills, skillsVersion } from "@/lib/skills"

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
 * The same shape as `GET /api/v1/skills`. The two routes overlap today;
 * reserving this URL keeps room to evolve the list route (filtering,
 * pagination) without breaking the contract the CLI's `skills update` depends
 * on for cheap drift detection.
 *
 * Both now read `@nyuchi/mzizi-skills` rather than the `get_skills_summary()`
 * SQL helper, so "cheap" is now free — no round trip at all.
 */
export async function GET() {
  try {
    const skills = listSkills()
    return NextResponse.json(
      { data: skills, meta: { count: skills.length, version: skillsVersion() } },
      { headers: CORS_CACHE }
    )
  } catch (error) {
    logger.error("Skills summary error", {
      error: error instanceof Error ? error : new Error(String(error)),
    })
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: CORS })
  }
}
