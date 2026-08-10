"use client"

/**
 * Where a fundi report becomes an issue.
 *
 * This said `nyuchi/design-portal`, the repo's name before the Mzizi rename —
 * it is `nyuchi/mzizi` now. GitHub redirects API calls for a renamed repo, so
 * this kept working and had no symptom, which is exactly why it survived: a
 * stale constant that still functions is invisible until the redirect is
 * retired, and then every consumer's reporter breaks at once.
 *
 * Mzizi's own tracker is the right destination and that is deliberate: a
 * consumer installs these components, so a defect they hit is a defect in this
 * registry, and it belongs where the fix will be made rather than in their
 * backlog.
 */
const GITHUB_REPO = "nyuchi/mzizi"

export interface FundiReport {
  component: string
  node: number
  severity: "low" | "medium" | "high" | "critical"
  errorType:
    | "render"
    | "network"
    | "data"
    | "auth"
    | "chain"
    | "crypto"
    | "timeout"
    | "a11y"
    | "perf"
    | "conformity"
    | "slo"
  source: string
  title: string
  description: string
  portalUrl?: string
  diagnostic?: Record<string, unknown>
  affectedMiniApps?: string[]
  blastRadius?: string[]
}

export interface ReporterConfig {
  githubToken?: string
  fundiEndpoint?: string
  cooldownSeconds?: number
  onReported?: (report: FundiReport, issueUrl?: string) => void
}

/* ─── Markdown neutralisation ───────────────────────────────────────────────
   Every field below originates in a runtime error message, and an error message
   carries user input whenever user input reaches an exception. GitHub sanitises
   rendered HTML, so the risk here is not script execution — it is CONTENT
   FORGERY: a newline plus `---` forges the "Filed by" provenance footer this
   file appends, and a `|` forges table columns. A triager trusts an automated
   issue's own footer without checking it, which is exactly what makes a forged
   one effective.                                                            */

/** Neutralise Markdown structure in an untrusted single-line value. */
function mdCell(s: string): string {
  return s.replace(/[\r\n]+/g, " ").replace(/([\\`*_{}[\]()#+\-.!|>])/g, "\\$1")
}

/** Make a value safe inside a backtick code span (a backtick closes it). */
function codeSpan(s: string): string {
  return s.replace(/[\r\n]+/g, " ").replace(/`/g, "'")
}

/** A URL becomes a link only if it is one; a `)` would terminate it early. */
function mdLink(label: string, url: string): string {
  const safe = /^https?:\/\//i.test(url) && !/[()\s]/.test(url)
  return safe ? `[${mdCell(label)}](${url})` : mdCell(url)
}

class FundiReporterCore {
  private config: ReporterConfig
  private cooldowns = new Map<string, number>()

  constructor(config: ReporterConfig = {}) {
    this.config = { cooldownSeconds: config.cooldownSeconds ?? 300, ...config }
  }

  async report(report: FundiReport): Promise<{ issueUrl?: string; queued: boolean }> {
    const lastReport = this.cooldowns.get(report.component)
    if (lastReport && Date.now() - lastReport < (this.config.cooldownSeconds ?? 300) * 1000) {
      return { queued: false }
    }
    this.cooldowns.set(report.component, Date.now())

    const labels = [
      `fundi:severity/${report.severity}`,
      `fundi:node/${report.node}`,
      `fundi:type/${report.errorType}`,
      `fundi:source/${report.source}`,
    ]

    const body = this.buildIssueBody(report)

    if (this.config.githubToken) {
      const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/issues`, {
        method: "POST",
        headers: {
          Authorization: `token ${this.config.githubToken}`,
          "Content-Type": "application/json",
          Accept: "application/vnd.github.v3+json",
        },
        body: JSON.stringify({ title: `[${report.component}] ${report.title}`, body, labels }),
      })
      const data = await res.json()
      this.config.onReported?.(report, data.html_url)
      return { issueUrl: data.html_url, queued: true }
    }

    if (this.config.fundiEndpoint) {
      await fetch(this.config.fundiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report, labels }),
      })
      this.config.onReported?.(report)
      return { queued: true }
    }

    console.warn("[mzizi:fundi-reporter] No endpoint configured.", report)
    return { queued: false }
  }

  private buildIssueBody(r: FundiReport): string {
    let b = "## Component Failure Report\n\n"
    b += `| Field | Value |\n|---|---|\n`
    b += `| Component | \`${codeSpan(r.component)}\` |\n`
    b += `| Node | ${r.node} |\n`
    b += `| Severity | ${mdCell(r.severity)} |\n`
    b += `| Error Type | ${mdCell(r.errorType)} |\n`
    b += `| Source | ${mdCell(r.source)} |\n`
    if (r.portalUrl) b += `| Portal | ${mdLink("View", r.portalUrl)} |\n`
    b += `\n### Description\n\n${mdCell(r.description)}\n`
    if (r.affectedMiniApps?.length)
      b += `\n### Affected Mini-Apps\n\n${r.affectedMiniApps.map(mdCell).join(", ")}\n`
    if (r.blastRadius?.length)
      b += `\n### Blast Radius\n\n${r.blastRadius.map((c) => `\`${codeSpan(c)}\``).join(", ")}\n`
    if (r.diagnostic)
      b += `\n### Diagnostic\n\n\`\`\`json\n${JSON.stringify(r.diagnostic, null, 2)}\n\`\`\`\n`
    b += "\n---\n*Filed by nyuchi-fundi-reporter (the N8 assurance to N9 fundi bridge)*\n"
    return b
  }
}

let _reporter: FundiReporterCore | null = null
export function getFundiReporter(config?: ReporterConfig): FundiReporterCore {
  if (!_reporter) _reporter = new FundiReporterCore(config)
  return _reporter
}
export function initFundiReporter(config: ReporterConfig): FundiReporterCore {
  _reporter = new FundiReporterCore(config)
  return _reporter
}
export type { FundiReporterCore }
