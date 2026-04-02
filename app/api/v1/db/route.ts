import { NextResponse } from "next/server"
import { createLogger } from "@/lib/observability"
import {
  getDatabaseInfo,
  isSeeded,
  isSupabaseConfigured,
} from "@/lib/db"
import { seedDatabase } from "@/lib/db/seed"

const logger = createLogger("db")

/**
 * GET /api/v1/db — Database status
 */
export async function GET() {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        {
          status: "not_configured",
          provider: "supabase",
          message:
            "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable the document store.",
        },
        {
          headers: {
            "Cache-Control": "no-cache",
            "Access-Control-Allow-Origin": "*",
          },
        }
      )
    }

    const [info, seeded] = await Promise.all([getDatabaseInfo(), isSeeded()])

    const { status: dbStatus, ...counts } = info

    return NextResponse.json(
      {
        status: seeded ? "seeded" : "empty",
        dbStatus,
        ...counts,
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
      {
        status: 500,
        headers: {
          "Cache-Control": "no-cache",
          "Access-Control-Allow-Origin": "*",
        },
      }
    )
  }
}

/**
 * POST /api/v1/db — Seed the database from registry.json
 *
 * Body: { "action": "seed" }
 */
export async function POST(request: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "Supabase not configured" },
        {
          status: 503,
          headers: {
            "Access-Control-Allow-Origin": "*",
          },
        }
      )
    }

    const body = await request.json().catch(() => ({}))
    const action = body.action ?? "seed"

    if (action === "seed") {
      const result = await seedDatabase()

      logger.info("Database seeded", { data: { ...result } })

      return NextResponse.json(
        {
          action,
          result,
          message: "Database seeded successfully",
        },
        {
          headers: {
            "Access-Control-Allow-Origin": "*",
          },
        }
      )
    }

    return NextResponse.json(
      { error: `Unknown action: ${action}. Use "seed".` },
      {
        status: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      }
    )
  } catch (error) {
    logger.error("Database seed error", {
      error: error instanceof Error ? error : new Error(String(error)),
    })
    return NextResponse.json(
      { error: "Failed to seed database" },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      }
    )
  }
}
