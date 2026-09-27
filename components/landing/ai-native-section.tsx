"use client"

import { useState } from "react"
import { Section, SectionHeader } from "@/components/landing/section"
import { Check, Copy, Bot, Zap, BarChart2, FlaskConical } from "lucide-react"
import { LiveMcpStats } from "@/components/live-mcp-stats"

function CopySnippet({ code, label }: { code: string; label: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="group relative">
      <p className="mb-1.5 text-xs font-medium text-muted-foreground">{label}</p>
      <div className="flex items-start gap-2 rounded-[var(--radius-md)] border border-border bg-muted/50 px-4 py-3 font-mono text-xs">
        <code className="flex-1 break-all whitespace-pre-wrap text-foreground">{code}</code>
        <button
          onClick={() => {
            navigator.clipboard.writeText(code)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
          }}
          className="mt-0.5 shrink-0 text-muted-foreground transition-colors hover:text-foreground"
        >
          {copied ? (
            <Check className="size-3.5 text-[var(--color-malachite)]" />
          ) : (
            <Copy className="size-3.5" />
          )}
        </button>
      </div>
    </div>
  )
}

const mcpConfig = `{
  "mcpServers": {
    "mzizi": {
      "type": "url",
      "url": "https://mcp.mzizi.dev/mcp"
    }
  }
}`

const benchmarkProtocol = `# Phase 0 — same agent, same corpus, three languages
subjects:  Mzizi syntax · raw Dioxus · Leptos
corpus:    this registry, reauthored end to end
metrics:   tokens consumed
           iterations to a clean compile
           defect rate*

* defect = compiles cleanly, behaviorally wrong`

export function AiNativeSection() {
  return (
    <Section>
      <SectionHeader
        align="center"
        eyebrow="Machine authorship"
        title="Designed for the author that never sleeps"
        sub="The framework's thesis is that agents are the primary authors of the next web — so the project itself is run that way. The corpus is exposed to agents over MCP, the benchmark is defined in the open, and the telemetry is public."
      />

      <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* MCP Server */}
        <div className="flex flex-col gap-4 rounded-[var(--radius-xl)] border border-border bg-card p-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-cobalt)]/10">
              <Bot className="size-5 text-[var(--color-cobalt)]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">MCP Server</h3>
              <p className="text-xs text-muted-foreground">
                Streamable HTTP · <LiveMcpStats format="tools" />
              </p>
            </div>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Connect Claude Code, Cursor, or any MCP-compatible assistant to the benchmark corpus.
            Browse, search, and fetch component source — the same fixed component set the framework
            is measured against, live from the database.
          </p>
          <CopySnippet code={mcpConfig} label=".claude/settings.json" />
          <div className="mt-auto grid grid-cols-2 gap-1.5">
            {[
              "list_components",
              "get_component",
              "search_components",
              "scaffold_component",
              "get_design_tokens",
              "get_usage_stats",
            ].map((tool) => (
              <span
                key={tool}
                className="truncate rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground"
              >
                {tool}
              </span>
            ))}
          </div>
        </div>

        {/* The benchmark */}
        <div className="flex flex-col gap-4 rounded-[var(--radius-xl)] border border-border bg-card p-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-tanzanite)]/10">
              <FlaskConical className="size-5 text-[var(--color-tanzanite)]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">The Benchmark</h3>
              <p className="text-xs text-muted-foreground">Phase 0 · Defined before the results</p>
            </div>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            One experiment scores the whole thesis: an LLM agent authors Mzizi&apos;s own component
            corpus in Mzizi syntax versus raw Dioxus and Leptos. The protocol is fixed up front, so
            the numbers — good or bad — mean something.
          </p>
          <CopySnippet code={benchmarkProtocol} label="Benchmark protocol" />
          <ul className="mt-auto space-y-1.5 text-xs text-muted-foreground">
            {[
              "Fixed corpus — no cherry-picked tasks",
              "Same agent and harness for every language",
              "Tokens, iterations, and defects all reported",
              "Contract tests define “behaviorally wrong”",
              "Results published raw, not as marketing",
            ].map((f) => (
              <li key={f} className="flex items-center gap-2">
                <span className="size-1 shrink-0 rounded-full bg-[var(--color-tanzanite)]" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Open Data / Observability */}
        <div className="flex flex-col gap-4 rounded-[var(--radius-xl)] border border-border bg-card p-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-malachite)]/10">
              <BarChart2 className="size-5 text-[var(--color-malachite)]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Open Data</h3>
              <p className="text-xs text-muted-foreground">Public metrics · CC BY 4.0</p>
            </div>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Research telemetry is public — aligned with the Bundu open data philosophy. Corpus
            usage, API latency, error rates, and MCP tool traffic are live today; Phase 0 benchmark
            results land here when they exist.
          </p>
          <div className="space-y-2">
            <a
              href="/observability"
              className="flex items-center justify-between rounded-[var(--radius-md)] border border-border bg-muted/50 px-3 py-2 text-xs transition-colors hover:border-foreground/15"
            >
              <span className="font-mono text-foreground">/observability</span>
              <Zap className="size-3 text-[var(--color-malachite)]" />
            </a>
            <a
              href="/api/v1/stats"
              className="flex items-center justify-between rounded-[var(--radius-md)] border border-border bg-muted/50 px-3 py-2 text-xs transition-colors hover:border-foreground/15"
            >
              <span className="font-mono text-foreground">GET /api/v1/stats</span>
              <Copy className="size-3 text-muted-foreground" />
            </a>
          </div>
          <ul className="mt-auto space-y-1.5 text-xs text-muted-foreground">
            {[
              "Corpus usage and install counts",
              "API call volumes + latency",
              "MCP tool usage breakdown",
              "Error rates by endpoint",
              "Benchmark results, when they land",
            ].map((f) => (
              <li key={f} className="flex items-center gap-2">
                <span className="size-1 shrink-0 rounded-full bg-[var(--color-malachite)]" />
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  )
}
