"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface GraphNode {
  id: string
  label: string
  status?: "done" | "active" | "pending" | "blocked"
}

interface GraphEdge {
  from: string
  to: string
  label?: string
}

interface DependencyGraphProps extends React.ComponentProps<"div"> {
  nodes: GraphNode[]
  edges: GraphEdge[]
  direction?: "horizontal" | "vertical"
}

const statusColors: Record<string, string> = {
  done: "border-[var(--color-malachite,#64FFDA)] bg-[var(--color-malachite,#64FFDA)]/10",
  active: "border-[var(--color-cobalt,#00B0FF)] bg-[var(--color-cobalt,#00B0FF)]/10",
  pending: "border-border bg-muted/30",
  blocked: "border-destructive bg-destructive/5",
}

function DependencyGraph({
  nodes,
  edges,
  direction = "vertical",
  className,
  ...props
}: DependencyGraphProps) {
  /* Build adjacency for layout: nodes grouped into levels by dependency depth */
  const levels = React.useMemo(() => {
    const incoming = new Map<string, Set<string>>()
    nodes.forEach((n) => incoming.set(n.id, new Set()))
    edges.forEach((e) => incoming.get(e.to)?.add(e.from))

    const assigned = new Map<string, number>()
    const result: GraphNode[][] = []
    let remaining = [...nodes]

    while (remaining.length > 0) {
      const level = remaining.filter((n) => {
        const deps = incoming.get(n.id) || new Set()
        return [...deps].every((d) => assigned.has(d))
      })
      if (level.length === 0) {
        result.push(remaining)
        break
      }
      result.push(level)
      level.forEach((n) => assigned.set(n.id, result.length - 1))
      remaining = remaining.filter((n) => !assigned.has(n.id))
    }
    return result
  }, [nodes, edges])

  return (
    <div
      data-slot="dependency-graph"
      data-portal="https://mzizi.dev/components/dependency-graph"
      role="img"
      aria-label={`Dependency graph with ${nodes.length} nodes and ${edges.length} edges`}
      className={cn(
        "flex gap-6 overflow-x-auto p-4",
        direction === "horizontal" ? "flex-row items-start" : "flex-col items-center",
        className
      )}
      {...props}
    >
      {levels.map((level, li) => (
        <React.Fragment key={li}>
          {li > 0 && (
            <div
              className={cn(
                "flex items-center justify-center text-muted-foreground",
                direction === "horizontal" ? "px-2 text-lg" : "py-1"
              )}
            >
              {direction === "horizontal" ? "→" : "↓"}
            </div>
          )}
          <div
            className={cn(
              "flex gap-2",
              direction === "horizontal" ? "flex-col" : "flex-row flex-wrap justify-center"
            )}
          >
            {level.map((node) => (
              <div
                key={node.id}
                className={cn(
                  "rounded-[var(--radius-md,12px)] border-2 px-3 py-2 text-center text-xs font-medium",
                  statusColors[node.status || "pending"]
                )}
              >
                {node.label}
              </div>
            ))}
          </div>
        </React.Fragment>
      ))}
    </div>
  )
}

export { DependencyGraph }
export type { DependencyGraphProps }
