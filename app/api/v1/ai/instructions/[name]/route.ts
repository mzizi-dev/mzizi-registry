import { NextResponse } from "next/server"
import { createLogger } from "@/lib/observability"
import { getAiInstruction, getAiInstructionByTarget } from "@/lib/db"

const logger = createLogger("api")

const CORS_CACHE = {
  "Cache-Control": "public, max-age=300, s-maxage=3600",
  "Access-Control-Allow-Origin": "*",
}

const CORS = { "Access-Control-Allow-Origin": "*" }

/**
 * GET /api/v1/ai/instructions/[name] — Single AI instruction set.
 *
 * The [name] path parameter can be either a specific instruction name
 * (e.g. "nyuchi-mcp-system-prompt") OR a target audience (e.g. "mcp-server",
 * "github-copilot", "claude-system-prompt"). Name takes precedence; target is the fallback.
 * The rows are doctrine on disk (`content/doctrine/ai-instructions`), the same ones
 * `/api/v1/ai/instructions` lists.
 *
 * This answered 503 `{"error":"Database not configured"}` while it was gated on Supabase
 * credentials the registry Worker never had. api.mzizi.dev (mzizi-dev/mzizi-api-gateway)
 * now serves this answer from the same files, so the handler serves it too.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ name: string }> }) {
  try {
    const { name } = await params

    if (!name) {
      return NextResponse.json({ error: "Invalid name" }, { status: 400, headers: CORS })
    }

    const instruction = (await getAiInstruction(name)) ?? (await getAiInstructionByTarget(name))

    if (!instruction) {
      return NextResponse.json(
        { error: `AI instruction "${name}" not found` },
        { status: 404, headers: CORS }
      )
    }

    return NextResponse.json(instruction, { headers: CORS_CACHE })
  } catch (error) {
    logger.error("AI instruction error", {
      error: error instanceof Error ? error : new Error(String(error)),
    })
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: CORS })
  }
}
