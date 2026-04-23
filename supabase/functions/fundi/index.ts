// Nyuchi Design Portal — fundi edge function.
//
// "Fundi" is the L9 self-healing actor in the 3D frontend architecture.
// The L8 assurance layer detects runtime issues across any app in the
// ecosystem and reports them here; fundi dedup-inserts into
// `fundi_issues`, and the cron-triggered heal pass promotes the worst
// open issues into GitHub issues on nyuchi/design-portal.
//
// ──────────────────────────────────────────────────────────────────────
// Deployment matrix — when fundi reporting is enabled per environment:
//
//   ON BY DEFAULT
//     - Every Nyuchi-owned domain  (*.nyuchi.com, nyuchi.africa, …)
//     - Every Mukoko-owned domain  (*.mukoko.com)
//     - All `dev` environments     (NODE_ENV=development on bundu repos)
//     - Allow-listed staging environments (per-app config)
//
//   OPT-IN
//     - External customers consuming the registry. They set
//       NEXT_PUBLIC_FUNDI_ENABLED=1 (or equivalent) on their own
//       infrastructure to route their L8 callsites here. No data is
//       sent without an explicit opt-in.
//
// ──────────────────────────────────────────────────────────────────────
//
// Routes:
//
//   POST /fundi
//     Report a new failure from an L8 assurance callsite. Body shape
//     matches the live `fundi_issues` schema so there's no column-name
//     translation layer between client and DB.
//
//     Body: {
//       "component_name":   "button",                       // required
//       "severity":         "critical"|"high"|"medium"|"low", // required
//       "error_type":       "hydration-mismatch",           // required
//       "diagnostic_source": "l8-assurance"                  // required
//                           | "manual"
//                           | "build-time"
//                           | "monitor",
//       "architecture_layer": 3,                             // optional (1-10)
//       "blast_radius":      "single-component"              // optional
//                           | "single-page"
//                           | "site-wide",
//       "diagnostic_payload": { ...arbitrary structured...}, // optional
//       "portal_url":        "https://design.nyuchi.com/components/button",
//       "auto_fixable":      false
//     }
//
//     Dedup: if an `open` or `in_progress` row already exists for the
//     same (component_name, error_type, severity), fundi skips the
//     insert and logs a `duplicate_reported` healing-log row instead.
//
//   POST /fundi/heal
//     Cron-triggered. Picks up any `open` fundi_issues with no GitHub
//     issue yet, opens one, stores the GH issue number + URL on the
//     row, and appends to fundi_healing_log. Bearer-auth gated against
//     SUPABASE_SERVICE_ROLE_KEY or FUNDI_HEAL_TOKEN.
//
// Deploy:
//   supabase functions deploy fundi --project-ref grjsboqkaywpwatvrzmy
//
// Required secrets:
//   GITHUB_TOKEN         — PAT with repo:issues on nyuchi/design-portal
//   FUNDI_HEAL_TOKEN     — optional; if unset /heal accepts service-role key

import { adminClient } from "../_shared/supabase.ts"
import { json, preflight } from "../_shared/cors.ts"

const GITHUB_REPO = "nyuchi/design-portal"
const GITHUB_TOKEN = Deno.env.get("GITHUB_TOKEN")

const MAX_HEAL_BATCH = 10

type Severity = "critical" | "high" | "medium" | "low"

interface FundiIssueInput {
  component_name: string
  severity: Severity
  error_type: string
  diagnostic_source: string
  architecture_layer?: number
  blast_radius?: string
  diagnostic_payload?: Record<string, unknown>
  portal_url?: string
  auto_fixable?: boolean
}

interface FundiIssueRow {
  id: number
  component_name: string
  severity: Severity
  error_type: string
  diagnostic_source: string
  diagnostic_payload: Record<string, unknown> | null
  architecture_layer: number | null
  blast_radius: string | null
  portal_url: string | null
  auto_fixable: boolean | null
  status: string
  github_issue_number: number | null
  github_issue_url: string | null
  created_at: string | null
}

// Narrow validation. `component_name` / `severity` / `error_type` /
// `diagnostic_source` are NOT NULL in the live schema — required here
// too. Everything else is optional and passes through.
function validateInput(body: unknown): FundiIssueInput | string {
  if (!body || typeof body !== "object") return "body must be an object"
  const b = body as Record<string, unknown>

  const NAME_PATTERN = /^[a-z0-9._-]{1,60}$/i
  const TYPE_PATTERN = /^[a-z0-9._-]{1,60}$/i

  if (typeof b.component_name !== "string" || !b.component_name) {
    return "component_name (string) required"
  }
  if (!NAME_PATTERN.test(b.component_name)) {
    return "component_name must be 1-60 chars of [a-z0-9._-]"
  }
  if (!["critical", "high", "medium", "low"].includes(b.severity as string)) {
    return "severity must be critical|high|medium|low"
  }
  if (typeof b.error_type !== "string" || !b.error_type) {
    return "error_type (string) required"
  }
  if (!TYPE_PATTERN.test(b.error_type)) {
    return "error_type must be 1-60 chars of [a-z0-9._-]"
  }
  if (typeof b.diagnostic_source !== "string" || !b.diagnostic_source) {
    return "diagnostic_source (string) required"
  }
  if (b.architecture_layer != null) {
    const n = Number(b.architecture_layer)
    if (!Number.isInteger(n) || n < 1 || n > 10) {
      return "architecture_layer must be an integer 1-10"
    }
  }
  return {
    component_name: b.component_name,
    severity: b.severity as Severity,
    error_type: b.error_type,
    diagnostic_source: b.diagnostic_source,
    architecture_layer:
      b.architecture_layer != null ? Number(b.architecture_layer) : undefined,
    blast_radius: typeof b.blast_radius === "string" ? b.blast_radius : undefined,
    diagnostic_payload:
      b.diagnostic_payload && typeof b.diagnostic_payload === "object"
        ? (b.diagnostic_payload as Record<string, unknown>)
        : undefined,
    portal_url: typeof b.portal_url === "string" ? b.portal_url : undefined,
    auto_fixable: typeof b.auto_fixable === "boolean" ? b.auto_fixable : undefined,
  }
}

async function ingest(input: FundiIssueInput) {
  const supabase = adminClient()

  // Dedup by the natural-key trio. If an open/in-progress row exists,
  // log the duplicate and return the existing id.
  const { data: existing } = await supabase
    .from("fundi_issues")
    .select("id")
    .eq("component_name", input.component_name)
    .eq("error_type", input.error_type)
    .eq("severity", input.severity)
    .in("status", ["open", "in_progress"])
    .maybeSingle()

  if (existing) {
    await supabase.from("fundi_healing_log").insert({
      issue_id: existing.id,
      action_type: "duplicate_reported",
      action_payload: {
        diagnostic_source: input.diagnostic_source,
        diagnostic_payload: input.diagnostic_payload ?? null,
      },
      success: true,
    })
    return { id: existing.id, deduplicated: true }
  }

  const { data, error } = await supabase
    .from("fundi_issues")
    .insert({
      component_name: input.component_name,
      severity: input.severity,
      error_type: input.error_type,
      diagnostic_source: input.diagnostic_source,
      diagnostic_payload: input.diagnostic_payload ?? null,
      architecture_layer: input.architecture_layer ?? null,
      blast_radius: input.blast_radius ?? null,
      portal_url: input.portal_url ?? null,
      auto_fixable: input.auto_fixable ?? null,
      status: "open",
    })
    .select("id")
    .single()

  if (error) throw new Error(`Ingest failed: ${error.message}`)
  return { id: data.id, deduplicated: false }
}

async function openGithubIssue(issue: FundiIssueRow): Promise<{ number: number; url: string }> {
  if (!GITHUB_TOKEN) {
    throw new Error("GITHUB_TOKEN not configured")
  }

  const severityLabel = `fundi:${issue.severity}`
  const layerLabel =
    issue.architecture_layer != null ? `fundi:layer:L${issue.architecture_layer}` : null
  const title = `[fundi] ${issue.component_name}: ${issue.error_type}`
  const body =
    `**Autogenerated by fundi** (L9 self-healing actor).\n\n` +
    `- Component: \`${issue.component_name}\`\n` +
    `- Severity: \`${issue.severity}\`\n` +
    `- Error type: \`${issue.error_type}\`\n` +
    `- Diagnostic source: \`${issue.diagnostic_source}\`\n` +
    (issue.architecture_layer != null
      ? `- Architecture layer: \`L${issue.architecture_layer}\`\n`
      : "") +
    (issue.blast_radius ? `- Blast radius: \`${issue.blast_radius}\`\n` : "") +
    (issue.portal_url ? `- Portal: ${issue.portal_url}\n` : "") +
    `- Supabase row: \`fundi_issues.id = ${issue.id}\`\n` +
    `- Detected: ${issue.created_at ?? ""}\n\n` +
    `### Diagnostic payload\n\n\`\`\`json\n${JSON.stringify(issue.diagnostic_payload ?? {}, null, 2)}\n\`\`\`\n\n` +
    `---\nClose this issue via ` +
    `\`UPDATE fundi_issues SET status='resolved', resolved_by='<you>', resolved_at=now() WHERE id=${issue.id};\` ` +
    `or close it in GitHub — fundi syncs either way.`

  const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/issues`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      "User-Agent": "fundi-edge-function",
    },
    body: JSON.stringify({
      title,
      body,
      labels: ["fundi", severityLabel, ...(layerLabel ? [layerLabel] : [])],
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`GitHub API ${response.status}: ${text.slice(0, 500)}`)
  }

  const created = (await response.json()) as { number: number; html_url: string }
  return { number: created.number, url: created.html_url }
}

async function heal() {
  const supabase = adminClient()

  const { data: openIssues, error } = await supabase
    .from("fundi_issues")
    .select(
      "id, component_name, severity, error_type, diagnostic_source, diagnostic_payload, architecture_layer, blast_radius, portal_url, auto_fixable, status, github_issue_number, github_issue_url, created_at"
    )
    .is("github_issue_number", null)
    .eq("status", "open")
    .limit(MAX_HEAL_BATCH * 2)

  if (error) throw new Error(`Heal scan failed: ${error.message}`)

  const severityPriority: Record<Severity, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  }
  const queue = ((openIssues as FundiIssueRow[] | null) ?? [])
    .sort((a, b) => severityPriority[a.severity] - severityPriority[b.severity])
    .slice(0, MAX_HEAL_BATCH)

  const results: Array<{
    id: number
    github_issue_number?: number
    github_issue_url?: string
    error?: string
  }> = []
  for (const issue of queue) {
    const started = Date.now()
    try {
      const gh = await openGithubIssue(issue)
      await supabase
        .from("fundi_issues")
        .update({
          github_issue_number: gh.number,
          github_issue_url: gh.url,
          status: "in_progress",
        })
        .eq("id", issue.id)
      await supabase.from("fundi_healing_log").insert({
        issue_id: issue.id,
        action_type: "github_issue_opened",
        action_payload: {
          github_issue_number: gh.number,
          github_issue_url: gh.url,
          repo: GITHUB_REPO,
        },
        success: true,
        duration_ms: Date.now() - started,
      })
      results.push({ id: issue.id, github_issue_number: gh.number, github_issue_url: gh.url })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      await supabase.from("fundi_healing_log").insert({
        issue_id: issue.id,
        action_type: "github_issue_failed",
        action_payload: { error: message },
        success: false,
        error: message,
        duration_ms: Date.now() - started,
      })
      results.push({ id: issue.id, error: message })
    }
  }

  return {
    healed: results.filter((r) => !r.error).length,
    failed: results.filter((r) => r.error).length,
    details: results,
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return preflight("POST, OPTIONS")
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405, methods: "POST, OPTIONS" })
  }

  const url = new URL(req.url)
  const path = url.pathname.replace(/\/+$/, "")

  try {
    if (path.endsWith("/heal")) {
      // /heal is privileged — it opens real GitHub issues using the repo
      // PAT. Require a Bearer token matching either the Supabase service-
      // role key (used by the documented pg_cron schedule) or a dedicated
      // FUNDI_HEAL_TOKEN if operators want to isolate the trigger from
      // service-role access.
      const provided = (req.headers.get("authorization") ?? "")
        .replace(/^Bearer\s+/i, "")
        .trim()
      const expectedServiceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
      const expectedHealToken = Deno.env.get("FUNDI_HEAL_TOKEN")
      const ok =
        (!!expectedServiceRole && provided === expectedServiceRole) ||
        (!!expectedHealToken && provided === expectedHealToken)
      if (!ok) {
        return json({ error: "Unauthorized" }, { status: 401, methods: "POST, OPTIONS" })
      }
      const result = await heal()
      return json(result, { status: 200, methods: "POST, OPTIONS" })
    }

    const body = await req.json().catch(() => null)
    const validated = validateInput(body)
    if (typeof validated === "string") {
      return json({ error: validated }, { status: 400, methods: "POST, OPTIONS" })
    }
    const result = await ingest(validated)
    return json(result, { status: 202, methods: "POST, OPTIONS" })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error"
    console.error("[fundi]", message)
    return json({ error: message }, { status: 500, methods: "POST, OPTIONS" })
  }
})
