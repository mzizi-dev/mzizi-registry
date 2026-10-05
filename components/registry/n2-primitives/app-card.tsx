import * as React from "react"

import { cn } from "@/lib/ui-utils"
import { cardVariants } from "@/lib/ui-variants"

/**
 * Card — the Dashboard Standard card (`contracts/app/card`), held to that whole
 * contract: the `.card` surface with `cardVariants` padding (0 / 16 / 24 / 32px). The
 * React twin of `app-card.astro`; a server component. The registry primitive, with its
 * header, title, description, action, content and footer parts, is `card`.
 */
export function Card({
  padding,
  className,
  ...props
}: React.ComponentProps<"div"> & { padding?: "none" | "sm" | "md" | "lg" }) {
  return <div data-slot="card" className={cn(cardVariants({ padding }), className)} {...props} />
}
