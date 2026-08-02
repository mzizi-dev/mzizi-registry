"use client"

import * as React from "react"
import { ChevronRight } from "@/lib/icons"

import { cn } from "@/lib/utils"

interface JsonSchema {
  type?: string
  properties?: Record<string, JsonSchema>
  items?: JsonSchema
  description?: string
  required?: string[]
  enum?: string[]
  [key: string]: unknown
}

function TypeBadge({ type }: { type: string }) {
  const colorMap: Record<string, string> = {
    string:
      "bg-[var(--color-primary, var(--color-cobalt, #00B0FF))]/15 text-[var(--color-primary, var(--color-cobalt, #00B0FF))]",
    number:
      "bg-[var(--status-warning, var(--color-gold, #FFD740))]/15 text-[var(--status-warning, var(--color-gold, #FFD740))]",
    integer:
      "bg-[var(--status-warning, var(--color-gold, #FFD740))]/15 text-[var(--status-warning, var(--color-gold, #FFD740))]",
    boolean:
      "bg-[var(--color-accent, var(--color-tanzanite, #B388FF))]/15 text-[var(--color-accent, var(--color-tanzanite, #B388FF))]",
    object:
      "bg-[var(--status-error, var(--color-terracotta, #D4A574))]/15 text-[var(--status-error, var(--color-terracotta, #D4A574))]",
    array:
      "bg-[var(--status-success, var(--color-malachite, #64FFDA))]/15 text-[var(--status-success, var(--color-malachite, #64FFDA))]",
  }
  return (
    <span
      className={cn(
        "rounded-[var(--radius-md,12px)] px-1.5 py-0.5 text-[10px] font-medium",
        colorMap[type] ?? "bg-muted text-muted-foreground"
      )}
    >
      {type}
    </span>
  )
}

function SchemaNode({
  name,
  schema,
  required,
  depth = 0,
}: {
  name?: string
  schema: JsonSchema
  required?: boolean
  depth?: number
}) {
  const [expanded, setExpanded] = React.useState(depth < 2)
  const hasChildren =
    (schema.type === "object" && schema.properties) || (schema.type === "array" && schema.items)
  const childProperties =
    schema.type === "object"
      ? schema.properties
      : schema.type === "array" && schema.items?.properties
        ? schema.items.properties
        : null

  return (
    <div
      data-slot="schema-node"
      data-portal="https://mzizi.dev/components/schema-node"
      className="flex flex-col"
    >
      <button
        type="button"
        onClick={() => hasChildren && setExpanded((e) => !e)}
        className={cn(
          "flex items-center gap-2 rounded-[var(--radius-md,12px)] px-2 py-1 text-sm transition-colors hover:bg-muted",
          hasChildren ? "cursor-pointer" : "cursor-default"
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        aria-expanded={hasChildren ? expanded : undefined}
      >
        {hasChildren ? (
          <ChevronRight
            className={cn("size-3.5 shrink-0 transition-transform", expanded && "rotate-90")}
          />
        ) : (
          <span className="size-3.5 shrink-0" />
        )}
        {name && <span className="font-mono text-sm font-medium text-foreground">{name}</span>}
        {required && <span className="text-[10px] text-destructive">*</span>}
        {schema.type && (
          <TypeBadge
            type={schema.type === "array" ? `${schema.items?.type ?? "any"}[]` : schema.type}
          />
        )}
        {schema.description && (
          <span className="truncate text-xs text-muted-foreground">{schema.description}</span>
        )}
        {schema.enum && (
          <span className="truncate text-xs text-muted-foreground">
            [{schema.enum.join(" | ")}]
          </span>
        )}
      </button>
      {expanded && childProperties && (
        <div className="flex flex-col">
          {Object.entries(childProperties).map(([key, value]) => (
            <SchemaNode
              key={key}
              name={key}
              schema={value}
              required={schema.required?.includes(key)}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function SchemaViewer({
  schema,
  className,
  ...props
}: {
  schema: JsonSchema
} & React.ComponentProps<"div">) {
  return (
    <div
      data-slot="schema-viewer"
      className={cn(
        "overflow-hidden rounded-[var(--radius-xl,17px)] border border-border bg-card",
        className
      )}
      {...props}
    >
      <SchemaNode schema={schema} />
    </div>
  )
}

export { SchemaViewer, type JsonSchema }
