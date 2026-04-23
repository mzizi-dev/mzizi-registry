// Nyuchi Design Portal — analytics edge function.
//
// Fire-and-forget ingest endpoint. Accepts usage events from the portal itself,
// from downstream ecosystem apps (mukoko-*, nhimbe, shamwari), and from the
// MCP server, then writes them to the `usage_events` table close to the
// database. Moving the insert off the Next.js critical path:
//   - isolates metric writes from request latency
//   - lets us batch + rate-limit without touching app code
//   - gives every ecosystem app a single public ingest URL
//
// Deploy:
//   supabase functions deploy analytics --project-ref grjsboqkaywpwatvrzmy
//
// Invoke:
//   POST https://<project>.supabase.co/functions/v1/analytics
//   Body (single event):
//     {
//       "event_type": "api_call" | "mcp_tool",
//       "endpoint": "/api/v1/ui",       // for api_call
//       "tool_name": "list_components", // for mcp_tool
//       "component_name": "button",     // optional
//       "duration_ms": 42,
//       "status_code": 200,             // for api_call
//       "is_error": false,              // derived if omitted
//       // Note: the live `usage_events` schema has no `source` column.
//       //       Extra fields in the body are accepted but dropped at
//       //       insert time. If per-ecosystem attribution becomes a
//       //       requirement, add a `source` column via a migration
//       //       first, then restore it here.
//     }
//   Body (batch): { "events": [ ... ] }
//
// The endpoint is intentionally anon-callable. Abuse guard: per-IP rate limit
// (see `checkRateLimit` below) and strict schema validation. No PII stored.

import { adminClient } from "../_shared/supabase.ts"
import { json, preflight } from "../_shared/cors.ts"

const MAX_BATCH = 100
const RATE_WINDOW_MS = 60_000
const RATE_LIMIT = 600 // events per minute per IP — generous for real usage

// In-memory rate-limit bucket. Edge functions are per-instance so this isn't
// cluster-wide, but any real abuse will still get throttled on the hottest
// instance. For stricter enforcement, move this into a Redis-backed table.
const rateBuckets = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const bucket = rateBuckets.get(ip)
  if (!bucket || bucket.resetAt < now) {
    rateBuckets.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS })
    return { allowed: true, remaining: RATE_LIMIT - 1 }
  }
  if (bucket.count >= RATE_LIMIT) {
    return { allowed: false, remaining: 0 }
  }
  bucket.count += 1
  return { allowed: true, remaining: RATE_LIMIT - bucket.count }
}

type EventType = "api_call" | "mcp_tool"

interface UsageEvent {
  event_type: EventType
  endpoint?: string
  tool_name?: string
  component_name?: string | null
  duration_ms?: number | null
  status_code?: number | null
  is_error?: boolean | null
}

function validateEvent(e: unknown): UsageEvent | string {
  if (!e || typeof e !== "object") return "event must be an object"
  const ev = e as Record<string, unknown>

  if (ev.event_type !== "api_call" && ev.event_type !== "mcp_tool") {
    return "event_type must be 'api_call' or 'mcp_tool'"
  }
  if (ev.event_type === "api_call" && (typeof ev.endpoint !== "string" || !ev.endpoint)) {
    return "api_call events require an endpoint string"
  }
  if (ev.event_type === "mcp_tool" && (typeof ev.tool_name !== "string" || !ev.tool_name)) {
    return "mcp_tool events require a tool_name string"
  }
  if (ev.duration_ms != null && typeof ev.duration_ms !== "number") {
    return "duration_ms must be a number"
  }
  if (ev.status_code != null && typeof ev.status_code !== "number") {
    return "status_code must be a number"
  }

  // `is_error` is NOT NULL in the live `usage_events` schema — always
  // emit a concrete boolean. Derive from status_code when possible,
  // otherwise default to false.
  const isError =
    typeof ev.is_error === "boolean"
      ? ev.is_error
      : typeof ev.status_code === "number"
        ? ev.status_code >= 400
        : false

  const normalised: UsageEvent = {
    event_type: ev.event_type,
    endpoint: typeof ev.endpoint === "string" ? ev.endpoint : undefined,
    tool_name: typeof ev.tool_name === "string" ? ev.tool_name : undefined,
    component_name: typeof ev.component_name === "string" ? ev.component_name : null,
    duration_ms: typeof ev.duration_ms === "number" ? ev.duration_ms : null,
    status_code: typeof ev.status_code === "number" ? ev.status_code : null,
    is_error: isError,
  }
  return normalised
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return preflight("POST, OPTIONS")
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405, methods: "POST, OPTIONS" })
  }

  // Rate limit by client IP (x-forwarded-for in Supabase edge).
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("cf-connecting-ip") ||
    "unknown"
  const { allowed, remaining } = checkRateLimit(ip)
  if (!allowed) {
    return json({ error: "Rate limit exceeded" }, { status: 429, methods: "POST, OPTIONS" })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return json({ error: "Invalid JSON body" }, { status: 400, methods: "POST, OPTIONS" })
  }

  const events: unknown[] = Array.isArray((body as Record<string, unknown>)?.events)
    ? ((body as Record<string, unknown>).events as unknown[])
    : [body]

  if (events.length === 0) {
    return json({ error: "No events provided" }, { status: 400, methods: "POST, OPTIONS" })
  }
  if (events.length > MAX_BATCH) {
    return json({ error: `Batch too large (max ${MAX_BATCH})` }, {
      status: 400,
      methods: "POST, OPTIONS",
    })
  }

  const validated: UsageEvent[] = []
  for (let i = 0; i < events.length; i++) {
    const result = validateEvent(events[i])
    if (typeof result === "string") {
      return json({ error: `Event ${i}: ${result}` }, { status: 400, methods: "POST, OPTIONS" })
    }
    validated.push(result)
  }

  const { error } = await adminClient().from("usage_events").insert(validated)
  if (error) {
    console.error("[fundi:analytics] insert failed", error)
    return json({ error: "Insert failed" }, { status: 500, methods: "POST, OPTIONS" })
  }

  return json(
    { accepted: validated.length, rate_limit_remaining: remaining },
    { status: 202, methods: "POST, OPTIONS" }
  )
})
