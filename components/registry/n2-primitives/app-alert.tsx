import * as React from "react"

import { cn } from "@/lib/ui-utils"
import { alertDescriptionClasses, alertTitleClasses, alertVariants } from "@/lib/ui-variants"

/**
 * Alert — the Dashboard Standard alert (`contracts/app/alert`), held to that whole
 * contract: `role="alert"`, `title` as the heading line and `children` as the
 * description, with info, success and warning as status-container colours. The React
 * twin of `app-alert.astro`; a server component. The registry primitive is `alert`.
 */
export function Alert({
  variant,
  title,
  className,
  state,
  children,
}: {
  variant?: "default" | "info" | "success" | "warning" | "destructive"
  title?: string
  className?: string
  /** Extra data attribute, e.g. which state a StateMessage shows. */
  state?: string
  children?: React.ReactNode
}) {
  return (
    <div
      role="alert"
      data-slot="alert"
      data-state={state}
      className={cn(alertVariants({ variant }), className)}
    >
      {title && (
        <p data-slot="alert-title" className={alertTitleClasses}>
          {title}
        </p>
      )}
      {children != null && children !== false && (
        <div data-slot="alert-description" className={alertDescriptionClasses}>
          {children}
        </div>
      )}
    </div>
  )
}
