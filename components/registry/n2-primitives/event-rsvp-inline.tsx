"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type RsvpStatus = "going" | "maybe" | "declined" | null

interface EventRsvpInlineProps extends React.ComponentProps<"div"> {
  eventTitle: string
  date: string
  venue?: string
  imageUrl?: string
  rsvpStatus?: RsvpStatus
  attendeeCount?: number
  onRsvp?: (status: "going" | "maybe" | "declined") => void
}

function EventRsvpInline({
  eventTitle,
  date,
  venue,
  imageUrl,
  rsvpStatus,
  attendeeCount,
  onRsvp,
  className,
  ...props
}: EventRsvpInlineProps) {
  return (
    <div
      data-slot="event-rsvp-inline"
      data-portal="https://mzizi.dev/components/event-rsvp-inline"
      role="group"
      aria-label="RSVP"
      className={cn(
        "overflow-hidden rounded-[var(--radius-lg,14px)] border border-border bg-card",
        className
      )}
      {...props}
    >
      {imageUrl && (
        <div className="h-20 bg-muted">
          <img src={imageUrl} alt="" className="size-full object-cover" />
        </div>
      )}
      <div className="p-3">
        <div className="text-sm font-medium">{eventTitle}</div>
        <div className="mt-0.5 text-xs text-muted-foreground">
          {date}
          {venue ? ` · ${venue}` : ""}
          {attendeeCount ? ` · ${attendeeCount} going` : ""}
        </div>
        {onRsvp && (
          <div className="mt-2 flex gap-1.5">
            {(["going", "maybe", "declined"] as const).map((status) => (
              <button
                key={status}
                onClick={() => onRsvp(status)}
                className={cn(
                  "h-8 flex-1 rounded-full text-xs font-medium capitalize transition-colors",
                  rsvpStatus === status
                    ? status === "going"
                      ? "bg-[var(--color-malachite,#64FFDA)]/15 text-[var(--color-malachite,#64FFDA)]"
                      : status === "maybe"
                        ? "bg-[var(--color-gold,#FFD740)]/15 text-[var(--color-gold,#FFD740)]"
                        : "bg-muted text-muted-foreground"
                    : "border border-border hover:bg-muted/30"
                )}
              >
                {status === "going" ? "Going" : status === "maybe" ? "Maybe" : "Decline"}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export { EventRsvpInline }
export type { EventRsvpInlineProps }
