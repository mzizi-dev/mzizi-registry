import { NextResponse } from "next/server"

const CORS = { "Access-Control-Allow-Origin": "*" }

/**
 * GET /api/v1/ai/instructions/[name] — Single AI instruction.
 *
 * Answers 503 `{"error":"Database not configured"}`, which is what it answered
 * in production. It was gated on Supabase credentials that were never set on the
 * registry Worker, and the registry now holds no database at all.
 *
 * The instructions themselves are doctrine on disk — `getAiInstruction()` and
 * `getAiInstructionByTarget()` in `lib/db` read `content/doctrine/ai-instructions`,
 * and `/api/v1/ai/instructions` already lists them. Serving a single one here
 * would change a public response, so that is left to a deliberate follow-up
 * rather than slipped into the Supabase removal.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params

  if (!name) {
    return NextResponse.json({ error: "Invalid name" }, { status: 400, headers: CORS })
  }

  return NextResponse.json({ error: "Database not configured" }, { status: 503, headers: CORS })
}
