import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import { createLogger } from "@/lib/observability"
import { getAllComponents, isSeeded } from "@/lib/db"

const logger = createLogger("registry")

/**
 * GET /api/v1/ui — Registry index
 *
 * Reads from PouchDB document store if seeded, falls back to registry.json.
 * This ensures backward compatibility while enabling the document store.
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

    const dbSeeded = await isSeeded().catch(() => false)

    if (dbSeeded) {
      // Read from document store
      const components = await getAllComponents()
      items = components.map((c) => ({
        name: c.name,
        type: c.registryType,
        description: c.description,
        dependencies: c.dependencies,
        registryDependencies: c.registryDependencies,
      }))
      logger.info("Registry index served from document store", {
        data: { itemCount: items.length },
      })
    } else {
      // Fallback to filesystem
      const registryPath = path.join(process.cwd(), "registry.json")
      if (!fs.existsSync(registryPath)) {
        throw new Error("registry.json not found and database not seeded")
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
      logger.info("Registry index served from filesystem (db not seeded)", {
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
      { status: 500 }
    )
  }
}
