import { NextResponse } from "next/server"

const CORS = { "Access-Control-Allow-Origin": "*" }

/**
 * GET /api/v1/ui/[name]/versions — Component version history, which this API does not serve.
 *
 * Version history is machine-written data owned by the Mzizi console
 * (mzizi-dev/mzizi-console), the only thing in the estate that talks to Supabase. It is
 * not in the registry's files, and the registry holds no database, so this answers 503.
 *
 * The body used to be `{"error":"Database not configured"}`, which implied a database that
 * a credential would switch on. There is none. It now says why, with the same body
 * api.mzizi.dev (mzizi-dev/mzizi-api-gateway) serves.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params

  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "Invalid component name" }, { status: 400, headers: CORS })
  }

  return NextResponse.json(
    {
      error: "Version history is not served by this API",
      message:
        "Component version history is machine-written data owned by the Mzizi console " +
        "(app.mzizi.dev), not part of the registry's files. api.mzizi.dev serves those files " +
        "and has no database. Release history is at https://api.mzizi.dev/v1/changelog.",
    },
    { status: 503, headers: CORS }
  )
}
