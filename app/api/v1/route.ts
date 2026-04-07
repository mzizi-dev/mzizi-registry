import { NextResponse } from "next/server"
import { createLogger } from "@/lib/observability"
import { isSupabaseConfigured, isSeeded, getDatabaseInfo } from "@/lib/db"

const logger = createLogger("api")

export async function GET() {
  try {
    let dbStatus = "not_configured"
    let componentCount = 0

    if (isSupabaseConfigured()) {
      const seeded = await isSeeded().catch(() => false)
      if (seeded) {
        dbStatus = "connected"
        const info = await getDatabaseInfo().catch(() => null)
        componentCount = info?.components ?? 0
      } else {
        dbStatus = "not_seeded"
      }
    }

    logger.info("API discovery served")

    return NextResponse.json(
      {
        $schema: "https://design.nyuchi.com/schema/api.json",
        "@context": "https://schema.org",
        "@type": "WebAPI",
        name: "Mukoko Architecture API",
        version: "1.0.0",
        description:
          "Unified API for the Mukoko ecosystem — components, brand, architecture, and design system.",
        homepage: "https://design.nyuchi.com",
        database: {
          status: dbStatus,
          components: componentCount,
        },
        resources: {
          brand: {
            href: "/api/v1/brand",
            description:
              "Brand system — Five African Minerals palette, typography, spacing, ecosystem brands.",
          },
          ui: {
            href: "/api/v1/ui",
            description: `Component registry — ${componentCount} items served from database.`,
          },
          ecosystem: {
            href: "/api/v1/ecosystem",
            description: "Architecture principles, framework decision, and Ubuntu philosophy.",
          },
          dataLayer: {
            href: "/api/v1/data-layer",
            description: "Local-first data layer and cloud services.",
          },
          pipeline: {
            href: "/api/v1/pipeline",
            description: "Open data pipeline — Redpanda, Flink, Doris.",
          },
          sovereignty: {
            href: "/api/v1/sovereignty",
            description: "Technology sovereignty assessments.",
          },
          health: {
            href: "/api/v1/health",
            description: "Service health check — database and registry status.",
          },
          db: {
            href: "/api/v1/db",
            description: "Document store status and seeding — Supabase (Postgres) backend.",
          },
          mcp: {
            href: "/mcp",
            description: "Model Context Protocol server — Streamable HTTP transport.",
          },
        },
      },
      {
        headers: {
          "Cache-Control": "public, max-age=3600, s-maxage=86400",
          "Access-Control-Allow-Origin": "*",
        },
      }
    )
  } catch (error) {
    logger.error("API discovery error", {
      error: error instanceof Error ? error : new Error(String(error)),
    })
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }
    )
  }
}
