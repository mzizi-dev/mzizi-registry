import { NextResponse } from "next/server"
import { createLogger } from "@/lib/observability"
import { getAiInstruction, getAiInstructionByTarget, isSupabaseConfigured } from "@/lib/db"
import { trackApiCall } from "@/lib/metrics"

const logger = createLogger("api")

const CORS_CACHE = {
  "Cache-Control": "public, max-age=300, s-maxage=3600",
  "Access-Control-Allow-Origin": "*",
}

const CORS = { "Access-Control-Allow-Origin": "*" }

/**
 * GET /api/v1/ai/instructions/[name] — Single AI instruction.
 *
 * The [name] path parameter can be either a specific instruction name
 * (e.g. "nyuchi-mcp-system-prompt") OR a target audience (e.g. "claude",
 * "github-copilot", "cursor"). Name takes precedence; target is the fallback.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ name: string }> }) {
  const start = Date.now()
  try {
    const { name } = await params

    if (!name) {
      trackApiCall({
        endpoint: "/api/v1/ai/instructions/[name]",
        durationMs: Date.now() - start,
        statusCode: 400,
      })
      return NextResponse.json({ error: "Invalid name" }, { status: 400, headers: CORS })
    }

    if (!isSupabaseConfigured()) {
      trackApiCall({
        endpoint: `/api/v1/ai/instructions/${name}`,
        durationMs: Date.now() - start,
        statusCode: 503,
      })
      return NextResponse.json({ error: "Database not configured" }, { status: 503, headers: CORS })
    }

    const instruction = (await getAiInstruction(name)) ?? (await getAiInstructionByTarget(name))

    if (!instruction) {
      trackApiCall({
        endpoint: `/api/v1/ai/instructions/${name}`,
        durationMs: Date.now() - start,
        statusCode: 404,
      })
      return NextResponse.json(
        { error: `AI instruction "${name}" not found` },
        { status: 404, headers: CORS }
      )
    }

    trackApiCall({
      endpoint: `/api/v1/ai/instructions/${name}`,
      durationMs: Date.now() - start,
      statusCode: 200,
    })

    return NextResponse.json(instruction, { headers: CORS_CACHE })
  } catch (error) {
    logger.error("AI instruction error", {
      error: error instanceof Error ? error : new Error(String(error)),
    })
    trackApiCall({
      endpoint: "/api/v1/ai/instructions/[name]",
      durationMs: Date.now() - start,
      statusCode: 500,
    })
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: CORS })
  }
}
