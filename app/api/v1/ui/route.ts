import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import { createLogger } from "@/lib/observability"
import { getAllComponents, isSupabaseConfigured, isSeeded } from "@/lib/db"

const logger = createLogger("registry")

/**
 * GET /api/v1/ui — Registry index
 *
 * Reads from Supabase if configured and seeded, falls back to registry.json.
 */
export async function GET() {
  try {
    let items: Array<{
      name: string
      type: string
      description: string
      dependencies: string[]
      registryDependencies: string[]
    }>

    const useDb =
      isSupabaseConfigured() && (await isSeeded().catch(() => false))

    if (useDb) {
      const components = await getAllComponents()
      items = components.map((c) => ({
        name: c.name,
        type: c.registry_type,
        description: c.description,
        dependencies: c.dependencies,
        registryDependencies: c.registry_dependencies,
      }))
      logger.info("Registry index served from Supabase", {
        data: { itemCount: items.length },
      })
    } else {
      // Fallback to filesystem
      const registryPath = path.join(process.cwd(), "registry.json")
      if (!fs.existsSync(registryPath)) {
        throw new Error("registry.json not found and database not available")
      }
      const raw = fs.readFileSync(registryPath, "utf-8")
      const registry = JSON.parse(raw)
      items = (registry.items ?? []).map(
        (item: {
          name: string
          type: string
          description?: string
          dependencies?: string[]
          registryDependencies?: string[]
        }) => ({
          name: item.name,
          type: item.type,
          description: item.description || "",
          dependencies: item.dependencies || [],
          registryDependencies: item.registryDependencies || [],
        })
      )
      logger.info("Registry index served from filesystem", {
        data: { itemCount: items.length },
      })
    }

    const index = {
      $schema: "https://ui.shadcn.com/schema/registry.json",
      name: "mukoko",
      homepage: "https://registry.mukoko.com",
      items,
    }

    return NextResponse.json(index, {
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
        "Access-Control-Allow-Origin": "*",
      },
    })
  } catch (error) {
    logger.error("Registry index error", {
      error: error instanceof Error ? error : new Error(String(error)),
    })
    return NextResponse.json(
      { error: "Internal server error" },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      }
    )
  }
}
