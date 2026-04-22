import { NextResponse } from "next/server"
import { createLogger } from "@/lib/observability"
import { getFundiIssues, createFundiIssue, isSupabaseConfigured } from "@/lib/db"
import type { FundiIssueFilters, FundiIssueInsert } from "@/lib/db/types"
import { trackApiCall } from "@/lib/metrics"

const logger = createLogger("api")

const CORS_CACHE = {
  "Cache-Control": "public, max-age=60, s-maxage=300",
  "Access-Control-Allow-Origin": "*",
}

const CORS = { "Access-Control-Allow-Origin": "*" }

/**
 * GET /api/v1/fundi — List Fundi healing issues.
 *
 * Query params:
 *   ?status=open|resolved  ?severity=low|medium|high  ?layer=1..10  ?limit=N
 */
export async function GET(request: Request) {
  const start = Date.now()
  try {
    if (!isSupabaseConfigured()) {
      trackApiCall({ endpoint: "/api/v1/fundi", durationMs: Date.now() - start, statusCode: 503 })
      return NextResponse.json({ error: "Database not configured" }, { status: 503, headers: CORS })
    }

    const url = new URL(request.url)
    const filters: FundiIssueFilters = {
      status: url.searchParams.get("status") ?? undefined,
      severity: url.searchParams.get("severity") ?? undefined,
      component_name: url.searchParams.get("component") ?? undefined,
      layer: url.searchParams.get("layer") ?? undefined,
      limit: url.searchParams.get("limit")
        ? Math.min(parseInt(url.searchParams.get("limit")!, 10) || 50, 200)
        : undefined,
    }

    const issues = await getFundiIssues(filters)

    trackApiCall({ endpoint: "/api/v1/fundi", durationMs: Date.now() - start, statusCode: 200 })

    return NextResponse.json(
      { data: issues, meta: { total: issues.length, filters } },
      { headers: CORS_CACHE }
    )
  } catch (error) {
    logger.error("Fundi list error", {
      error: error instanceof Error ? error : new Error(String(error)),
    })
    trackApiCall({ endpoint: "/api/v1/fundi", durationMs: Date.now() - start, statusCode: 500 })
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: CORS })
  }
}

/**
 * POST /api/v1/fundi — Create a Fundi issue (e.g. from L8 runtime reporting).
 *
 * Requires `X-API-Key` header matching env `FUNDI_API_KEY`. If the env var is
 * unset, the endpoint is disabled (returns 503) — opt-in write gate.
 */
export async function POST(request: Request) {
  const start = Date.now()
  try {
    if (!isSupabaseConfigured()) {
      trackApiCall({ endpoint: "/api/v1/fundi", durationMs: Date.now() - start, statusCode: 503 })
      return NextResponse.json({ error: "Database not configured" }, { status: 503, headers: CORS })
    }

    const expectedKey = process.env.FUNDI_API_KEY
    if (!expectedKey) {
      trackApiCall({ endpoint: "/api/v1/fundi", durationMs: Date.now() - start, statusCode: 503 })
      return NextResponse.json(
        { error: "Fundi write endpoint disabled (FUNDI_API_KEY not set)" },
        { status: 503, headers: CORS }
      )
    }

    const provided = request.headers.get("x-api-key")
    if (provided !== expectedKey) {
      trackApiCall({ endpoint: "/api/v1/fundi", durationMs: Date.now() - start, statusCode: 401 })
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: CORS })
    }

    const body = (await request.json().catch(() => null)) as FundiIssueInsert | null
    if (!body || typeof body.title !== "string" || !body.title.trim()) {
      trackApiCall({ endpoint: "/api/v1/fundi", durationMs: Date.now() - start, statusCode: 400 })
      return NextResponse.json(
        { error: "Missing or invalid 'title'" },
        { status: 400, headers: CORS }
      )
    }

    const created = await createFundiIssue(body)
    trackApiCall({ endpoint: "/api/v1/fundi", durationMs: Date.now() - start, statusCode: 201 })
    logger.info("Fundi issue created", { data: { id: created.id, title: created.title } })

    return NextResponse.json(created, { status: 201, headers: CORS })
  } catch (error) {
    logger.error("Fundi create error", {
      error: error instanceof Error ? error : new Error(String(error)),
    })
    trackApiCall({ endpoint: "/api/v1/fundi", durationMs: Date.now() - start, statusCode: 500 })
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: CORS })
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-API-Key",
      Allow: "GET, POST, OPTIONS",
    },
  })
}
