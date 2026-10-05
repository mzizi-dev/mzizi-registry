import * as React from "react"

import { cn } from "@/lib/ui-utils"
import { labelClasses } from "@/lib/ui-variants"

/**
 * Label — the Dashboard Standard label (`contracts/app/label`), held to that whole
 * contract: a native <label> with `labelClasses`, the React twin of `app-label.astro`.
 * A server component. The registry primitive is `label`.
 */
export function Label({ className, ...props }: React.ComponentProps<"label">) {
  return <label data-slot="label" className={cn(labelClasses, className)} {...props} />
}
