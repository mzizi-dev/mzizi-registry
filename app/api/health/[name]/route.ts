import { NextResponse } from "next/server"

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "no-cache, no-store",
}

const COMPONENT_NAME_PATTERN = /^[a-z][a-z0-9-]*$/

/**
 * GET /api/health/{name}
 *
 * Per-component health probe. N8 assurance components and external
 * synthetic-probes target this URL by component name to verify the
 * registry's view of a single component is healthy.
 *
 * Status semantics:
 *   400 — the name is not a valid component name
 *   503 — every valid name. The probe was gated on Supabase credentials that
 *         were never set on the registry Worker, so this is what production
 *         answered, body included; the registry now holds no database, and
 *         health events belong to the Mzizi console (mzizi-dev/mzizi-console).
 *         The body still names the two variables because changing it would
 *         change a public response — that is a follow-up, not part of the
 *         Supabase removal.
 *
 * `Cache-Control: no-cache, no-store` because callers want a fresh probe
 * — same convention as `/api/v1/health`.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params

  if (!COMPONENT_NAME_PATTERN.test(name)) {
    return NextResponse.json(
      { error: "Invalid component name", received: name },
      { status: 400, headers: CORS }
    )
  }

  return NextResponse.json(
    {
      status: "unknown",
      error: "Database not configured",
      message: "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    },
    { status: 503, headers: CORS }
  )
}
