import * as React from "react"

import { cn } from "@/lib/ui-utils"
import { appInputClasses } from "@/lib/ui-variants"

/**
 * Input — the Dashboard Standard input (`contracts/app/input`), held to that whole
 * contract: a native <input> at app density (36px, 48px and 16px text on touch), every
 * attribute passed through. The React twin of `app-input.astro`; a server component.
 * The registry primitive is `input`.
 */
export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return <input data-slot="input" className={cn(appInputClasses, className)} {...props} />
}
