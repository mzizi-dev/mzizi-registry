import { NextResponse } from "next/server"

const CORS = { "Access-Control-Allow-Origin": "*" }

/**
 * GET /api/v1/search?q=&layer=&category=
 *
 * Answers 503 `{"error":"Database not configured"}` for every query, which is
 * what it answered in production: it was gated on Supabase credentials that were
 * never set on the registry Worker, and the registry now holds no database.
 *
 * A search over the registry needs no database — `searchComponents()` in
 * `lib/db` is a substring match over `registry.json`. Turning it on would change
 * a public response (and its `layer` filter names the retired axis model), so it
 * is left to a deliberate follow-up rather than slipped into the Supabase removal.
 */
export async function GET() {
  return NextResponse.json({ error: "Database not configured" }, { status: 503, headers: CORS })
}
