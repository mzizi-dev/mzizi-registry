import { NextResponse } from "next/server"

const CORS = { "Access-Control-Allow-Origin": "*" }

/**
 * GET /api/v1/ui/[name]/versions — Component version history.
 *
 * Version history is machine-written data in Supabase (`component_versions`),
 * and the registry holds no database: the Mzizi console (mzizi-dev/mzizi-console)
 * is the only thing that talks to Supabase. Supabase was never configured on the
 * registry Worker, so this answered 503 in production — and it still does, with
 * the same body, so no consumer sees a change. The query that used to follow is
 * gone rather than kept behind a switch nothing can flip.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params

  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "Invalid component name" }, { status: 400, headers: CORS })
  }

  return NextResponse.json({ error: "Database not configured" }, { status: 503, headers: CORS })
}
