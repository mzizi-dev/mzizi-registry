import { NextResponse } from "next/server"
import { createLogger } from "@/lib/observability"
import { createFundiIssue, getComponent, getFundiIssues, isSupabaseConfigured } from "@/lib/db"
import type { FundiIssueInsert } from "@/lib/db/types"
import { trackApiCall } from "@/lib/metrics"

const logger = createLogger("component-fundi")

const CORS_CACHE = {
  "Cache-Control": "public, max-age=60, s-maxage=300",
  "Access-Control-Allow-Origin": "*",
}

const CORS = { "Access-Control-Allow-Origin": "*" }

const COMPONENT_NAME_PATTERN = /^[a-z][a-z0-9-]*$/

/**
 * GET /api/fundi/{name}
 *
 * Open Fundi issues filtered by component_name. Same response shape as
 * `/api/v1/fundi?component={name}` but offered at the per-component URL
 * documented in the component-backlinks contract.
 *
 * POST /api/fundi/{name}
 *
 * Create a Fundi issue with `component_name` prefilled from the URL — so
 * L8 reporters that already know the component name don't have to repeat
 * it in the body. Body fields:
 *   - title (required)
 *   - body, status, severity, layer, source, github_issue_number, metadata
 *
 * If the body carries its own `component_name` and it disagrees with the
 * URL, returns 400.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ name: string }> }) {
  const start = Date.now()
  const { name } = await params

  if (!COMPONENT_NAME_PATTERN.test(name)) {
    trackApiCall({
      endpoint: "/api/fundi/[name]",
      durationMs: Date.now() - start,
      statusCode: 400,
    })
    return NextResponse.json(
      { error: "Invalid component name", received: name },
      { status: 400, headers: CORS }
    )
  }

  if (!isSupabaseConfigured()) {
    trackApiCall({
      endpoint: `/api/fundi/${name}`,
      durationMs: Date.now() - start,
      statusCode: 503,
    })
    return NextResponse.json({ error: "Database not configured" }, { status: 503, headers: CORS })
  }

  try {
    const issues = await getFundiIssues({ component_name: name })
    trackApiCall({
      endpoint: `/api/fundi/${name}`,
      durationMs: Date.now() - start,
      statusCode: 200,
    })
    return NextResponse.json(
      { data: issues, meta: { component: name, total: issues.length } },
      { headers: CORS_CACHE }
    )
  } catch (error) {
    logger.error("Component fundi list error", {
      error: error instanceof Error ? error : new Error(String(error)),
      data: { name },
    })
    trackApiCall({
      endpoint: `/api/fundi/${name}`,
      durationMs: Date.now() - start,
      statusCode: 500,
    })
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: CORS })
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ name: string }> }) {
  const start = Date.now()
  const { name } = await params

  if (!COMPONENT_NAME_PATTERN.test(name)) {
    trackApiCall({
      endpoint: "/api/fundi/[name]",
      durationMs: Date.now() - start,
      statusCode: 400,
    })
    return NextResponse.json(
      { error: "Invalid component name", received: name },
      { status: 400, headers: CORS }
    )
  }

  if (!isSupabaseConfigured()) {
    trackApiCall({
      endpoint: `/api/fundi/${name}`,
      durationMs: Date.now() - start,
      statusCode: 503,
    })
    return NextResponse.json({ error: "Database not configured" }, { status: 503, headers: CORS })
  }

  let payload: Partial<FundiIssueInsert>
  try {
    payload = (await request.json()) as Partial<FundiIssueInsert>
  } catch {
    trackApiCall({
      endpoint: `/api/fundi/${name}`,
      durationMs: Date.now() - start,
      statusCode: 400,
    })
    return NextResponse.json({ error: "Body must be valid JSON" }, { status: 400, headers: CORS })
  }

  if (!payload?.title || typeof payload.title !== "string") {
    trackApiCall({
      endpoint: `/api/fundi/${name}`,
      durationMs: Date.now() - start,
      statusCode: 400,
    })
    return NextResponse.json({ error: "`title` is required" }, { status: 400, headers: CORS })
  }

  if (
    payload.component_name &&
    typeof payload.component_name === "string" &&
    payload.component_name !== name
  ) {
    trackApiCall({
      endpoint: `/api/fundi/${name}`,
      durationMs: Date.now() - start,
      statusCode: 400,
    })
    return NextResponse.json(
      {
        error: "component_name in body conflicts with URL",
        url: name,
        body: payload.component_name,
      },
      { status: 400, headers: CORS }
    )
  }

  try {
    const component = await getComponent(name).catch(() => null)
    if (!component) {
      trackApiCall({
        endpoint: `/api/fundi/${name}`,
        durationMs: Date.now() - start,
        statusCode: 404,
      })
      return NextResponse.json(
        { error: `Component "${name}" not found` },
        { status: 404, headers: CORS }
      )
    }

    const insert: FundiIssueInsert = {
      title: payload.title,
      body: payload.body ?? null,
      status: payload.status ?? "open",
      severity: payload.severity ?? null,
      component_name: name,
      layer: payload.layer ?? component.layer ?? null,
      source: payload.source ?? null,
      github_issue_number: payload.github_issue_number ?? null,
      metadata: payload.metadata ?? null,
    }

    const issue = await createFundiIssue(insert)
    trackApiCall({
      endpoint: `/api/fundi/${name}`,
      durationMs: Date.now() - start,
      statusCode: 201,
    })
    return NextResponse.json({ data: issue }, { status: 201, headers: CORS })
  } catch (error) {
    logger.error("Component fundi create error", {
      error: error instanceof Error ? error : new Error(String(error)),
      data: { name },
    })
    trackApiCall({
      endpoint: `/api/fundi/${name}`,
      durationMs: Date.now() - start,
      statusCode: 500,
    })
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: CORS })
  }
}
