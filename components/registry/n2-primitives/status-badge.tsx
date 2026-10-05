import * as React from "react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

/*
 * STATUS BADGE — N2 primitive.
 *
 * A pill-shaped lifecycle label built on `Badge`: `stable`, `beta`, `alpha` or `deprecated`,
 * each tinted with one of the Seven Minerals at 10% behind the mineral itself.
 *
 *   stable      → malachite  (growth, success: ready for production)
 *   beta        → cobalt     (knowledge: feature-complete, still settling)
 *   alpha       → gold       (value: a preview surface that may change)
 *   deprecated  → terracotta (struck through: slated for removal)
 *
 * The word is always rendered, so the status never depends on colour alone. Not interactive,
 * so no touch floor applies; wrap it in a link and it inherits the link's hit area.
 *
 * Siblings: `status-badge.rs` (Mzizi Roots, Dioxus) and `status-badge.mz` (the Mzizi
 * language). The three share one contract, `contracts/ui/status-badge.contract.json`,
 * and `__tests__/contracts` evaluates every clause and check of it on this file's markup.
 */

export type StatusBadgeStatus = "stable" | "beta" | "alpha" | "deprecated"

const STATUS_STYLES: Record<StatusBadgeStatus, string> = {
  stable: "bg-malachite/10 text-malachite",
  beta: "bg-cobalt/10 text-cobalt",
  alpha: "bg-gold/10 text-gold",
  deprecated: "bg-terracotta/10 text-terracotta line-through",
}

export interface StatusBadgeProps extends React.ComponentProps<"span"> {
  /** The lifecycle stage; `stable` when omitted. Also the label, unless children are given. */
  status?: StatusBadgeStatus
}

export function StatusBadge({
  status = "stable",
  className,
  children,
  ...props
}: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      data-slot="status-badge"
      data-portal="https://mzizi.dev/components/status-badge"
      data-status={status}
      className={cn(
        "rounded-full border-transparent font-mono text-[10px] tracking-wide uppercase",
        STATUS_STYLES[status],
        className
      )}
      {...props}
    >
      {children ?? status}
    </Badge>
  )
}
