import { NextResponse } from "next/server"
import { createLogger } from "@/lib/observability"
import { getComponent, isSupabaseConfigured, isSeeded } from "@/lib/db"

const logger = createLogger("registry")

const CORS_CACHE = {
  "Cache-Control": "public, max-age=3600, s-maxage=86400",
  "Access-Control-Allow-Origin": "*",
}

/**
 * GET /api/v1/ui/[name] — Individual component with inline source
 *
 * Reads metadata and source code from Supabase.
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
        { status: 400, headers: { "Access-Control-Allow-Origin": "*" } }
      )
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        {
          error: "Database not configured",
          message:
            "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
        },
        { status: 503, headers: { "Access-Control-Allow-Origin": "*" } }
      )
    }

    if (!(await isSeeded().catch(() => false))) {
      return NextResponse.json(
        {
          error: "Database not seeded",
          message: "Run pnpm db:seed or POST /api/v1/db with action: seed.",
        },
        { status: 503, headers: { "Access-Control-Allow-Origin": "*" } }
      )
    }

    const component = await getComponent(name)

    if (!component) {
      logger.warn("Component not found", { data: { name } })
      return NextResponse.json(
        { error: `Component "${name}" not found in registry` },
        { status: 404, headers: { "Access-Control-Allow-Origin": "*" } }
      )
    }

    if (!component.source_code) {
      return NextResponse.json(
        { error: `No source code available for "${name}"` },
        { status: 404, headers: { "Access-Control-Allow-Origin": "*" } }
      )
    }

    const files = component.files.map((file, i) => ({
      path: file.path,
      type: file.type,
      content: i === 0 ? component.source_code! : "",
    }))

    logger.info("Component served", {
      data: { name, fileCount: files.length },
    })

    return NextResponse.json(
      {
        $schema: "https://ui.shadcn.com/schema/registry-item.json",
        name: component.name,
        type: component.registry_type,
        description: component.description,
        dependencies: component.dependencies,
        registryDependencies: component.registry_dependencies,
        files,
      },
      { headers: CORS_CACHE }
    )
  } catch (error) {
    logger.error("Registry item error", {
      error: error instanceof Error ? error : new Error(String(error)),
    })
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }
    )
  }
}
