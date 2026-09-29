import { NextResponse } from "next/server"
import { createLogger } from "@/lib/observability"
import { getComponentsByCategory, getComponentsByNode, searchComponents } from "@/lib/db"

const logger = createLogger("api")

const CORS_CACHE = {
  "Cache-Control": "public, max-age=300, s-maxage=3600",
  "Access-Control-Allow-Origin": "*",
}

const CORS = { "Access-Control-Allow-Origin": "*" }

/** Sent in `meta` (and as a `Deprecation` header) when a request filters with `?layer=`. */
const LAYER_DEPRECATION =
  "`layer` is a deprecated alias of `node` and will be removed. Filter with `?node=` instead."

/**
 * GET /api/v1/search?q=&node=&category=
 *
 * Searches the registry on disk: `q` is a case-insensitive substring of a component's name
 * or description, `node` is its node on the helix, `category` is one of its `categories`.
 * Parameters combine (AND); at least one is required.
 *
 * This answered 503 while it was gated on Supabase, and before that it filtered on
 * `layer` and `category` and projected `registry_type`: the retired database row's
 * field names. Registry items carry `node`, `categories` and `type`, so those filters
 * matched nothing and every hit came back as a bare name and description. It now reads
 * the fields the items have.
 *
 * `?layer=` still works, as a deprecated alias of `?node=`, so an old client keeps its
 * results rather than getting a 400. `node` wins when both are given.
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const q = (url.searchParams.get("q") ?? "").trim()
    const nodeParam = url.searchParams.get("node")?.trim() || null
    const layerParam = url.searchParams.get("layer")?.trim() || null
    const node = nodeParam ?? layerParam
    const viaLayer = nodeParam === null && layerParam !== null
    const category = url.searchParams.get("category")?.trim() || null

    let results
    if (q) {
      results = await searchComponents(q)
    } else if (node) {
      results = await getComponentsByNode(node)
    } else if (category) {
      results = await getComponentsByCategory(category)
    } else {
      return NextResponse.json(
        { error: "At least one of q, node, or category is required" },
        { status: 400, headers: CORS }
      )
    }

    if (node) results = results.filter((c) => typeof c.node === "number" && String(c.node) === node)
    if (category) results = results.filter((c) => (c.categories ?? []).includes(category))

    const data = results.map((c) => ({
      name: c.name,
      type: c.type,
      title: c.title,
      description: c.description,
      categories: c.categories,
      node: c.node,
      nodeLabel: c.nodeLabel,
    }))

    return NextResponse.json(
      {
        data,
        meta: {
          total: data.length,
          query: q || null,
          node,
          category,
          ...(viaLayer ? { deprecation: LAYER_DEPRECATION } : {}),
        },
      },
      { headers: viaLayer ? { ...CORS_CACHE, Deprecation: "true" } : CORS_CACHE }
    )
  } catch (error) {
    logger.error("Search error", {
      error: error instanceof Error ? error : new Error(String(error)),
    })
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: CORS })
  }
}
