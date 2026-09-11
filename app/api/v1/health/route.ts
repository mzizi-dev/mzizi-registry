import { NextResponse } from "next/server"

interface HealthCheck {
  status: "pass" | "fail"
  latencyMs: number
  message?: string
  itemCount?: number
}

/**
 * GET /api/v1/health
 *
 * The API's own liveness. It touches no data source at all — not a database,
 * not the registry, not the doctrine tree. If this handler ran, the deployment
 * is serving; that is the entire claim, and it is the only one this endpoint is
 * in a position to make honestly.
 *
 * WHAT THIS USED TO BE, AND WHY IT CHANGED. It reported database health: one
 * check named `database`, which called `isSupabaseConfigured()` and then
 * `getDatabaseInfo()`, and returned `itemCount` — a row count — as evidence.
 * Any non-passing check made the whole response 503.
 *
 * The registry has no database going forwards. Everything is from disk. So the
 * old check had exactly two possible futures and both were wrong: report `fail`
 * and hand every uptime monitor a permanent 503 on a deployment that is working
 * perfectly, or keep a `database: pass` check alive by pointing it at something
 * that is not a database, which is a lie told to the one endpoint whose only
 * job is to not lie. It reported 503 — which is why the Worker's `/api/v1/health`
 * was red while every page on it rendered.
 *
 * A liveness probe that fabricates a healthy dependency is worse than no probe.
 * So the dependency is gone rather than faked, and what is left is true.
 *
 * WHAT IT REPORTS NOW. `status: "healthy"` and a `checks` object holding one
 * check, `api`, which passes because the handler executed. `checks.database` is
 * deliberately ABSENT rather than present-and-passing: a monitor asserting on
 * `checks.database.status` should break loudly and be rewired, not silently
 * read a green light for a component that no longer exists. `itemCount` is gone
 * for the same reason — it counted rows.
 *
 * The `HealthCheck` shape, the `status` / `timestamp` / `checks` / `version`
 * envelope, the `no-cache, no-store` header and the CORS header are all
 * unchanged, so a monitor reading `status` or the HTTP code needs no change.
 *
 * This is deliberately NOT a readiness probe. Whether the registry, the
 * doctrine tree or the palette loaded is a build-time question here — those are
 * inlined modules, and if one failed to build there is no deployment to ask.
 * Per-component health is `/api/health/{name}`.
 */
export async function GET() {
  const start = performance.now()

  const api: HealthCheck = {
    status: "pass",
    latencyMs: Math.round(performance.now() - start),
  }

  const checks = { api }
  const anyFailing = Object.values(checks).some((c) => c.status === "fail")
  const status = anyFailing ? "unhealthy" : "healthy"

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
