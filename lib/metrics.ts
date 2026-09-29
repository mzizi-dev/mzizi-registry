/**
 * Usage metrics — the public shape of `/api/v1/stats` and the observability page.
 *
 * Usage telemetry (`usage_events`) is machine-written data that lives in
 * Supabase, and the registry holds no database: the Mzizi console
 * (mzizi-dev/mzizi-console) is the only thing that talks to Supabase. This
 * module used to write an event per API call through the service-role client
 * and aggregate them back out through the anon client. Neither key was ever
 * set on the Worker, so every write was a no-op and every read returned the
 * zeroed dataset below. That zeroed dataset is what `/api/v1/stats` has always
 * served in production, so it is what this returns, unchanged in shape.
 */

// ── Payload types ───────────────────────────────────────────────────

export interface EndpointStat {
  endpoint: string
  total_calls: number
  error_calls: number
  avg_duration_ms: number
  p95_duration_ms: number
  error_rate: number
}

export interface ToolStat {
  tool_name: string
  total_calls: number
  error_calls: number
  avg_duration_ms: number
}

export interface ComponentStat {
  component_name: string
  total_calls: number
}

export interface UsageStats {
  period_days: number
  total_api_calls: number
  total_mcp_calls: number
  total_errors: number
  overall_error_rate: number
  avg_duration_ms: number
  top_endpoints: EndpointStat[]
  top_mcp_tools: ToolStat[]
  top_components: ComponentStat[]
  calls_by_day: Array<{ date: string; api_calls: number; mcp_calls: number; errors: number }>
}

/**
 * Aggregated usage statistics for the observability dashboard and /api/v1/stats.
 * Always the empty dataset for the period: the registry records no telemetry.
 */
export async function getUsageStats(periodDays = 30): Promise<UsageStats> {
  return emptyStats(periodDays)
}

function emptyStats(periodDays: number): UsageStats {
  return {
    period_days: periodDays,
    total_api_calls: 0,
    total_mcp_calls: 0,
    total_errors: 0,
    overall_error_rate: 0,
    avg_duration_ms: 0,
    top_endpoints: [],
    top_mcp_tools: [],
    top_components: [],
    calls_by_day: [],
  }
}
