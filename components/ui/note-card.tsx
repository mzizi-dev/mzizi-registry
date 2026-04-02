import * as React from "react"

import { cn } from "@/lib/utils"

const mineralBorders: Record<string, string> = {
  cobalt: "border-t-[var(--color-cobalt)]",
  tanzanite: "border-t-[var(--color-tanzanite)]",
  malachite: "border-t-[var(--color-malachite)]",
  gold: "border-t-[var(--color-gold)]",
  terracotta: "border-t-[var(--color-terracotta)]",
}

function NoteCard({
  title,
  content,
  timestamp,
  color,
  className,
  ...props
}: {
  title: string
  content: string
  timestamp: string
  color?: "cobalt" | "tanzanite" | "malachite" | "gold" | "terracotta"
} & React.ComponentProps<"div">) {
  return (
    <div
      data-slot="note-card"
      data-color={color}
      className={cn(
        "ring-foreground/10 bg-card flex flex-col gap-2 rounded-xl p-4 ring-1",
        color ? `border-t-4 ${mineralBorders[color]}` : "",
        className
      )}
      {...props}
    >
      <h4 className="text-sm font-medium text-foreground line-clamp-1">{title}</h4>
      <p className="text-sm text-muted-foreground line-clamp-3">{content}</p>
      <span className="mt-auto text-xs text-muted-foreground">{timestamp}</span>
    </div>
  )
}

export { NoteCard }
