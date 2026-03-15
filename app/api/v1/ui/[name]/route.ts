import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import { createLogger } from "@/lib/observability"
import { getComponent, isSupabaseConfigured, isSeeded } from "@/lib/db"

const logger = createLogger("registry")

/**
 * GET /api/v1/ui/[name] — Individual component with inline source
 *
 * Reads metadata from Supabase if configured, falls back to registry.json.
 * Source code is always read from the filesystem (git-managed files).
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Invalid component name" },
        { status: 400 }
      )
    }

    let item: {
      name: string
      type: string
      description: string
      dependencies: string[]
      registryDependencies: string[]
      files: Array<{ path: string; type: string }>
    } | null = null

    const useDb =
      isSupabaseConfigured() && (await isSeeded().catch(() => false))

    if (useDb) {
      const component = await getComponent(name)
      if (component) {
        item = {
          name: component.name,
          type: component.registry_type,
          description: component.description,
          dependencies: component.dependencies,
          registryDependencies: component.registry_dependencies,
          files: component.files,
        }
      }
    }

    if (!item) {
      // Fallback to filesystem
      const registryPath = path.join(process.cwd(), "registry.json")
      if (!fs.existsSync(registryPath)) {
        return NextResponse.json(
          { error: "Registry not available" },
          { status: 500 }
        )
      }
      const raw = fs.readFileSync(registryPath, "utf-8")
      const registry = JSON.parse(raw)
      item = registry.items.find((i: { name: string }) => i.name === name)
    }

    if (!item) {
      logger.warn("Component not found", { data: { name } })
      return NextResponse.json(
        { error: `Component "${name}" not found in registry` },
        { status: 404 }
      )
    }

    // Source code is always from the filesystem (git-managed)
    const files: Array<{ path: string; type: string; content: string }> = []

    for (const file of item.files) {
      try {
        const filePath = path.join(process.cwd(), file.path)
        if (!fs.existsSync(filePath)) {
          logger.warn("File not found, skipping", {
            data: { filePath, component: name },
          })
          continue
        }
        const content = fs.readFileSync(filePath, "utf-8")
        files.push({ path: file.path, type: file.type, content })
      } catch (fileError) {
        logger.error(`Error reading file ${file.path}`, {
          error:
            fileError instanceof Error
              ? fileError
              : new Error(String(fileError)),
          data: { component: name },
        })
      }
    }

    if (files.length === 0) {
      return NextResponse.json(
        { error: `No source files available for "${name}"` },
        { status: 404 }
      )
    }

    logger.info("Component served", {
      data: { name, fileCount: files.length, source: useDb ? "supabase" : "fs" },
    })

    const registryItem = {
      $schema: "https://ui.shadcn.com/schema/registry-item.json",
      name: item.name,
      type: item.type,
      description: item.description || "",
      dependencies: item.dependencies || [],
      registryDependencies: item.registryDependencies || [],
      files,
    }

    return NextResponse.json(registryItem, {
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
        "Access-Control-Allow-Origin": "*",
      },
    })
  } catch (error) {
    logger.error("Registry item error", {
      error: error instanceof Error ? error : new Error(String(error)),
    })
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
