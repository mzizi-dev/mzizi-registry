import * as React from "react"
import { ArrowLeftIcon, ChevronRightIcon } from "lucide-react"

import { cn } from "@/lib/utils"

interface BreadcrumbItem {
  label: string
  href?: string
}

function PageHeader({
  className,
  title,
  description,
  breadcrumbs,
  actions,
  backHref,
  ...props
}: React.ComponentProps<"div"> & {
  title: string
  description?: string
  breadcrumbs?: BreadcrumbItem[]
  actions?: React.ReactNode
  backHref?: string
}) {
  return (
    <div
      data-slot="page-header"
      className={cn("flex flex-col gap-4 pb-6", className)}
      {...props}
    >
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="breadcrumb" data-slot="page-header-breadcrumbs">
          <ol className="text-muted-foreground flex flex-wrap items-center gap-1.5 text-sm">
            {breadcrumbs.map((crumb, index) => (
              <li key={index} className="inline-flex items-center gap-1.5">
                {index > 0 && (
                  <ChevronRightIcon className="size-3.5" aria-hidden="true" />
                )}
                {crumb.href && index < breadcrumbs.length - 1 ? (
                  <a
                    href={crumb.href}
                    className="hover:text-foreground transition-colors"
                  >
                    {crumb.label}
                  </a>
                ) : (
                  <span
                    className={cn(
                      index === breadcrumbs.length - 1 && "text-foreground font-medium"
                    )}
                    aria-current={index === breadcrumbs.length - 1 ? "page" : undefined}
                  >
                    {crumb.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          {backHref && (
            <a
              href={backHref}
              className="text-muted-foreground hover:text-foreground inline-flex size-9 items-center justify-center rounded-lg transition-colors"
              aria-label="Go back"
            >
              <ArrowLeftIcon className="size-4" />
            </a>
          )}
          <div className="flex flex-col gap-1">
            <h1
              data-slot="page-header-title"
              className="font-serif text-2xl font-semibold tracking-tight sm:text-3xl"
            >
              {title}
            </h1>
            {description && (
              <p
                data-slot="page-header-description"
                className="text-muted-foreground text-sm sm:text-base"
              >
                {description}
              </p>
            )}
          </div>
        </div>
        {actions && (
          <div
            data-slot="page-header-actions"
            className="flex shrink-0 items-center gap-2"
          >
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}

export { PageHeader }
export type { BreadcrumbItem }
