import { NextResponse } from "next/server"
import { createLogger } from "@/lib/observability"
import { isSupabaseConfigured, getDatabaseInfo, isSeeded } from "@/lib/db"

const logger = createLogger("health")

interface HealthCheck {
  status: "pass" | "fail"
  latencyMs: number
  message?: string
  itemCount?: number
}

async function checkDatabase(): Promise<HealthCheck & { seeded?: boolean }> {
  const start = performance.now()
  try {
    if (!isSupabaseConfigured()) {
      return {
        status: "fail",
        latencyMs: Math.round(performance.now() - start),
        message: "Supabase not configured",
      }
    }

    const [info, seeded] = await Promise.all([getDatabaseInfo(), isSeeded()])

    return {
      status: info.status === "connected" ? "pass" : "fail",
      latencyMs: Math.round(performance.now() - start),
      itemCount: info.components,
      seeded,
    }
  } catch (error) {
    return {
      status: "fail",
      latencyMs: Math.round(performance.now() - start),
      message: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * GET /api/v1/health
 *
 * Returns structured health status for monitoring.
 */
export async function GET() {
  const database = await checkDatabase()

  const checks = { database }
  const allPassing = Object.values(checks).every((c) => c.status === "pass")
  const anyFailing = Object.values(checks).some((c) => c.status === "fail")

  const status = anyFailing ? "unhealthy" : allPassing ? "healthy" : "degraded"

  if (status !== "healthy") {
    logger.warn("Health check degraded", {
      data: { status, checks },
    })
  }

  return NextResponse.json(
    {
      status,
      timestamp: new Date().toISOString(),
      checks,
      version: process.env.npm_package_version ?? "unknown",
    },
    {
      status: status === "healthy" ? 200 : 503,
      headers: {
        "Cache-Control": "no-cache, no-store",
        "Access-Control-Allow-Origin": "*",
      },
    }
  )
}
