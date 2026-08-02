"use client"
import * as React from "react"
import { cn } from "@/lib/utils"

// NYUCHI CHANGELOG RENDERER — N10: Documentation Outlier
//
// Renders the database changelog as a visual timeline.
// Reads from: public.changelog (nodes_affected, components_added, etc.)
// Note: The changelog table uses nodes_affected (integer[]) —
// this interface mirrors that column name exactly.

export interface ChangelogEntry {
  version: string
  title: string
  description: string
  date: string
  nodesAffected?: number[]
  componentsAdded?: string[]
  componentsModified?: string[]
  componentsDeprecated?: string[]
}

export interface ChangelogRendererProps {
  entries: ChangelogEntry[]
  className?: string
}

// Ecosystem node labels — maps node number to its title
const NODE_LABELS: Record<number, string> = {
  1: "Tokens",
  2: "Primitives",
  3: "Brand",
  4: "Safety",
  5: "Resilience",
  6: "Pages",
  7: "Shell",
  8: "Assurance",
  9: "Fundi",
  10: "Documentation",
}

// Node axis — determines badge colour
const NODE_AXIS: Record<number, "vertical" | "horizontal" | "depth" | "outlier"> = {
  1: "vertical",
  2: "horizontal",
  3: "horizontal",
  4: "vertical",
  5: "vertical",
  6: "horizontal",
  7: "horizontal",
  8: "depth",
  9: "outlier",
  10: "outlier",
}

const AXIS_COLOURS: Record<string, string> = {
  horizontal: "bg-[var(--color-cobalt)]/10 text-[var(--color-cobalt)]",
  vertical: "bg-[var(--color-tanzanite)]/10 text-[var(--color-tanzanite)]",
  depth: "bg-[var(--color-malachite)]/10 text-[var(--color-malachite)]",
  outlier: "bg-[var(--color-gold)]/10 text-[var(--color-gold)]",
}

export function ChangelogRenderer({ entries, className }: ChangelogRendererProps) {
  return (
    <div
      data-slot="nyuchi-changelog-renderer"
      data-portal="https://mzizi.dev/components/nyuchi-changelog-renderer"
      className={cn("flex flex-col gap-8", className)}
      role="feed"
      aria-label="Changelog"
    >
      {entries.map((entry) => (
        <article key={entry.version} className="relative border-l-2 border-border pl-6">
          {/* Timeline dot */}
          <div className="absolute top-1 -left-[5px] size-2 rounded-full bg-primary" />

          {/* Version + date */}
          <div className="flex flex-wrap items-baseline gap-3">
            <span className="font-mono text-sm font-bold text-primary">{entry.version}</span>
            <time className="text-xs text-muted-foreground">{entry.date}</time>
          </div>

          <h3 className="mt-1 text-lg font-semibold">{entry.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{entry.description}</p>

          {/* Nodes affected badges */}
          {entry.nodesAffected && entry.nodesAffected.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1" aria-label="Nodes affected">
              {entry.nodesAffected.map((n) => (
                <span
                  key={n}
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-medium",
                    AXIS_COLOURS[NODE_AXIS[n] ?? "horizontal"]
                  )}
                  title={`N${n} — ${NODE_LABELS[n] ?? "Unknown"} (${NODE_AXIS[n] ?? "unknown"} axis)`}
                >
                  N{n}
                </span>
              ))}
            </div>
          )}

          {/* Component changes */}
          {entry.componentsAdded && entry.componentsAdded.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1" aria-label="Components added">
              {entry.componentsAdded.map((c) => (
                <span
                  key={c}
                  className="rounded bg-[var(--status-success,#64FFDA)]/10 px-1.5 py-0.5 text-xs text-[var(--status-success,#22C55E)]"
                >
                  +{c}
                </span>
              ))}
            </div>
          )}

          {entry.componentsModified && entry.componentsModified.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1" aria-label="Components modified">
              {entry.componentsModified.map((c) => (
                <span
                  key={c}
                  className="rounded bg-[var(--color-cobalt)]/10 px-1.5 py-0.5 text-xs text-[var(--color-cobalt)]"
                >
                  ~{c}
                </span>
              ))}
            </div>
          )}

          {entry.componentsDeprecated && entry.componentsDeprecated.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1" aria-label="Components deprecated">
              {entry.componentsDeprecated.map((c) => (
                <span
                  key={c}
                  className="rounded bg-[var(--status-warning,#F59E0B)]/10 px-1.5 py-0.5 text-xs text-[var(--status-warning,#F59E0B)] line-through"
                >
                  {c}
                </span>
              ))}
            </div>
          )}
        </article>
      ))}
    </div>
  )
}

export type { ChangelogRendererProps as NyuchiChangelogRendererProps }
