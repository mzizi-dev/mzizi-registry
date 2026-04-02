import * as React from "react"

import { cn } from "@/lib/utils"

function MaintenancePage({
  title = "Under Maintenance",
  description = "We're performing scheduled maintenance. We'll be back shortly.",
  estimatedReturn,
  className,
  ...props
}: {
  title?: string
  description?: string
  estimatedReturn?: string
} & React.ComponentProps<"div">) {
  return (
    <div
      data-slot="maintenance-page"
      className={cn(
        "flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 text-center",
        className
      )}
      {...props}
    >
      {/* Mineral accent bar */}
      <div className="flex gap-1">
        <div className="h-1 w-8 rounded-full bg-[var(--color-cobalt)]" />
        <div className="h-1 w-8 rounded-full bg-[var(--color-tanzanite)]" />
        <div className="h-1 w-8 rounded-full bg-[var(--color-malachite)]" />
        <div className="h-1 w-8 rounded-full bg-[var(--color-gold)]" />
        <div className="h-1 w-8 rounded-full bg-[var(--color-terracotta)]" />
      </div>

      {/* Mukoko mark */}
      <span className="font-serif text-4xl font-bold text-foreground">m</span>

      <div className="flex max-w-md flex-col gap-2">
        <h1 className="font-serif text-2xl font-bold text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
        {estimatedReturn && (
          <p className="mt-2 text-xs text-muted-foreground">
            Estimated return: <span className="font-medium text-foreground">{estimatedReturn}</span>
          </p>
        )}
      </div>
    </div>
  )
}

export { MaintenancePage }
