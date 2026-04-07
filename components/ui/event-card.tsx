import * as React from "react"
import { Clock, MapPin } from "lucide-react"

import { cn } from "@/lib/utils"

const mineralColors: Record<string, string> = {
  cobalt: "border-l-[var(--color-cobalt)]",
  tanzanite: "border-l-[var(--color-tanzanite)]",
  malachite: "border-l-[var(--color-malachite)]",
  gold: "border-l-[var(--color-gold)]",
  terracotta: "border-l-[var(--color-terracotta)]",
}

function EventCard({
  title,
  time,
  location,
  category,
  mineral = "cobalt",
  className,
  ...props
}: {
  title: string
  time: string
  location?: string
  category?: string
  mineral?: "cobalt" | "tanzanite" | "malachite" | "gold" | "terracotta"
} & React.ComponentProps<"div">) {
  return (
    <div
      data-slot="event-card"
      data-mineral={mineral}
      className={cn(
        "flex flex-col gap-1.5 rounded-lg border-l-4 bg-card py-2.5 pr-4 pl-3 ring-1 ring-foreground/10",
        mineralColors[mineral],
        className
      )}
      {...props}
    >
      {category && (
        <span className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
          {category}
        </span>
      )}
      <h4 className="text-sm font-medium text-foreground">{title}</h4>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Clock className="size-3" />
          {time}
        </span>
        {location && (
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3" />
            {location}
          </span>
        )}
      </div>
    </div>
  )
}

export { EventCard }
