"use client"

/* ═══════════════════════════════════════════════════════════════
   NYUCHI INCIDENT MANAGER — N8 assurance (a node on the engineering strand)
   Incident lifecycle from detection to postmortem.
   ═══════════════════════════════════════════════════════════════ */

export type IncidentSeverity = "sev1" | "sev2" | "sev3" | "sev4"
export type IncidentState =
  "detected" | "triaging" | "mitigating" | "monitoring" | "resolved" | "postmortem"

export interface IncidentTimelineEntry {
  timestamp: string
  actor: string
  action: string
  details?: string
}

export interface Incident {
  id: string
  title: string
  severity: IncidentSeverity
  state: IncidentState
  detectedAt: string
  resolvedAt?: string
  /** Duration from detection to resolution */
  ttdMinutes?: number
  ttrMinutes?: number
  /** Affected components from backlinks */
  affectedComponents: { name: string; node: number; portalUrl?: string }[]
  /** Affected mini-apps */
  affectedMiniApps: string[]
  /** Who is the incident commander */
  commander?: string
  /** Timeline of actions */
  timeline: IncidentTimelineEntry[]
  /** Root cause (filled in postmortem) */
  rootCause?: string
  /** Action items from postmortem */
  actionItems?: { description: string; owner: string; dueDate?: string; done: boolean }[]
  /** Link to the triggered alert */
  alertId?: string
}

export interface IncidentManagerConfig {
  onStateChange?: (incident: Incident) => void
  onCreated?: (incident: Incident) => void
  onResolved?: (incident: Incident) => void
}

/* ─── Markdown neutralisation ───────────────────────────────────────────────
   An incident title comes from an alert, an alert comes from an error message,
   and an error message carries user input whenever user input reaches an
   exception. A newline plus `##` in a title forges a section heading; a `)` in
   a portal URL terminates its link early. A postmortem is read as a record of
   what happened, which is precisely why its structure must not be forgeable by
   the failure it describes.                                                 */

/** Neutralise Markdown structure in an untrusted single-line value. */
function mdText(s: string): string {
  return s.replace(/[\r\n]+/g, " ").replace(/([\\`*_{}[\]()#+\-.!|>])/g, "\\$1")
}

/** A URL becomes a link only if it is one; otherwise render the name as text. */
function mdLink(name: string, url?: string): string {
  const safe = url && /^https?:\/\//i.test(url) && !/[()\s]/.test(url)
  return safe ? `[${mdText(name)}](${url})` : mdText(name)
}

class IncidentManagerCore {
  private incidents = new Map<string, Incident>()
  private config: IncidentManagerConfig

  constructor(config: IncidentManagerConfig = {}) {
    this.config = config
  }

  create(params: {
    title: string
    severity: IncidentSeverity
    affectedComponents?: Incident["affectedComponents"]
    affectedMiniApps?: string[]
    alertId?: string
    commander?: string
  }): Incident {
    const id = `inc-${Date.now().toString(36)}`
    const incident: Incident = {
      id,
      title: params.title,
      severity: params.severity,
      state: "detected",
      detectedAt: new Date().toISOString(),
      affectedComponents: params.affectedComponents || [],
      affectedMiniApps: params.affectedMiniApps || [],
      commander: params.commander,
      alertId: params.alertId,
      timeline: [
        {
          timestamp: new Date().toISOString(),
          actor: "system",
          action: "Incident created",
          details: `Severity: ${params.severity}`,
        },
      ],
    }
    this.incidents.set(id, incident)
    this.config.onCreated?.(incident)
    return incident
  }

  transition(id: string, newState: IncidentState, actor: string, details?: string) {
    const inc = this.incidents.get(id)
    if (!inc) return
    inc.state = newState
    inc.timeline.push({
      timestamp: new Date().toISOString(),
      actor,
      action: `State → ${newState}`,
      details,
    })
    if (newState === "resolved") {
      inc.resolvedAt = new Date().toISOString()
      inc.ttrMinutes = Math.round(
        (new Date(inc.resolvedAt).getTime() - new Date(inc.detectedAt).getTime()) / 60000
      )
      this.config.onResolved?.(inc)
    }
    this.config.onStateChange?.(inc)
  }

  addTimelineEntry(id: string, actor: string, action: string, details?: string) {
    const inc = this.incidents.get(id)
    if (inc) inc.timeline.push({ timestamp: new Date().toISOString(), actor, action, details })
  }

  setRootCause(id: string, rootCause: string) {
    const inc = this.incidents.get(id)
    if (inc) inc.rootCause = rootCause
  }

  // `actionItems` is optional, so `Incident["actionItems"]` is `T[] | undefined`
  // and indexing it with `[0]` does not typecheck. `NonNullable<…>[number]` is
  // the element type this parameter always meant.
  addActionItem(id: string, item: NonNullable<Incident["actionItems"]>[number]) {
    const inc = this.incidents.get(id)
    if (inc) {
      if (!inc.actionItems) inc.actionItems = []
      inc.actionItems.push(item)
    }
  }

  generatePostmortem(id: string): string {
    const inc = this.incidents.get(id)
    if (!inc) return ""
    return `# Incident Postmortem: ${mdText(inc.title)}\n\n**Severity:** ${mdText(inc.severity)}\n**Detected:** ${inc.detectedAt}\n**Resolved:** ${inc.resolvedAt || "Ongoing"}\n**TTR:** ${inc.ttrMinutes ?? "N/A"} minutes\n**Commander:** ${mdText(inc.commander || "Unassigned")}\n\n## Affected Components\n${inc.affectedComponents.map((c) => `- ${mdLink(c.name, c.portalUrl)} (Node ${c.node})`).join("\n")}\n\n## Affected Mini-Apps\n${inc.affectedMiniApps.map(mdText).join(", ")}\n\n## Timeline\n${inc.timeline.map((t) => `- **${t.timestamp}** [${mdText(t.actor)}] ${mdText(t.action)}${t.details ? ` — ${mdText(t.details)}` : ""}`).join("\n")}\n\n## Root Cause\n${inc.rootCause ? mdText(inc.rootCause) : "_To be determined_"}\n\n## Action Items\n${(inc.actionItems || []).map((a) => `- [ ] ${mdText(a.description)} (Owner: ${mdText(a.owner)}${a.dueDate ? `, Due: ${mdText(a.dueDate)}` : ""})`).join("\n") || "_None yet_"}\n`
  }

  getActive(): Incident[] {
    return [...this.incidents.values()].filter(
      (i) => i.state !== "resolved" && i.state !== "postmortem"
    )
  }
  getAll(): Incident[] {
    return [...this.incidents.values()]
  }
  get(id: string): Incident | undefined {
    return this.incidents.get(id)
  }
}

export function createIncidentManager(config?: IncidentManagerConfig): IncidentManagerCore {
  return new IncidentManagerCore(config)
}

export type { IncidentManagerCore }
