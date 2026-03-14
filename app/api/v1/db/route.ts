import { NextResponse } from "next/server"
import { createLogger } from "@/lib/observability"
import {
  getDatabaseInfo,
  isSeeded,
  getAllComponents,
  getDemoNames,
  getAllComponentDocs,
} from "@/lib/db"
import { seedDatabase } from "@/lib/db/seed"

const logger = createLogger("db")

/**
 * GET /api/v1/db — Database info and status
 */
export async function GET() {
  try {
    const [info, seeded, components, demoNames, docs] = await Promise.all([
      getDatabaseInfo(),
      isSeeded(),
      getAllComponents(),
      getDemoNames(),
      getAllComponentDocs(),
    ])

    return NextResponse.json(
      {
        status: seeded ? "seeded" : "empty",
        adapter: info.adapter,
        counts: {
          total: info.docCount,
          components: components.length,
          docs: docs.length,
          demos: demoNames.length,
        },
        sync: {
          remoteUrl: process.env.COUCHDB_URL ? "(configured)" : null,
          status: process.env.COUCHDB_URL ? "available" : "local-only",
        },
      },
      {
        headers: {
          "Cache-Control": "no-cache",
          "Access-Control-Allow-Origin": "*",
        },
      }
    )
  } catch (error) {
    logger.error("Database info error", {
      error: error instanceof Error ? error : new Error(String(error)),
    })
    return NextResponse.json(
      { error: "Failed to get database info" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/v1/db — Seed or reseed the database
 *
 * Body: { "action": "seed" | "reseed" }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const action = body.action ?? "seed"

    if (action === "seed" || action === "reseed") {
      const result = await seedDatabase({ force: action === "reseed" })

      logger.info("Database seeded", { data: { ...result } })

      return NextResponse.json({
        action,
        result,
        message: `Database ${action === "reseed" ? "re-" : ""}seeded successfully`,
      })
    }

    return NextResponse.json(
      { error: `Unknown action: ${action}. Use "seed" or "reseed".` },
      { status: 400 }
    )
  } catch (error) {
    logger.error("Database seed error", {
      error: error instanceof Error ? error : new Error(String(error)),
    })
    return NextResponse.json(
      { error: "Failed to seed database" },
      { status: 500 }
    )
  }
}
