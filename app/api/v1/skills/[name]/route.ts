import { NextResponse } from "next/server"
import { createLogger } from "@/lib/observability"
import { getSkill, listSkillNames, skillsVersion } from "@/lib/skills"
import { trackApiCall } from "@/lib/metrics"

const logger = createLogger("skill-by-name")

const CORS = { "Access-Control-Allow-Origin": "*" }

const CORS_CACHE = {
  "Cache-Control": "public, max-age=3600, s-maxage=86400",
  "Access-Control-Allow-Origin": "*",
}

export const revalidate = 3600

const SKILL_NAME_PATTERN = /^[a-z][a-z0-9-]*$/

/**
 * GET /api/v1/skills/[name]
 *
 * One skill in full, including `body_mdx`. 400 on a name that is not
 * kebab-case, 404 when no such skill exists.
 *
 * Served from `@nyuchi/mzizi-skills` rather than Supabase — see `lib/skills.ts`.
 * The name pattern is kept even though the lookup is now an in-memory find:
 * rejecting a malformed name with 400 rather than 404 tells a caller their
 * request was wrong, not that the skill is missing.
 *
 * The body is content an agent will act on, so it is cached 1h public / 1d
 * shared. It can only change with a deployment now, which makes that cache
 * strictly safer than it was against a live table.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ name: string }> }) {
  const start = Date.now()
  const { name } = await params

  if (!SKILL_NAME_PATTERN.test(name)) {
    trackApiCall({
      endpoint: "/api/v1/skills/[name]",
      durationMs: Date.now() - start,
      statusCode: 400,
    })
    return NextResponse.json(
      { error: "Invalid skill name", received: name },
      { status: 400, headers: CORS }
    )
  }

  try {
    const skill = getSkill(name)
    if (!skill) {
      trackApiCall({
        endpoint: "/api/v1/skills/[name]",
        durationMs: Date.now() - start,
        statusCode: 404,
      })
      // Name the alternatives: the set is small, fixed at build time, and a
      // caller who mistyped is one line from the right answer.
      return NextResponse.json(
        { error: "Skill not found", received: name, available: listSkillNames() },
        { status: 404, headers: CORS }
      )
    }

    trackApiCall({
      endpoint: "/api/v1/skills/[name]",
      durationMs: Date.now() - start,
      statusCode: 200,
    })
    return NextResponse.json(
      { data: skill, meta: { version: skillsVersion() } },
      { headers: CORS_CACHE }
    )
  } catch (error) {
    logger.error("Skill fetch error", {
      error: error instanceof Error ? error : new Error(String(error)),
    })
    trackApiCall({
      endpoint: "/api/v1/skills/[name]",
      durationMs: Date.now() - start,
      statusCode: 500,
    })
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: CORS })
  }
}
