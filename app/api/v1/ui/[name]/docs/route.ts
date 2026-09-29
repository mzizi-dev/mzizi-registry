import { NextResponse } from "next/server"

const CORS = { "Access-Control-Allow-Origin": "*" }

/**
 * GET /api/v1/ui/[name]/docs — Component documentation.
 *
 * Answers 503 `{"error":"Database not configured"}`, which is what it answered
 * in production. It was gated on Supabase credentials that were never set on the
 * registry Worker, and the registry now holds no database at all.
 *
 * The data behind the gate is NOT in a database: `getComponentWithDocs()` in
 * `lib/db` builds it from each item's `meta` block in `registry.json`, and still
 * does. Serving it here would change a public response, so that is left to a
 * deliberate follow-up rather than slipped into the Supabase removal.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params

  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "Invalid component name" }, { status: 400, headers: CORS })
  }

  return NextResponse.json({ error: "Database not configured" }, { status: 503, headers: CORS })
}
