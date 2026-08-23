import type { Metadata } from "next"
import { Activity, BarChart2, Boxes, Clock, Code, FlaskConical, Zap } from "lucide-react"
import { getUsageStats } from "@/lib/metrics"
import { getHelixModel, helixClassOf, isSupabaseConfigured } from "@/lib/db"
import { NodeDistributionChart, HELIX_CLASS_COLOR } from "./charts"

export const metadata: Metadata = {
  title: "Measurement",
  description:
    "The measurement discipline of the Mzizi research program: the Phase 0 benchmark metrics (tokens, iterations to clean compile, defect rate), the contract-test verification pattern, and the live composition of the benchmark corpus.",
}

// ISR per issue #84: revalidate every 5 minutes. Long enough to keep
// the page cheap; short enough that open data stays fresh.
export const revalidate = 300

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return `${n}`
}

// ── Static charter content ─────────────────────────────────────────────
// Mzizi is a research program, and a research program is only as honest as
// its measurement. These are the Phase 0 benchmark's metrics — defined now,
// scored when the benchmark runs. No numbers appear here until they exist.

const BENCHMARK_METRICS = [
  {
    label: "M1 · Tokens consumed",
    body: "Total context-window tokens the benchmark agent spends authoring a component — reading, writing, and re-reading. Scores design goal G4: more logic per token means fewer tokens per finished component.",
  },
  {
    label: "M2 · Iterations to clean compile",
    body: "How many compile-fix loops the agent needs before the compiler accepts the code. Scores G1 and G2: an unambiguous grammar plus dense, machine-aimed errors should converge in fewer rounds.",
  },
  {
    label: "M3 · Defect rate",
    body: "The fraction of components that compile cleanly but are behaviorally wrong — they fail the behavior contract despite satisfying the type system. The metric that keeps the other two honest: fast, cheap, and wrong is not a result.",
  },
] as const

export default async function ObservabilityPage() {
  // Short-circuit to a graceful empty-state shell when Supabase env vars
  // are missing — the live panels below depend on the public-read tables.
  if (!isSupabaseConfigured()) {
    return <UnconfiguredState />
  }

  const [stats30, stats7, helix] = await Promise.all([
    getUsageStats(30).catch(() => null),
    getUsageStats(7).catch(() => null),
    getHelixModel().catch(() => ({ nodes: [], rungs: [], strands: [] })),
  ])

  // One bar per element of the corpus taxonomy — nodes then rungs, each
  // carrying its own classification so this chart and the architecture
  // explorer colour the same node the same way. Read straight off
  // `documentation-architecture-nodes`; nothing is capped and nothing is
  // keyed on a retired axis label.
  const nodeDistribution = [...helix.nodes, ...helix.rungs].map((element) => ({
    node_number: element.node_number,
    sub_label: element.sub_label,
    title: element.title,
    helix_class: helixClassOf(element),
    component_count: element.component_count,
  }))
  const corpusTotal = nodeDistribution.reduce((sum, d) => sum + d.component_count, 0)

  // Only legend entries actually present in the data — a fixed list would
  // re-introduce a hardcoded model.
  const legendClasses = [...new Set(nodeDistribution.map((d) => d.helix_class))]

  const s = stats30
  const s7 = stats7
  const totalCalls = (s?.total_api_calls ?? 0) + (s?.total_mcp_calls ?? 0)
  const avgMs = s?.avg_duration_ms ?? 0

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
      {/* Header */}
      <div className="mb-10">
        <div className="mb-2 flex items-center gap-2">
          <FlaskConical className="size-5 text-[var(--color-gold)]" />
          <span className="font-mono text-xs font-medium tracking-widest text-muted-foreground uppercase">
            Measurement · Phase 0
          </span>
        </div>
        <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Measurement
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          A research program is only as honest as its measurement. This page states how the Mzizi
          framework will be measured — the Phase 0 benchmark metrics and the contract-test pattern
          that verifies them — and shows the live composition of the benchmark corpus. No benchmark
          has been run yet; when results exist they will be published here as open data, not
          summarized in prose.
        </p>
      </div>

      {/* ── The three benchmark metrics ─────────────────────────────────── */}
      <div className="mb-8">
        <div className="mb-3 flex items-center gap-2">
          <BarChart2 className="size-4 text-[var(--color-gold)]" />
          <h2 className="text-sm font-semibold text-foreground">The Phase 0 benchmark metrics</h2>
        </div>
        <p className="mb-4 max-w-2xl text-xs leading-relaxed text-muted-foreground">
          One task, three arms: an agent authors the benchmark corpus in Mzizi syntax versus raw
          Dioxus and Leptos. Every arm is scored on the same three metrics.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          {BENCHMARK_METRICS.map((m) => (
            <div
              key={m.label}
              className="flex flex-col gap-2 rounded-[var(--radius-xl)] border border-border bg-card p-5"
            >
              <span className="font-mono text-[10px] tracking-widest text-[var(--color-gold)] uppercase">
                {m.label}
              </span>
              <p className="text-xs leading-relaxed text-muted-foreground">{m.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── The contract-test pattern ───────────────────────────────────── */}
      <div className="mb-8 rounded-[var(--radius-xl)] border border-border bg-card p-5">
        <h3 className="mb-2 text-sm font-semibold text-foreground">
          How a defect is caught: the contract test
        </h3>
        <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground">
          The corpus is fixed, known ground truth. Each component has a{" "}
          <span className="text-foreground">reference implementation read from disk</span> and a
          behavior contract derived from it. After the agent&apos;s output compiles, it runs against
          the contract; anything that{" "}
          <span className="text-foreground">compiles cleanly but fails the behavior contract</span>{" "}
          is recorded as a defect. The compiler judges form; the contract judges behavior — a
          benchmark that stopped at &ldquo;it compiles&rdquo; would reward exactly the failure mode
          the research is trying to eliminate.
        </p>
      </div>

      {/* ── Corpus composition ──────────────────────────────────────────── */}
      {nodeDistribution.length > 0 && (
        <div className="mb-8 rounded-[var(--radius-xl)] border border-border bg-card p-5">
          <div className="mb-1 flex items-center gap-2">
            <Boxes className="size-4 text-[var(--color-cobalt)]" />
            <h3 className="text-sm font-semibold text-foreground">
              Benchmark corpus composition ({fmt(corpusTotal)} components)
            </h3>
          </div>
          <p className="mb-4 text-xs text-muted-foreground">
            Every node and rung of the corpus taxonomy, read live from{" "}
            <span className="font-mono">documentation-architecture-nodes</span> and counted by{" "}
            <span className="font-mono">get_node_counts()</span>. This is the fixed component set
            all three benchmark arms author against.
          </p>
          <NodeDistributionChart data={nodeDistribution} />
          <div className="mt-3 flex flex-wrap gap-3 text-[10px] text-muted-foreground">
            {legendClasses.map((helixClass) => (
              <span key={helixClass} className="inline-flex items-center gap-1.5">
                <span
                  className="size-2 rounded-full"
                  style={{
                    background: HELIX_CLASS_COLOR[helixClass] ?? "var(--color-terracotta)",
                  }}
                />
                <span className="font-mono">{helixClass}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Corpus infrastructure telemetry ─────────────────────────────── */}
      <div className="mb-8">
        <div className="mb-3 flex items-center gap-2">
          <Activity className="size-4 text-[var(--color-malachite)]" />
          <h2 className="text-sm font-semibold text-foreground">Corpus infrastructure telemetry</h2>
        </div>
        <p className="mb-4 max-w-2xl text-xs leading-relaxed text-muted-foreground">
          The corpus is served through a public API and MCP server so agents and researchers can
          read the ground truth directly. This is telemetry for that infrastructure — not benchmark
          results.
        </p>
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
              sub: avgMs > 0 ? "across API + MCP" : undefined,
              icon: Clock,
              accent: "text-[var(--color-malachite)]",
            },
            {
              label: "Error rate (30d)",
              value: `${s?.overall_error_rate ?? 0}%`,
              sub: s ? `${fmt(s.total_errors)} errors` : undefined,
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

      {/* ── Empty state when no data ────────────────────────────────────── */}
      {totalCalls === 0 && (
        <div className="rounded-[var(--radius-xl)] border border-border bg-card px-8 py-16 text-center">
          <Activity className="mx-auto mb-4 size-10 text-muted-foreground/40" />
          <p className="font-semibold text-foreground">No usage data yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Telemetry is recorded as the corpus API and MCP server receive requests.
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
        Data refreshes every 5 minutes · Lookback window: 30 days ·{" "}
        <a href="/api/v1/stats" className="underline-offset-4 hover:underline">
          Raw JSON
        </a>{" "}
        available under CC BY 4.0 · Benchmark results will be published the same way when Phase 0
        runs
      </p>
    </div>
  )
}

/**
 * Rendered when `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
 * are missing — e.g. local clones with no `.env.local`. Keeps the page
 * chrome (so the route never hard-fails) and points the operator at the
 * env vars they need to set.
 */
function UnconfiguredState() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-2">
          <FlaskConical className="size-5 text-[var(--color-gold)]" />
          <span className="font-mono text-xs font-medium tracking-widest text-muted-foreground uppercase">
            Measurement · Phase 0
          </span>
        </div>
        <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Measurement
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          The measurement discipline of the Mzizi research program: benchmark metrics, the
          contract-test pattern, and live corpus composition.
        </p>
      </div>
      <div className="rounded-[var(--radius-xl)] border border-border bg-card px-8 py-16 text-center">
        <Activity className="mx-auto mb-4 size-10 text-muted-foreground/40" />
        <p className="font-semibold text-foreground">Database not configured</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Set <span className="font-mono">NEXT_PUBLIC_SUPABASE_URL</span> and{" "}
          <span className="font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</span> to load the live corpus
          composition and infrastructure telemetry (<span className="font-mono">usage_events</span>,{" "}
          <span className="font-mono">observability_events</span>).
        </p>
      </div>
    </div>
  )
}
