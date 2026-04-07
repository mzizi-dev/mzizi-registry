import * as React from "react"
import { Clock, MapPin } from "lucide-react"

import { cn } from "@/lib/utils"

interface AgendaEvent {
  date: string
  title: string
  time: string
  location?: string
}

function AgendaView({
  events,
  className,
  ...props
}: {
  events: AgendaEvent[]
} & React.ComponentProps<"div">) {
  const grouped = React.useMemo(() => {
    const map = new Map<string, AgendaEvent[]>()
    for (const event of events) {
      const existing = map.get(event.date) ?? []
      existing.push(event)
      map.set(event.date, existing)
    }
    return Array.from(map.entries())
  }, [events])

  return (
    <div data-slot="agenda-view" className={cn("flex flex-col gap-6", className)} {...props}>
      {grouped.map(([date, dayEvents]) => (
        <div key={date} className="flex flex-col gap-2">
          <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            {date}
          </h3>
          <div className="flex flex-col gap-1.5">
            {dayEvents.map((event, index) => (
              <div
                key={index}
                className="flex items-center gap-3 rounded-lg bg-card px-3 py-2.5 ring-1 ring-foreground/10"
              >
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate text-sm font-medium text-foreground">
                    {event.title}
                  </span>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="size-3" />
                      {event.time}
                    </span>
                    {event.location && (
                      <span className="inline-flex items-center gap-1 truncate">
                        <MapPin className="size-3 shrink-0" />
                        {event.location}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export { AgendaView, type AgendaEvent }
