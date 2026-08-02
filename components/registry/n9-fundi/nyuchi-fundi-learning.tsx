"use client"

export interface HealingOutcome {
  issueId: number
  component: string
  node: number
  errorType: string
  severity: string
  planActions: string[]
  actualFix: string
  fundiWasCorrect: boolean
  timeToResolveMinutes: number
  recurred: boolean
  resolvedBy: "fundi" | "human" | "both"
  timestamp: string
}

export interface LearningStats {
  totalIssues: number
  autoFixed: number
  humanFixed: number
  accuracy: number
  avgTimeToResolve: number
  topFailingComponents: { name: string; count: number }[]
  topErrorTypes: { type: string; count: number }[]
  recurrenceRate: number
}

// DB PERSISTENCE: In production, outcomes are stored in fundi_healing_log table
// and stats are computed from fundi_issues + fundi_healing_log via SQL.
// This in-memory implementation is for client-side quick access;
// the edge function (fundi-webhook) handles the DB persistence server-side.
//
// To query learning stats from DB:
// SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE resolved_by = 'fundi') as auto_fixed,
//   AVG(EXTRACT(EPOCH FROM resolved_at - created_at)/60) as avg_ttr_minutes
// FROM fundi_issues WHERE status = 'resolved';

class FundiLearningCore {
  private outcomes: HealingOutcome[] = []

  record(outcome: HealingOutcome) {
    this.outcomes.push(outcome)
  }

  getStats(): LearningStats {
    const total = this.outcomes.length
    if (total === 0)
      return {
        totalIssues: 0,
        autoFixed: 0,
        humanFixed: 0,
        accuracy: 0,
        avgTimeToResolve: 0,
        topFailingComponents: [],
        topErrorTypes: [],
        recurrenceRate: 0,
      }

    const autoFixed = this.outcomes.filter((o) => o.resolvedBy === "fundi").length
    const correct = this.outcomes.filter((o) => o.fundiWasCorrect).length
    const avgTTR = this.outcomes.reduce((s, o) => s + o.timeToResolveMinutes, 0) / total
    const recurred = this.outcomes.filter((o) => o.recurred).length

    const compCounts = new Map<string, number>()
    const typeCounts = new Map<string, number>()
    this.outcomes.forEach((o) => {
      compCounts.set(o.component, (compCounts.get(o.component) || 0) + 1)
      typeCounts.set(o.errorType, (typeCounts.get(o.errorType) || 0) + 1)
    })

    return {
      totalIssues: total,
      autoFixed,
      humanFixed: total - autoFixed,
      accuracy: correct / total,
      avgTimeToResolve: Math.round(avgTTR),
      topFailingComponents: [...compCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, count]) => ({ name, count })),
      topErrorTypes: [...typeCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([type, count]) => ({ type, count })),
      recurrenceRate: recurred / total,
    }
  }

  getComponentHistory(component: string): HealingOutcome[] {
    return this.outcomes.filter((o) => o.component === component)
  }

  suggestSeverity(component: string, errorType: string): string {
    const history = this.outcomes.filter(
      (o) => o.component === component && o.errorType === errorType
    )
    if (history.length === 0) return "medium"
    const lastSeverity = history[history.length - 1].severity
    const recurrenceCount = history.filter((o) => o.recurred).length
    if (recurrenceCount > 2) return "high"
    return lastSeverity
  }
}

let _learning: FundiLearningCore | null = null
export function getFundiLearning(): FundiLearningCore {
  if (!_learning) _learning = new FundiLearningCore()
  return _learning
}
export type { FundiLearningCore }
