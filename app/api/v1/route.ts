import { NextResponse } from "next/server"
import { createLogger } from "@/lib/observability"

const logger = createLogger("api")

export async function GET() {
  try {
    logger.info("API discovery served")

    return NextResponse.json(
      {
        $schema: "https://registry.mukoko.com/schema/api.json",
        "@context": "https://schema.org",
        "@type": "WebAPI",
        name: "Mukoko Architecture API",
        version: "1.0.0",
        description:
          "Unified API for the Mukoko ecosystem — components, brand, architecture, and design system.",
        homepage: "https://registry.mukoko.com",
        resources: {
          brand: {
            href: "/api/v1/brand",
            description:
              "Brand system — Five African Minerals palette, typography, spacing, ecosystem brands.",
          },
          ui: {
            href: "/api/v1/ui",
            description:
              "Component registry index — 70+ production-ready React UI components.",
          },
          ecosystem: {
            href: "/api/v1/ecosystem",
            description:
              "Architecture principles, framework decision, and Ubuntu philosophy.",
          },
          dataLayer: {
            href: "/api/v1/data-layer",
            description:
              "Local-first data layer (RxDB, SQLite, IndexedDB) and cloud services (Supabase, CouchDB).",
          },
          pipeline: {
            href: "/api/v1/pipeline",
            description:
              "Open data pipeline — Redpanda event streaming, Flink PII stripping, Doris analytics.",
          },
          sovereignty: {
            href: "/api/v1/sovereignty",
            description:
              "Technology sovereignty assessments for every technology in the stack.",
          },
          health: {
            href: "/api/v1/health",
            description: "Service health check — registry and filesystem status.",
          },
          db: {
            href: "/api/v1/db",
            description:
              "Document store status and seeding — PouchDB/CouchDB registry backend.",
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
      { status: 500 }
    )
  }
}
