import { NextResponse } from "next/server"

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "no-cache, no-store",
}

const COMPONENT_NAME_PATTERN = /^[a-z][a-z0-9-]*$/

/**
 * GET /api/chaos/{name}
 *
 * Documents the chaos surface for a single component — what fault classes
 * the N8 chaos lib (`registry:lib chaos`, installed by consumer apps via
 * the shadcn CLI) can inject against this target. Read-only.
 *
 * The actual chaos engine runs IN-PROCESS in consumer apps (not in this
 * portal) — this endpoint exists so N8 dashboards, fundi, and external
 * audits can enumerate the supported fault classes per component without
 * importing the chaos lib.
 *
 * POST /api/chaos/{name}
 *
 * 405 — chaos injection is in-process only by design. Returning 405 with
 * a body that points at the chaos lib install is the honest contract; the
 * portal must never accept "inject failure into a live component" calls
 * over the public internet.
 *
 * Status semantics:
 *   400 — the name is not a valid component name
 *   405 — POST attempted (intentional: see the route docstring above)
 *   503 — every valid name on GET. The manifest was gated on Supabase
 *         credentials that were never set on the registry Worker, so this is
 *         what production answered; the registry now holds no database, and
 *         chaos events belong to the Mzizi console (mzizi-dev/mzizi-console).
 */
export async function GET(_request: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params

  if (!COMPONENT_NAME_PATTERN.test(name)) {
    return NextResponse.json(
      { error: "Invalid component name", received: name },
      { status: 400, headers: CORS }
    )
  }

  return NextResponse.json({ error: "Database not configured" }, { status: 503, headers: CORS })
}

export async function POST() {
  return NextResponse.json(
    {
      error: "Method Not Allowed",
      message:
        "Chaos injection is in-process by design — this endpoint never accepts remote fault injection. Install the N8 chaos lib in your app: `npx shadcn@latest add https://api.mzizi.dev/v1/ui/chaos`.",
    },
    {
      status: 405,
      headers: { ...CORS, Allow: "GET, OPTIONS" },
    }
  )
}
