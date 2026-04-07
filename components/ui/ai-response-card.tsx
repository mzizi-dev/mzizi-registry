import * as React from "react"
import { Sparkles } from "lucide-react"

import { cn } from "@/lib/utils"

interface AiSource {
  title: string
  url: string
  snippet?: string
  relevance?: number
}

function AiResponseCard({
  className,
  content,
  sources,
  actions,
  ...props
}: React.ComponentProps<"div"> & {
  content: string
  sources?: AiSource[]
  actions?: React.ReactNode
}) {
  return (
    <div
      data-slot="ai-response-card"
      className={cn(
        "flex flex-col gap-4 rounded-2xl bg-card p-6 text-sm ring-1 ring-foreground/10",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Sparkles className="text-mineral-tanzanite size-3.5" />
        <span>AI Response</span>
      </div>
      <div
        data-slot="ai-response-content"
        className="prose prose-sm dark:prose-invert max-w-none leading-relaxed whitespace-pre-wrap text-foreground"
      >
        {content}
      </div>
      {sources && sources.length > 0 && (
        <div data-slot="ai-response-sources" className="flex flex-col gap-2">
          <span className="text-xs font-medium text-muted-foreground">Sources</span>
          <div className="flex flex-col gap-1.5">
            {sources.map((source, i) => (
              <a
                key={i}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-baseline gap-2 rounded-lg px-2 py-1.5 text-xs transition-colors hover:bg-muted"
              >
                <span className="text-mineral-cobalt shrink-0 font-medium">[{i + 1}]</span>
                <span className="text-foreground">{source.title}</span>
              </a>
            ))}
          </div>
        </div>
      )}
      {actions && (
        <div
          data-slot="ai-response-actions"
          className="flex items-center gap-2 border-t border-border pt-4"
        >
          {actions}
        </div>
      )}
    </div>
  )
}

export { AiResponseCard, type AiSource }
