"use client"

import * as React from "react"
import { ChevronRight } from "lucide-react"

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
    string: "bg-[var(--color-cobalt)]/15 text-[var(--color-cobalt)]",
    number: "bg-[var(--color-gold)]/15 text-[var(--color-gold)]",
    integer: "bg-[var(--color-gold)]/15 text-[var(--color-gold)]",
    boolean: "bg-[var(--color-tanzanite)]/15 text-[var(--color-tanzanite)]",
    object: "bg-[var(--color-terracotta)]/15 text-[var(--color-terracotta)]",
    array: "bg-[var(--color-malachite)]/15 text-[var(--color-malachite)]",
  }
  return (
    <span className={cn("rounded-md px-1.5 py-0.5 text-[10px] font-medium", colorMap[type] ?? "bg-muted text-muted-foreground")}>
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
  const hasChildren = (schema.type === "object" && schema.properties) || (schema.type === "array" && schema.items)
  const childProperties = schema.type === "object" ? schema.properties : schema.type === "array" && schema.items?.properties ? schema.items.properties : null

  return (
    <div data-slot="schema-node" className="flex flex-col">
      <button
        type="button"
        onClick={() => hasChildren && setExpanded((e) => !e)}
        className={cn(
          "flex items-center gap-2 rounded-md px-2 py-1 text-sm transition-colors hover:bg-muted",
          hasChildren ? "cursor-pointer" : "cursor-default"
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        aria-expanded={hasChildren ? expanded : undefined}
      >
        {hasChildren ? (
          <ChevronRight className={cn("size-3.5 shrink-0 transition-transform", expanded && "rotate-90")} />
        ) : (
          <span className="size-3.5 shrink-0" />
        )}
        {name && <span className="font-mono text-sm font-medium text-foreground">{name}</span>}
        {required && <span className="text-destructive text-[10px]">*</span>}
        {schema.type && <TypeBadge type={schema.type === "array" ? `${schema.items?.type ?? "any"}[]` : schema.type} />}
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
      className={cn("overflow-hidden rounded-xl border border-border bg-card", className)}
      {...props}
    >
      <SchemaNode schema={schema} />
    </div>
  )
}

export { SchemaViewer, type JsonSchema }
