import { NextResponse } from "next/server"
import { createLogger } from "@/lib/observability"
import { getSkill, isSupabaseConfigured } from "@/lib/db"
import { trackApiCall } from "@/lib/metrics"

const logger = createLogger("skill-by-name")

const CORS = { "Access-Control-Allow-Origin": "*" }

export const revalidate = 3600

const SKILL_NAME_PATTERN = /^[a-z][a-z0-9-]*$/

/**
 * GET /api/v1/skills/[name]
 *
 * Single skill (with full `body_mdx`) by name. Returns 404 if the skill
 * doesn't exist, 400 if the name doesn't match the kebab-case pattern,
 * 503 if Supabase is unconfigured.
 *
 * Response body is `application/json` containing the row. Consumers that
 * want the raw MDX body for direct write to disk should read
 * `data.body_mdx`. The CLI's `nyuchi-design skills install` command
 * does exactly that.
 *
 * The body MDX is content the agent will execute, so we serve it with
 * a 1h public / 1d s-maxage cache (skills change rarely; consumers
 * re-fetch lazily).
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

  if (!isSupabaseConfigured()) {
    trackApiCall({
      endpoint: `/api/v1/skills/${name}`,
      durationMs: Date.now() - start,
      statusCode: 503,
    })
    return NextResponse.json({ error: "Database not configured" }, { status: 503, headers: CORS })
  }

  try {
    const skill = await getSkill(name)
    if (!skill) {
      trackApiCall({
        endpoint: `/api/v1/skills/${name}`,
        durationMs: Date.now() - start,
        statusCode: 404,
      })
      return NextResponse.json(
        { error: `Skill "${name}" not found` },
        { status: 404, headers: CORS }
      )
    }

    trackApiCall({
      endpoint: `/api/v1/skills/${name}`,
      durationMs: Date.now() - start,
      statusCode: 200,
    })
    return NextResponse.json(
      { data: skill },
      {
        headers: {
          ...CORS,
          "Cache-Control": "public, max-age=3600, s-maxage=86400",
        },
      }
    )
  } catch (error) {
    logger.error("Skill fetch error", {
      error: error instanceof Error ? error : new Error(String(error)),
      data: { name },
    })
    trackApiCall({
      endpoint: `/api/v1/skills/${name}`,
      durationMs: Date.now() - start,
      statusCode: 500,
    })
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: CORS })
  }
}
