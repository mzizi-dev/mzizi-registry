import * as React from "react"

import { cn } from "@/lib/utils"

type MineralAccent = "cobalt" | "tanzanite" | "malachite" | "gold" | "terracotta"

interface SectionHeaderProps extends React.ComponentProps<"div"> {
  title: string
  description?: string
  action?: React.ReactNode
  mineral?: MineralAccent
}

const MINERAL_LINE_COLORS: Record<MineralAccent, string> = {
  cobalt: "bg-mineral-cobalt",
  tanzanite: "bg-mineral-tanzanite",
  malachite: "bg-mineral-malachite",
  gold: "bg-mineral-gold",
  terracotta: "bg-mineral-terracotta",
}

function SectionHeader({
  className,
  title,
  description,
  action,
  mineral,
  ...props
}: SectionHeaderProps) {
  return (
    <div
      data-slot="section-header"
      className={cn("flex items-start justify-between gap-4", className)}
      {...props}
    >
      <div className="flex items-start gap-3">
        {mineral && (
          <div className={cn("mt-1 h-6 w-1 shrink-0 rounded-full", MINERAL_LINE_COLORS[mineral])} />
        )}
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

export { SectionHeader, type SectionHeaderProps, type MineralAccent }
