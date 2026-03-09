import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import { createLogger } from "@/lib/observability"

const logger = createLogger("health")

interface HealthCheck {
  status: "pass" | "fail"
  latencyMs: number
  message?: string
}

async function checkRegistry(): Promise<HealthCheck & { itemCount?: number }> {
  const start = performance.now()
  try {
    const registryPath = path.join(process.cwd(), "registry.json")
    const raw = fs.readFileSync(registryPath, "utf-8")
    const registry = JSON.parse(raw)
    const itemCount = registry.items?.length ?? 0
    return {
      status: "pass",
      latencyMs: Math.round(performance.now() - start),
      itemCount,
    }
  } catch (error) {
    return {
      status: "fail",
      latencyMs: Math.round(performance.now() - start),
      message: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

async function checkFilesystem(): Promise<HealthCheck> {
  const start = performance.now()
  try {
    const testPath = path.join(process.cwd(), "package.json")
    fs.accessSync(testPath, fs.constants.R_OK)
    return {
      status: "pass",
      latencyMs: Math.round(performance.now() - start),
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
 * GET /api/health
 *
 * Returns structured health status for monitoring.
 * Compatible with Vercel, Datadog, and standard health check protocols.
 */
export async function GET() {
  const [registry, filesystem] = await Promise.all([
    checkRegistry(),
    checkFilesystem(),
  ])

  const checks = { registry, filesystem }
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
