import { NextResponse } from "next/server"
import { createLogger } from "@/lib/observability"
import { getAllComponents } from "@/lib/db"

const logger = createLogger("registry")

const CORS_CACHE = {
  "Cache-Control": "public, max-age=3600, s-maxage=86400",
  "Access-Control-Allow-Origin": "*",
}

/**
 * Parse a positive integer query param. Returns undefined for absent/invalid rather than
 * erroring: a bad `limit` should not fail the one route every consumer hits first.
 */
function positiveInt(raw: string | null): number | undefined {
  if (raw === null || raw.trim() === "") return undefined
  const n = Number(raw)
  if (!Number.isInteger(n) || n < 0) return undefined
  return n
}

/**
 * GET /api/v1/ui — the registry index.
 *
 * This is the first route any consumer hits, and until now it served three fields per item:
 * `name`, `description`, `dependencies`. It looked like it served five — the mapping named
 * `type` and `registryDependencies` — but it read them off `c.registry_type` and
 * `c.registry_dependencies`, column names from the retired Supabase row shape. Those are
 * `undefined` on a registry item, and `JSON.stringify` drops undefined keys, so both
 * vanished silently. `getAllComponents` claimed `ComponentRow` through an `as unknown as`
 * cast, so TypeScript approved the whole thing.
 *
 * The index therefore violated its own advertised `$schema` (a shadcn registry item
 * requires `type`) and carried nothing to filter on, which is why the MCP's `node`, `owner`
 * and `category` filters returned zero rows for every value — they were filtering fields
 * that were never sent.
 *
 * FILTERS. `node`, `owner`, `collection` and `type` narrow the index server-side. Every
 * value comes from data already on the item — `node` from the directory the file lives in,
 * `owner`/`collection` from the authored `meta` block in `registry.json` (§6.1).
 *
 * `node` is UNCAPPED and an unknown one returns an empty list, never a 400 (§9). The node
 * set grows; a bound here is the defect regardless of its value.
 *
 * PAGINATION. `limit`/`offset` are opt-in and unset means "everything", so every existing
 * consumer — including `npx shadcn` — sees exactly what it saw before. They exist because
 * the full index is ~135 KB, which overflows an MCP client's token budget in one call.
 *
 * The shadcn keys (`$schema`, `name`, `homepage`, `items`) keep their shape and position;
 * `meta` is additive and ignored by the CLI.
 */
export async function GET(request: Request) {
  try {
    // The `isSupabaseConfigured()` guard that stood here is gone with the store it guarded.
    // `getAllComponents` reads `registry.json` and the files on disk, so a missing anon key
    // made the registry INDEX answer 503 for data in the deployed bundle — the one route a
    // consumer hits first.

    const params = new URL(request.url).searchParams
    const node = positiveInt(params.get("node"))
    const owner = params.get("owner")?.trim() || undefined
    const collection = params.get("collection")?.trim() || undefined
    const type = params.get("type")?.trim() || undefined
    const limit = positiveInt(params.get("limit"))
    const offset = positiveInt(params.get("offset")) ?? 0

    const components = await getAllComponents()

    const matched = components.filter((c) => {
      if (node !== undefined && c.node !== node) return false
      if (owner !== undefined && c.meta?.owner !== owner) return false
      if (collection !== undefined && c.meta?.collection !== collection) return false
      if (type !== undefined && c.type !== type) return false
      return true
    })

    const page = limit === undefined ? matched.slice(offset) : matched.slice(offset, offset + limit)

    const items = page.map((c) => ({
      name: c.name,
      type: c.type,
      title: c.title,
      description: c.description,
      categories: c.categories,
      dependencies: c.dependencies,
      registryDependencies: c.registryDependencies,
      // Everything below is what makes the index filterable. It was always on the item and
      // never projected, which is the whole of this defect.
      node: c.node,
      nodeLabel: c.nodeLabel,
      owner: c.meta?.owner,
      collection: c.meta?.collection,
    }))

    logger.info("Registry index served", {
      data: { itemCount: items.length, total: matched.length, node, owner, collection, type },
    })

    return NextResponse.json(
      {
        $schema: "https://ui.shadcn.com/schema/registry.json",
        // `registry.json` says `mzizi`; this said `mukoko`. The manifest is the authority.
        name: "mzizi",
        homepage: "https://mzizi.dev",
        items,
        meta: {
          /** Components matching the filters, before paging. */
          total: matched.length,
          /** Components in THIS response. */
          count: items.length,
          offset,
          limit: limit ?? null,
          /** The whole registry, ignoring filters — so a caller can tell a narrow filter from an empty registry. */
          registryTotal: components.length,
          filters: {
            node: node ?? null,
            owner: owner ?? null,
            collection: collection ?? null,
            type: type ?? null,
          },
        },
      },
      { headers: CORS_CACHE }
    )
  } catch (error) {
    logger.error("Registry index error", {
      error: error instanceof Error ? error : new Error(String(error)),
    })
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }
    )
  }
}
