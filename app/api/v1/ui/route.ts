import { NextResponse } from "next/server"
import { createLogger } from "@/lib/observability"
import { getAllComponents } from "@/lib/db"

const logger = createLogger("registry")

const CORS_CACHE = {
  "Cache-Control": "public, max-age=3600, s-maxage=86400",
  "Access-Control-Allow-Origin": "*",
}

/**
 * GET /api/v1/ui — Registry index
 *
 * Reads all components from Supabase.
 */
export async function GET() {
  try {
    // The `isSupabaseConfigured()` guard that stood here is gone with the store it guarded.
    // `getAllComponents` reads `registry.json` and the files on disk, so a missing anon key
    // made the registry INDEX answer 503 for data in the deployed bundle — the one route a
    // consumer hits first.

    const components = await getAllComponents()
    const items = components.map((c) => ({
      name: c.name,
      type: c.registry_type,
      description: c.description,
      dependencies: c.dependencies,
      registryDependencies: c.registry_dependencies,
    }))

    logger.info("Registry index served", {
      data: { itemCount: items.length },
    })

    return NextResponse.json(
      {
        $schema: "https://ui.shadcn.com/schema/registry.json",
        name: "mukoko",
        homepage: "https://mzizi.dev",
        items,
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
