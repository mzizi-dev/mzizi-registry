import * as React from "react"
import { cva } from "class-variance-authority"

import { cn } from "@/lib/utils"

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH"

const methodBadgeVariants = cva(
  "inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-xs font-bold uppercase",
  {
    variants: {
      method: {
        GET: "bg-mineral-malachite/10 text-mineral-malachite",
        POST: "bg-mineral-cobalt/10 text-mineral-cobalt",
        PUT: "bg-mineral-gold/10 text-mineral-gold",
        DELETE: "bg-destructive/10 text-destructive",
        PATCH: "bg-mineral-tanzanite/10 text-mineral-tanzanite",
      },
    },
    defaultVariants: {
      method: "GET",
    },
  }
)

interface EndpointCardProps extends React.ComponentProps<"div"> {
  method: HttpMethod
  path: string
  description?: string
  deprecated?: boolean
}

function EndpointCard({
  className,
  method,
  path,
  description,
  deprecated = false,
  ...props
}: EndpointCardProps) {
  return (
    <div
      data-slot="endpoint-card"
      className={cn(
        "flex items-start gap-3 rounded-xl bg-card px-4 py-3 text-sm ring-1 ring-foreground/10 transition-colors",
        deprecated && "opacity-60",
        className
      )}
      {...props}
    >
      <span data-slot="endpoint-method" className={cn(methodBadgeVariants({ method }))}>
        {method}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <code className="truncate font-mono text-sm font-medium text-foreground">{path}</code>
          {deprecated && (
            <span className="shrink-0 rounded-md bg-destructive/10 px-1.5 py-0.5 text-[10px] font-medium text-destructive uppercase">
              Deprecated
            </span>
          )}
        </div>
        {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
      </div>
    </div>
  )
}

export { EndpointCard, methodBadgeVariants, type EndpointCardProps, type HttpMethod }
