import * as React from "react"
import { Button } from "@/components/ui/button"
import { Inbox } from "@/lib/icons"

interface EmptyStateProps {
  icon?: React.ReactNode
  title?: string
  description?: string
  action?: {
    label: string
    href: string
  }
}

function EmptyState({
  icon,
  title = "Nothing here yet",
  description = "Get started by creating your first item.",
  action,
}: EmptyStateProps) {
  return (
    <div
      data-slot="empty-state"
      data-portal="https://mzizi.dev/components/empty-state"
      className="flex flex-col items-center justify-center px-4 py-16 text-center"
    >
      {/* Icon */}
      <div className="mb-4 flex size-16 items-center justify-center rounded-[var(--radius-lg,14px)] bg-muted">
        {icon ?? <Inbox className="size-7 text-muted-foreground" />}
      </div>

      {/* Title */}
      <h2 className="font-serif text-lg font-semibold text-foreground">{title}</h2>

      {/* Description */}
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>

      {/* Action */}
      {action && (
        <Button className="mt-6" asChild>
          <a href={action.href}>{action.label}</a>
        </Button>
      )}
    </div>
  )
}

export { EmptyState }
export type { EmptyStateProps }
