import { NextResponse } from "next/server"
import { createLogger } from "@/lib/observability"
import { getComponent } from "@/lib/db"
import { readComponentSource } from "@/lib/registry-source"
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

    // The `isSupabaseConfigured()` guard that stood here is gone with the store it guarded.
    // `getComponent` reads `registry.json` and the files on disk, so a missing anon key
    // made this route answer 503 — "Database not configured" — for data sitting in the
    // deployed bundle. A precondition that no longer holds does not fail safe; it fails
    // loudly for no reason, and points whoever hits it at a credential that would not help.
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

    // A DATA item (registry:theme / registry:style) carries `cssVars`/`css` and no file.
    // Served before the source lookup, because there is no source to look up and the 404
    // below would otherwise hide the design tokens from every consumer.
    const isDataItem = Boolean(component.cssVars || component.css)
    if (isDataItem && !component.files?.length) {
      logger.info("Theme item served", {
        data: { name, cssVarGroups: Object.keys(component.cssVars ?? {}) },
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
          type: component.type,
          title: component.title,
          description: component.description,
          author: component.author,
          categories: component.categories,
          docs: component.docs,
          dependencies: component.dependencies,
          registryDependencies: component.registryDependencies,
          ...(component.cssVars ? { cssVars: component.cssVars } : {}),
          ...(component.css ? { css: component.css } : {}),
        },
        { headers: CORS_CACHE }
      )
    }

    const source = readComponentSource(name)

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

    // `files` is optional on a registry item, and an item without one is not installable.
    // Falling through to `.map()` would have thrown a 500 where a 404 is the honest answer.
    const declared = component.files ?? []

    // A component is ONE source file. `readComponentSource(name)` resolves it by component
    // NAME (components/registry/n<N>-<label>/<name>.<ext>), not by the install path, so
    // there is no second file to read and never was.
    //
    // This used to be `content: i === 0 ? source : ""` — every file after the first was
    // hardcoded to an empty string. Five components declared more files than exist, so
    // `npx shadcn add nyuchi-tokens` wrote lib/tokens/primitives.ts, semantic.ts and
    // components.ts as EMPTY FILES over whatever the consumer had. The doc comment on this
    // route promised the opposite in as many words — "a component whose file is missing is
    // a 404 and never a 200 with an empty body" — while the code below it did exactly that.
    //
    // Refusing is the only honest answer: an empty file is indistinguishable from a
    // deliberately empty module, so it fails at the consumer's build rather than here.
    if (declared.length > 1) {
      logger.error("Registry item declares more files than it has sources", {
        data: { name, declared: declared.map((f) => f.path) },
      })
      trackApiCall({
        endpoint: `/api/v1/ui/${name}`,
        durationMs: Date.now() - start,
        statusCode: 500,
        componentName: name,
      })
      return NextResponse.json(
        {
          error:
            `Registry item "${name}" declares ${declared.length} files but a component has ` +
            `exactly one source. This is a manifest bug in registry.json, not a bad request — ` +
            `serving it would hand you empty files.`,
        },
        { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }
      )
    }

    const files = declared.map((file) => ({
      path: file.path,
      type: file.type,
      content: source,
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
        type: component.type,
        // `title`, `author`, `categories` and `docs` are schema fields the CLI and any
        // registry browser display. They are generated onto every item, and were being
        // dropped here — present in registry.json, invisible to every consumer, which is
        // the same shape of bug as the missing `type`.
        title: component.title,
        description: component.description,
        author: component.author,
        categories: component.categories,
        docs: component.docs,
        dependencies: component.dependencies,
        registryDependencies: component.registryDependencies,
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
