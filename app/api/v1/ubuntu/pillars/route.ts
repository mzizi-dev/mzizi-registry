import { NextResponse } from "next/server"
import { createLogger } from "@/lib/observability"
import { getUbuntuPillars } from "@/lib/db"

const logger = createLogger("ubuntu-pillars")

const CORS_CACHE = {
  "Cache-Control": "public, max-age=3600, s-maxage=86400",
  "Access-Control-Allow-Origin": "*",
}

export async function GET() {
  try {
    // The `isSupabaseConfigured()` guard that stood here is gone with the store it guarded.
    // Doctrine is MDX under `content/doctrine/` read through `lib/doctrine.ts` (CLAUDE.md
    // §15.17), so a missing anon key made this route answer 503 — "Database not configured" —
    // for content sitting in the deployed bundle, and pointed whoever hit it at a credential
    // that would not have helped. A precondition that no longer holds does not fail safe.

    const rows = await getUbuntuPillars()

    const pillars = rows.map((r) => ({
      name: r.name,
      shona: r.shona,
      title: r.title,
      description: r.description,
      sphere: r.sphere,
      platformSurface: r.platform_surface,
      source: r.source,
      sortOrder: r.sort_order,
    }))

    logger.info("Ubuntu pillars served", { data: { count: pillars.length } })

    return NextResponse.json(
      {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "Ubuntu Pillars",
        description:
          "The five pillars — spheres in which Ubuntu is lived. Each pillar maps a region of life to a platform surface so the doctrine translates to software.",
        itemListElement: pillars,
      },
      { headers: CORS_CACHE }
    )
  } catch (error) {
    logger.error("Ubuntu pillars API error", {
      error: error instanceof Error ? error : new Error(String(error)),
    })
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }
    )
  }
}
