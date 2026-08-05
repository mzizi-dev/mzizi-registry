import { NextResponse } from "next/server"
import { createLogger } from "@/lib/observability"
import { getAllAiInstructions } from "@/lib/db"
import { trackApiCall } from "@/lib/metrics"

const logger = createLogger("api")

const CORS_CACHE = {
  "Cache-Control": "public, max-age=300, s-maxage=3600",
  "Access-Control-Allow-Origin": "*",
}

const CORS = { "Access-Control-Allow-Origin": "*" }

/**
 * GET /api/v1/ai/instructions — List all AI instructions.
 */
export async function GET() {
  const start = Date.now()
  try {
    // The `isSupabaseConfigured()` guard that stood here is gone with the store it guarded.
    // Doctrine is MDX under `content/doctrine/` read through `lib/doctrine.ts` (CLAUDE.md
    // §15.17), so a missing anon key made this route answer 503 — "Database not configured" —
    // for content sitting in the deployed bundle, and pointed whoever hit it at a credential
    // that would not have helped. A precondition that no longer holds does not fail safe.

    const instructions = await getAllAiInstructions()

    const items = instructions.map((i) => ({
      name: i.name,
      target: i.target,
      title: i.title,
      description: i.description,
      version: i.version,
      updated_at: i.updated_at,
    }))

    trackApiCall({
      endpoint: "/api/v1/ai/instructions",
      durationMs: Date.now() - start,
      statusCode: 200,
    })

    return NextResponse.json(
      { data: items, meta: { total: items.length } },
      { headers: CORS_CACHE }
    )
  } catch (error) {
    logger.error("AI instructions error", {
      error: error instanceof Error ? error : new Error(String(error)),
    })
    trackApiCall({
      endpoint: "/api/v1/ai/instructions",
      durationMs: Date.now() - start,
      statusCode: 500,
    })
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: CORS })
  }
}
