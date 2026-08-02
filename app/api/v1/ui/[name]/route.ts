import { NextResponse } from "next/server"
import { createLogger } from "@/lib/observability"
import { getComponent, isSupabaseConfigured } from "@/lib/db"
import { resolveComponentSource } from "@/lib/registry-source"
import { trackApiCall } from "@/lib/metrics"

const logger = createLogger("registry")

const CORS_CACHE = {
  "Cache-Control": "public, max-age=3600, s-maxage=86400",
  "Access-Control-Allow-Origin": "*",
}

/**
 * GET /api/v1/ui/[name] — Individual component with inline source
 *
 * Metadata comes from Supabase; the SOURCE comes from disk
 * (`components/registry/**`, via `@/lib/registry-source`). See
 * `docs/component-source-migration.md` — the database no longer holds a copy,
 * so a component whose file is missing is a 404 and never a 200 with an empty
 * body.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ name: string }> }) {
  const start = Date.now()
  try {
    const { name } = await params

    if (!name || typeof name !== "string") {
      trackApiCall({
        endpoint: "/api/v1/ui/[name]",
        durationMs: Date.now() - start,
        statusCode: 400,
      })
      return NextResponse.json(
        { error: "Invalid component name" },
        { status: 400, headers: { "Access-Control-Allow-Origin": "*" } }
      )
    }

    if (!isSupabaseConfigured()) {
      trackApiCall({
        endpoint: `/api/v1/ui/${name}`,
        durationMs: Date.now() - start,
        statusCode: 503,
        componentName: name,
      })
      return NextResponse.json(
        {
          error: "Database not configured",
          message: "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
        },
        { status: 503, headers: { "Access-Control-Allow-Origin": "*" } }
      )
    }

    const component = await getComponent(name)

    if (!component) {
      logger.warn("Component not found", { data: { name } })
      trackApiCall({
        endpoint: `/api/v1/ui/${name}`,
        durationMs: Date.now() - start,
        statusCode: 404,
        componentName: name,
      })
      return NextResponse.json(
        { error: `Component "${name}" not found in registry` },
        { status: 404, headers: { "Access-Control-Allow-Origin": "*" } }
      )
    }

    const source = resolveComponentSource(name, component.source_code)

    if (source === null) {
      logger.warn("Component has no source on disk or in the registry", { data: { name } })
      trackApiCall({
        endpoint: `/api/v1/ui/${name}`,
        durationMs: Date.now() - start,
        statusCode: 404,
        componentName: name,
      })
      return NextResponse.json(
        { error: `No source code available for "${name}"` },
        { status: 404, headers: { "Access-Control-Allow-Origin": "*" } }
      )
    }

    const files = component.files.map((file, i) => ({
      path: file.path,
      type: file.type,
      content: i === 0 ? source : "",
    }))

    logger.info("Component served", {
      data: { name, fileCount: files.length },
    })

    trackApiCall({
      endpoint: `/api/v1/ui/${name}`,
      durationMs: Date.now() - start,
      statusCode: 200,
      componentName: name,
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
    trackApiCall({ endpoint: "/api/v1/ui/[name]", durationMs: Date.now() - start, statusCode: 500 })
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }
    )
  }
}
