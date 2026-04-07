"use client"

import * as React from "react"
import { ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"

interface JsonViewerProps extends React.ComponentProps<"div"> {
  data: unknown
  initialExpanded?: number
}

function JsonViewer({ className, data, initialExpanded = 2, ...props }: JsonViewerProps) {
  return (
    <div
      data-slot="json-viewer"
      className={cn(
        "overflow-auto rounded-xl bg-card p-4 font-mono text-xs ring-1 ring-foreground/10",
        className
      )}
      {...props}
    >
      <JsonNode value={data} depth={0} maxExpanded={initialExpanded} />
    </div>
  )
}

function JsonNode({
  value,
  depth,
  maxExpanded,
  keyName,
}: {
  value: unknown
  depth: number
  maxExpanded: number
  keyName?: string
}) {
  const [expanded, setExpanded] = React.useState(depth < maxExpanded)

  if (value === null) {
    return (
      <span>
        {keyName !== undefined && <JsonKey name={keyName} />}
        <span className="text-muted-foreground italic">null</span>
      </span>
    )
  }

  if (typeof value === "boolean") {
    return (
      <span>
        {keyName !== undefined && <JsonKey name={keyName} />}
        <span className="text-mineral-gold">{String(value)}</span>
      </span>
    )
  }

  if (typeof value === "number") {
    return (
      <span>
        {keyName !== undefined && <JsonKey name={keyName} />}
        <span className="text-mineral-cobalt">{String(value)}</span>
      </span>
    )
  }

  if (typeof value === "string") {
    return (
      <span>
        {keyName !== undefined && <JsonKey name={keyName} />}
        <span className="text-mineral-malachite">&quot;{value}&quot;</span>
      </span>
    )
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return (
        <span>
          {keyName !== undefined && <JsonKey name={keyName} />}
          <span className="text-muted-foreground">[]</span>
        </span>
      )
    }

    return (
      <div>
        <span
          className="inline-flex cursor-pointer items-center gap-0.5 rounded-sm hover:bg-muted/50"
          onClick={() => setExpanded(!expanded)}
        >
          <ChevronRight
            className={cn(
              "size-3 text-muted-foreground transition-transform",
              expanded && "rotate-90"
            )}
          />
          {keyName !== undefined && <JsonKey name={keyName} />}
          <span className="text-muted-foreground">
            {expanded ? "[" : `[${value.length} items]`}
          </span>
        </span>
        {expanded && (
          <div className="ml-4 border-l border-border pl-2">
            {value.map((item, index) => (
              <div key={index} className="py-0.5">
                <JsonNode value={item} depth={depth + 1} maxExpanded={maxExpanded} />
                {index < value.length - 1 && <span className="text-muted-foreground">,</span>}
              </div>
            ))}
          </div>
        )}
        {expanded && <span className="text-muted-foreground">]</span>}
      </div>
    )
  }

  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
    if (entries.length === 0) {
      return (
        <span>
          {keyName !== undefined && <JsonKey name={keyName} />}
          <span className="text-muted-foreground">{"{}"}</span>
        </span>
      )
    }

    return (
      <div>
        <span
          className="inline-flex cursor-pointer items-center gap-0.5 rounded-sm hover:bg-muted/50"
          onClick={() => setExpanded(!expanded)}
        >
          <ChevronRight
            className={cn(
              "size-3 text-muted-foreground transition-transform",
              expanded && "rotate-90"
            )}
          />
          {keyName !== undefined && <JsonKey name={keyName} />}
          <span className="text-muted-foreground">
            {expanded ? "{" : `{${entries.length} keys}`}
          </span>
        </span>
        {expanded && (
          <div className="ml-4 border-l border-border pl-2">
            {entries.map(([key, val], index) => (
              <div key={key} className="py-0.5">
                <JsonNode value={val} depth={depth + 1} maxExpanded={maxExpanded} keyName={key} />
                {index < entries.length - 1 && <span className="text-muted-foreground">,</span>}
              </div>
            ))}
          </div>
        )}
        {expanded && <span className="text-muted-foreground">{"}"}</span>}
      </div>
    )
  }

  return (
    <span>
      {keyName !== undefined && <JsonKey name={keyName} />}
      <span className="text-muted-foreground">{String(value)}</span>
    </span>
  )
}

function JsonKey({ name }: { name: string }) {
  return (
    <span>
      <span className="text-foreground">&quot;{name}&quot;</span>
      <span className="text-muted-foreground">: </span>
    </span>
  )
}

export { JsonViewer, type JsonViewerProps }
