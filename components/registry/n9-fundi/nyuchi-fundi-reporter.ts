"use client"

const GITHUB_REPO = "nyuchi/design-portal"

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

    console.warn("[nyuchi:fundi-reporter] No endpoint configured.", report)
    return { queued: false }
  }

  private buildIssueBody(r: FundiReport): string {
    let b = "## Component Failure Report\n\n"
    b += `| Field | Value |\n|---|---|\n`
    b += `| Component | \`${r.component}\` |\n`
    b += `| Node | ${r.node} |\n`
    b += `| Severity | ${r.severity} |\n`
    b += `| Error Type | ${r.errorType} |\n`
    b += `| Source | ${r.source} |\n`
    if (r.portalUrl) b += `| Portal | [View](${r.portalUrl}) |\n`
    b += `\n### Description\n\n${r.description}\n`
    if (r.affectedMiniApps?.length)
      b += `\n### Affected Mini-Apps\n\n${r.affectedMiniApps.join(", ")}\n`
    if (r.blastRadius?.length)
      b += `\n### Blast Radius\n\n${r.blastRadius.map((c) => `\`${c}\``).join(", ")}\n`
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
