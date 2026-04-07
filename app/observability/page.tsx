import type { Metadata } from "next"
import {
  Activity,
  AlertTriangle,
  BarChart2,
  CheckCircle,
  Clock,
  Code,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react"
import { getUsageStats } from "@/lib/metrics"
import { getRegistryCounts } from "@/lib/db"
import { ObservabilityCharts } from "./charts"

export const metadata: Metadata = {
  title: "Observability",
  description:
    "Public API and MCP usage metrics for the Nyuchi Design Portal — open data for the community.",
}

export const revalidate = 60 // refresh every 60 seconds

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return `${n}`
}

function errorRateColor(rate: number): string {
  if (rate === 0) return "text-[var(--color-malachite)]"
  if (rate < 1) return "text-[var(--color-gold)]"
  return "text-destructive"
}

function uptimePct(errorRate: number): string {
  return `${(100 - errorRate).toFixed(1)}%`
}

export default async function ObservabilityPage() {
  const [stats30, stats7, counts] = await Promise.all([
    getUsageStats(30).catch(() => null),
    getUsageStats(7).catch(() => null),
    getRegistryCounts().catch(() => ({ total: 0, ui: 0, blocks: 0, hooks: 0, lib: 0 })),
  ])

  const s = stats30
  const s7 = stats7
  const totalCalls = (s?.total_api_calls ?? 0) + (s?.total_mcp_calls ?? 0)
  const errorRate = s?.overall_error_rate ?? 0
  const avgMs = s?.avg_duration_ms ?? 0

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
      {/* Header */}
      <div className="mb-10">
        <div className="mb-2 flex items-center gap-2">
          <Activity className="size-5 text-[var(--color-cobalt)]" />
          <span className="font-mono text-xs font-medium tracking-widest text-muted-foreground uppercase">
            Open Data
          </span>
        </div>
        <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Observability
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          Real-time usage metrics for the Nyuchi Design Portal API and MCP server. Public by design
          — aligned with the open data philosophy of the bundu ecosystem.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <a
            href="/api/v1/stats"
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <Code className="size-3" />
            GET /api/v1/stats
          </a>
          <a
            href="/api/v1/stats?days=7"
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <Code className="size-3" />
            GET /api/v1/stats?days=7
          </a>
        </div>
      </div>

      {/* ── Health banner ─────────────────────────────────────────────── */}
      <div
        className={`mb-8 flex items-center gap-3 rounded-[var(--radius-xl)] border px-5 py-4 ${
          errorRate === 0
            ? "border-[var(--color-malachite)]/30 bg-[var(--color-malachite)]/5"
            : errorRate < 2
              ? "border-[var(--color-gold)]/30 bg-[var(--color-gold)]/5"
              : "border-destructive/30 bg-destructive/5"
        }`}
      >
        {errorRate === 0 ? (
          <CheckCircle className="size-5 shrink-0 text-[var(--color-malachite)]" />
        ) : (
          <AlertTriangle className="size-5 shrink-0 text-[var(--color-gold)]" />
        )}
        <div>
          <p className="text-sm font-semibold text-foreground">
            {errorRate === 0
              ? "All systems operational"
              : errorRate < 2
                ? "Elevated error rate — monitoring"
                : "Degraded — investigating"}
          </p>
          <p className="text-xs text-muted-foreground">
            {uptimePct(errorRate)} uptime over the last 30 days · {fmt(totalCalls)} total requests
          </p>
        </div>
      </div>

      {/* ── Good metrics ──────────────────────────────────────────────── */}
      <div className="mb-4">
        <div className="mb-3 flex items-center gap-2">
          <TrendingUp className="size-4 text-[var(--color-malachite)]" />
          <h2 className="text-sm font-semibold text-foreground">Positive signals</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "API calls (30d)",
              value: fmt(s?.total_api_calls ?? 0),
              sub: s7 ? `${fmt(s7.total_api_calls)} this week` : undefined,
              icon: BarChart2,
              accent: "text-[var(--color-cobalt)]",
            },
            {
              label: "MCP tool calls (30d)",
              value: fmt(s?.total_mcp_calls ?? 0),
              sub: s7 ? `${fmt(s7.total_mcp_calls)} this week` : undefined,
              icon: Zap,
              accent: "text-[var(--color-tanzanite)]",
            },
            {
              label: "Avg response",
              value: avgMs > 0 ? `${avgMs}ms` : "—",
              sub: avgMs < 200 ? "fast" : avgMs < 500 ? "good" : "needs work",
              icon: Clock,
              accent: "text-[var(--color-malachite)]",
            },
            {
              label: "Registry items",
              value: counts.total > 0 ? fmt(counts.total) : "—",
              sub: counts.ui > 0 ? `${counts.ui} UI · ${counts.blocks} blocks` : undefined,
              icon: Activity,
              accent: "text-[var(--color-gold)]",
            },
          ].map((card) => (
            <div
              key={card.label}
              className="flex flex-col gap-2 rounded-[var(--radius-xl)] border border-border bg-card p-5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{card.label}</span>
                <card.icon className={`size-4 ${card.accent}`} />
              </div>
              <span className="font-mono text-2xl font-semibold text-foreground">{card.value}</span>
              {card.sub && <span className="text-xs text-muted-foreground">{card.sub}</span>}
            </div>
          ))}
        </div>
      </div>

      {/* ── Most popular components ───────────────────────────────────── */}
      {(s?.top_components?.length ?? 0) > 0 && (
        <div className="mb-8 rounded-[var(--radius-xl)] border border-border bg-card p-5">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Most requested components</h3>
          <div className="space-y-2">
            {s!.top_components.slice(0, 8).map((c, i) => {
              const max = s!.top_components[0].total_calls
              const pct = max > 0 ? (c.total_calls / max) * 100 : 0
              return (
                <div key={c.component_name} className="flex items-center gap-3">
                  <span className="w-4 shrink-0 text-right font-mono text-xs text-muted-foreground">
                    {i + 1}
                  </span>
                  <a
                    href={`/components/${c.component_name}`}
                    className="w-32 shrink-0 truncate font-mono text-xs text-foreground hover:text-[var(--color-cobalt)]"
                  >
                    {c.component_name}
                  </a>
                  <div className="min-w-0 flex-1 rounded-full bg-muted">
                    <div
                      className="h-1.5 rounded-full bg-[var(--color-cobalt)]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-10 shrink-0 text-right font-mono text-xs text-muted-foreground">
                    {fmt(c.total_calls)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Top MCP tools ─────────────────────────────────────────────── */}
      {(s?.top_mcp_tools?.length ?? 0) > 0 && (
        <div className="mb-8 rounded-[var(--radius-xl)] border border-border bg-card p-5">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Top MCP tools</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {s!.top_mcp_tools.slice(0, 6).map((t) => (
              <div
                key={t.tool_name}
                className="flex items-center justify-between rounded-[var(--radius-md)] bg-muted/50 px-3 py-2"
              >
                <span className="font-mono text-xs text-foreground">{t.tool_name}</span>
                <div className="flex items-center gap-3">
                  {t.avg_duration_ms > 0 && (
                    <span className="font-mono text-xs text-muted-foreground">
                      {t.avg_duration_ms}ms avg
                    </span>
                  )}
                  <span className="font-mono text-xs font-semibold text-foreground">
                    {fmt(t.total_calls)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Bad metrics ───────────────────────────────────────────────── */}
      <div className="mb-8">
        <div className="mb-3 flex items-center gap-2">
          <TrendingDown className="size-4 text-destructive" />
          <h2 className="text-sm font-semibold text-foreground">Error signals</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              label: "Total errors (30d)",
              value: fmt(s?.total_errors ?? 0),
              sub: "4xx + 5xx responses",
              bad: (s?.total_errors ?? 0) > 0,
            },
            {
              label: "Error rate",
              value: `${s?.overall_error_rate ?? 0}%`,
              sub: "% of all requests",
              bad: (s?.overall_error_rate ?? 0) >= 1,
            },
            {
              label: "Errors this week",
              value: fmt(s7?.total_errors ?? 0),
              sub: s7 ? `${s7.overall_error_rate}% of week traffic` : undefined,
              bad: (s7?.total_errors ?? 0) > 0,
            },
          ].map((card) => (
            <div
              key={card.label}
              className={`flex flex-col gap-2 rounded-[var(--radius-xl)] border bg-card p-5 ${
                card.bad ? "border-destructive/30" : "border-border"
              }`}
            >
              <span className="text-xs text-muted-foreground">{card.label}</span>
              <span
                className={`font-mono text-2xl font-semibold ${
                  card.bad ? "text-destructive" : errorRateColor(0)
                }`}
              >
                {card.value}
              </span>
              {card.sub && <span className="text-xs text-muted-foreground">{card.sub}</span>}
            </div>
          ))}
        </div>
      </div>

      {/* ── Endpoint error breakdown ───────────────────────────────────── */}
      {(s?.top_endpoints?.filter((e) => e.error_calls > 0).length ?? 0) > 0 && (
        <div className="mb-8 rounded-[var(--radius-xl)] border border-destructive/20 bg-card p-5">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Endpoints with errors</h3>
          <div className="space-y-2">
            {s!.top_endpoints
              .filter((e) => e.error_calls > 0)
              .sort((a, b) => b.error_rate - a.error_rate)
              .map((e) => (
                <div key={e.endpoint} className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="min-w-0 flex-1 truncate font-mono text-foreground">
                    {e.endpoint}
                  </span>
                  <span className="shrink-0 text-muted-foreground">{fmt(e.total_calls)} calls</span>
                  <span className="shrink-0 text-destructive">{e.error_rate}% errors</span>
                  <span className="shrink-0 text-muted-foreground">{e.p95_duration_ms}ms p95</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ── All endpoints table ────────────────────────────────────────── */}
      {(s?.top_endpoints?.length ?? 0) > 0 && (
        <div className="mb-8 rounded-[var(--radius-xl)] border border-border bg-card p-5">
          <h3 className="mb-4 text-sm font-semibold text-foreground">All endpoints (30d)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pr-4 pb-2 font-medium text-muted-foreground">Endpoint</th>
                  <th className="pr-4 pb-2 text-right font-medium text-muted-foreground">Calls</th>
                  <th className="pr-4 pb-2 text-right font-medium text-muted-foreground">Errors</th>
                  <th className="pr-4 pb-2 text-right font-medium text-muted-foreground">Avg ms</th>
                  <th className="pb-2 text-right font-medium text-muted-foreground">p95 ms</th>
                </tr>
              </thead>
              <tbody>
                {s!.top_endpoints.map((e) => (
                  <tr key={e.endpoint} className="border-b border-border/50 last:border-0">
                    <td className="py-2 pr-4 font-mono text-foreground">{e.endpoint}</td>
                    <td className="py-2 pr-4 text-right font-mono text-foreground">
                      {fmt(e.total_calls)}
                    </td>
                    <td
                      className={`py-2 pr-4 text-right font-mono ${e.error_calls > 0 ? "text-destructive" : "text-[var(--color-malachite)]"}`}
                    >
                      {e.error_calls > 0 ? fmt(e.error_calls) : "0"}
                    </td>
                    <td className="py-2 pr-4 text-right font-mono text-muted-foreground">
                      {e.avg_duration_ms}
                    </td>
                    <td className="py-2 text-right font-mono text-muted-foreground">
                      {e.p95_duration_ms}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Trend chart ────────────────────────────────────────────────── */}
      {(s?.calls_by_day?.length ?? 0) > 0 && (
        <div className="mb-8 rounded-[var(--radius-xl)] border border-border bg-card p-5">
          <h3 className="mb-1 text-sm font-semibold text-foreground">Traffic trend (30d)</h3>
          <p className="mb-4 text-xs text-muted-foreground">
            API calls · MCP tool calls · Errors — daily breakdown
          </p>
          <ObservabilityCharts data={s!.calls_by_day} />
        </div>
      )}

      {/* ── Empty state when no data ────────────────────────────────────── */}
      {totalCalls === 0 && (
        <div className="rounded-[var(--radius-xl)] border border-border bg-card px-8 py-16 text-center">
          <Activity className="mx-auto mb-4 size-10 text-muted-foreground/40" />
          <p className="font-semibold text-foreground">No usage data yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Metrics are recorded as the API and MCP server receive requests.
          </p>
          <a
            href="/api/v1/stats"
            className="mt-4 inline-block font-mono text-xs text-muted-foreground underline-offset-4 hover:underline"
          >
            GET /api/v1/stats
          </a>
        </div>
      )}

      {/* ── Footer note ────────────────────────────────────────────────── */}
      <p className="mt-10 text-center text-xs text-muted-foreground">
        Data refreshes every 60 seconds · Lookback window: 30 days ·{" "}
        <a href="/api/v1/stats" className="underline-offset-4 hover:underline">
          Raw JSON
        </a>{" "}
        available under CC BY 4.0
      </p>
    </div>
  )
}
