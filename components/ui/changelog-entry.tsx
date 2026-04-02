import * as React from "react"

import { cn } from "@/lib/utils"

interface ChangeGroup {
  type: "added" | "changed" | "fixed" | "removed"
  items: string[]
}

const typeStyles = {
  added: "bg-[var(--color-malachite)]/15 text-[var(--color-malachite)]",
  changed: "bg-[var(--color-cobalt)]/15 text-[var(--color-cobalt)]",
  fixed: "bg-[var(--color-gold)]/15 text-[var(--color-gold)]",
  removed: "bg-destructive/10 text-destructive",
} as const

function ChangelogEntry({
  version,
  date,
  changes,
  className,
  ...props
}: {
  version: string
  date: string
  changes: ChangeGroup[]
} & React.ComponentProps<"div">) {
  return (
    <div
      data-slot="changelog-entry"
      className={cn("flex flex-col gap-4", className)}
      {...props}
    >
      <div className="flex items-baseline gap-3">
        <h3 className="font-mono text-lg font-bold text-foreground">{version}</h3>
        <span className="text-sm text-muted-foreground">{date}</span>
      </div>
      <div className="flex flex-col gap-3">
        {changes.map((group) => (
          <div key={group.type} className="flex flex-col gap-1.5">
            <span className={cn("inline-flex w-fit rounded-4xl px-2 py-0.5 text-xs font-medium capitalize", typeStyles[group.type])}>
              {group.type}
            </span>
            <ul className="flex flex-col gap-1 pl-4">
              {group.items.map((item, index) => (
                <li key={index} className="list-disc text-sm text-foreground marker:text-muted-foreground">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}

export { ChangelogEntry, type ChangeGroup }
