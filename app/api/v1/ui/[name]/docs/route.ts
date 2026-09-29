import { NextResponse } from "next/server"
import { createLogger } from "@/lib/observability"
import { getComponentWithDocs } from "@/lib/db"

const logger = createLogger("api")

const CORS_CACHE = {
  "Cache-Control": "public, max-age=3600, s-maxage=86400",
  "Access-Control-Allow-Origin": "*",
}

const CORS = { "Access-Control-Allow-Origin": "*" }

/**
 * GET /api/v1/ui/[name]/docs — Component documentation.
 *
 * `getComponentWithDocs()` builds it from the item's `meta` block in `registry.json`:
 * use cases, variants, sizes, features, a11y notes and examples, plus the demo flag.
 *
 * This answered 503 `{"error":"Database not configured"}` while it was gated on Supabase
 * credentials the registry Worker never had, although nothing behind the gate was in a
 * database. api.mzizi.dev (mzizi-dev/mzizi-api-gateway) now serves this answer from the
 * same files, so the handler serves it too.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ name: string }> }) {
  try {
    const { name } = await params

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Invalid component name" }, { status: 400, headers: CORS })
    }

    const component = await getComponentWithDocs(name)

    if (!component) {
      return NextResponse.json(
        { error: `Component "${name}" not found` },
        { status: 404, headers: CORS }
      )
    }

    return NextResponse.json(
      {
        name: component.name,
        description: component.description,
        // `layer` and `category` were served here off `ComponentRow`, a shape this value
        // has not had since the registry moved to disk — both were always `undefined` and
        // `JSON.stringify` dropped them, so the payload silently lost two documented keys.
        // `layer` does not come back under any name: the axis/layer model is retired and
        // must not be served, nested or relabelled (§9). `node` is the unit that replaced
        // it, and unlike `layer` it is real — derived from the directory on disk.
        node: component.node,
        nodeLabel: component.nodeLabel,
        owner: component.meta?.owner,
        collection: component.meta?.collection,
        docs: component.docs ?? null,
        demo: component.demo ?? null,
      },
      { headers: CORS_CACHE }
    )
  } catch (error) {
    logger.error("Component docs error", {
      error: error instanceof Error ? error : new Error(String(error)),
    })
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: CORS })
  }
}
