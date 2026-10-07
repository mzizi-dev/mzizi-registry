"use client"

/**
 * Where a fundi report becomes an issue: `mzizi-dev/mzizi-registry`.
 *
 * This said `nyuchi/design-portal`, then `nyuchi/mzizi`: each the registry's
 * name before a rename. GitHub redirects API calls for a renamed repo, so each
 * kept working and had no symptom, which is exactly why it survived: a stale
 * constant that still functions is invisible until the redirect is retired (or
 * the old name is claimed), and then every consumer's reporter breaks at once.
 *
 * Not `mzizi-dev/mzizi`: that is the Mzizi language, a different repository.
 *
 * Mzizi's own tracker is the right destination and that is deliberate: a
 * consumer installs these components, so a defect they hit is a defect in this
 * registry, and it belongs where the fix will be made rather than in their
 * backlog. A caller can still point it elsewhere with `githubRepo`.
 *
 * The Rust build exports the same value as `GITHUB_REPO`. The fundi Worker
 * (agent-tools `fundi/`) does not import either: its fallback is its own literal
 * (`env.GITHUB_REPO || "mzizi-dev/mzizi-registry"`), kept equal by hand.
 */
export const GITHUB_REPO = "mzizi-dev/mzizi-registry"

/** The GitHub REST endpoint issues are created at. Same as `issues_api_url` in the Rust build. */
export function issuesApiUrl(githubRepo: string = GITHUB_REPO): string {
  return `https://api.github.com/repos/${githubRepo}/issues`
}

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
  /**
   * Where a browser sends reports: your own server route or the fundi Worker,
   * which holds the GitHub credential. The supported path in client code.
   */
  fundiEndpoint?: string
  /**
   * @deprecated in client code. A token passed here ships in the bundle to every
   * visitor, so in a browser the reporter never sends it: it warns, and uses
   * `fundiEndpoint` instead or files nothing. It is honoured only where there
   * is no `window` (a server, a Worker, a build script).
   */
  githubToken?: string
  /** The `owner/repo` issues are filed at when filing directly. Defaults to `GITHUB_REPO`. */
  githubRepo?: string
  cooldownSeconds?: number
  onReported?: (report: FundiReport, issueUrl?: string) => void
}

/**
 * What happened to a report. `queued` is true only when the destination
 * accepted it (a 2xx, and for GitHub a readable issue). Otherwise `reason` says
 * why, and `status` carries the HTTP status where there was one. Error messages
 * are never included: they can carry user input.
 */
export interface ReportResult {
  queued: boolean
  issueUrl?: string
  reason?: "cooldown" | "no-endpoint" | "token-in-browser" | "http-error" | "network-error" | "invalid-response"
  status?: number
}

/** True in a browser, where anything in this module's config is public. */
function inBrowser(): boolean {
  return typeof globalThis.window !== "undefined"
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

  /**
   * The cooldown key: component AND error type, as in the Rust build. Keyed on
   * the component alone, a render bug and a network bug on one component shared
   * a bucket and the second was silently dropped for the cooldown window.
   */
  private cooldownKey(report: FundiReport): string {
    return `${report.component}:${report.errorType}`
  }

  async report(report: FundiReport): Promise<ReportResult> {
    const key = this.cooldownKey(report)
    const lastReport = this.cooldowns.get(key)
    if (
      lastReport !== undefined &&
      Date.now() - lastReport < (this.config.cooldownSeconds ?? 300) * 1000
    ) {
      return { queued: false, reason: "cooldown" }
    }

    const labels = [
      `fundi:severity/${report.severity}`,
      `fundi:node/${report.node}`,
      `fundi:type/${report.errorType}`,
      `fundi:source/${report.source}`,
    ]

    let githubToken = this.config.githubToken
    if (githubToken && inBrowser()) {
      console.warn(
        "[mzizi:fundi-reporter] githubToken is ignored in a browser: it would ship to every visitor. " +
          "Send reports to a fundiEndpoint that holds the credential."
      )
      githubToken = undefined
      if (!this.config.fundiEndpoint) return { queued: false, reason: "token-in-browser" }
    }

    // The cooldown starts only once a report is accepted: a failed filing must
    // not suppress the retry. Every failure resolves to a result, never a
    // rejection, so a reporter wired into an error handler cannot throw there.
    let filed: { issueUrl?: string } | undefined
    try {
      if (githubToken) {
        const res = await fetch(issuesApiUrl(this.config.githubRepo), {
          method: "POST",
          headers: {
            Authorization: `token ${githubToken}`,
            "Content-Type": "application/json",
            Accept: "application/vnd.github.v3+json",
          },
          body: JSON.stringify({
            title: `[${report.component}] ${report.title}`,
            body: this.buildIssueBody(report),
            labels,
          }),
        })
        if (!res.ok) return { queued: false, reason: "http-error", status: res.status }
        let issueUrl: unknown
        try {
          issueUrl = ((await res.json()) as { html_url?: unknown } | null)?.html_url
        } catch {
          issueUrl = undefined
        }
        // A 2xx without a readable issue URL is not counted as filed; a retry may
        // duplicate, which is better than consuming a signal nobody can find.
        if (typeof issueUrl !== "string") {
          return { queued: false, reason: "invalid-response", status: res.status }
        }
        filed = { issueUrl }
      } else if (this.config.fundiEndpoint) {
        const res = await fetch(this.config.fundiEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ report, labels }),
        })
        if (!res.ok) return { queued: false, reason: "http-error", status: res.status }
        filed = {}
      }
    } catch {
      return { queued: false, reason: "network-error" }
    }

    if (filed) {
      this.cooldowns.set(key, Date.now())
      this.config.onReported?.(report, filed.issueUrl)
      return { queued: true, ...filed }
    }

    console.warn("[mzizi:fundi-reporter] No endpoint configured.", report)
    return { queued: false, reason: "no-endpoint" }
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
    b += "\n---\n*Filed by mzizi-fundi-reporter (the N8 assurance to N9 fundi bridge)*\n"
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
/** Drop the shared reporter, so the next get/init starts clean. For tests. */
export function resetFundiReporter(): void {
  _reporter = null
}
export type { FundiReporterCore }
