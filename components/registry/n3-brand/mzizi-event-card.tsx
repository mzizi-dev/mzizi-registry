import * as React from "react"
import { Clock, MapPin } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * EventCard — an event at a glance: category, title, time and place, with an optional
 * description, price (or "Free") and share action. The left rule is the event's mineral.
 *
 * #543 (Kweli): `price` / `free`, `description` and `share` slots, and all seven minerals
 * (cobalt, tanzanite, malachite, gold, terracotta, sodalite, copper).
 */

type EventMineral = "cobalt" | "tanzanite" | "malachite" | "gold" | "terracotta" | "sodalite" | "copper"

/* Complete literal class strings, so Tailwind generates every one. */
const mineralColors: Record<EventMineral, string> = {
  cobalt: "border-l-[var(--color-cobalt)]",
  tanzanite: "border-l-[var(--color-tanzanite)]",
  malachite: "border-l-[var(--color-malachite)]",
  gold: "border-l-[var(--color-gold)]",
  terracotta: "border-l-[var(--color-terracotta)]",
  sodalite: "border-l-[var(--color-sodalite)]",
  copper: "border-l-[var(--color-copper)]",
}

interface EventCardProps extends Omit<React.ComponentProps<"div">, "title"> {
  title: string
  time: string
  location?: string
  category?: string
  mineral?: EventMineral
  /** A short description under the time and place, clamped to two lines. */
  description?: React.ReactNode
  /** The price, as the app formats it ("US$5", "From ZWG 20"). Ignored when `free` is set. */
  price?: React.ReactNode
  /** The event is free: shows "Free" (or `freeLabel`) in place of a price. */
  free?: boolean
  /** The wording for a free event; "Free" by default. */
  freeLabel?: string
  /** A share action (a button or a share menu), at the end of the footer. */
  share?: React.ReactNode
}

function EventCard({
  title,
  time,
  location,
  category,
  mineral = "cobalt",
  description,
  price,
  free = false,
  freeLabel = "Free",
  share,
  className,
  ...props
}: EventCardProps) {
  const cost = free ? freeLabel : price
  const hasCost = free || (price != null && price !== "")
  return (
    <div
      data-slot="event-card"
      data-mineral={mineral}
      className={cn(
        "flex flex-col gap-1.5 rounded-lg border-l-4 bg-card py-2.5 pr-4 pl-3 ring-1 ring-foreground/10",
        mineralColors[mineral] ?? mineralColors.cobalt,
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
          <Clock className="size-3" aria-hidden="true" />
          {time}
        </span>
        {location && (
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3" aria-hidden="true" />
            {location}
          </span>
        )}
      </div>
      {description != null && description !== "" && (
        <p data-slot="event-card-description" className="line-clamp-2 text-xs text-muted-foreground">
          {description}
        </p>
      )}
      {(hasCost || share != null) && (
        <div data-slot="event-card-footer" className="mt-1 flex items-center justify-between gap-3">
          {hasCost ? (
            <span
              data-slot="event-card-price"
              data-free={free ? "" : undefined}
              className="text-sm font-semibold text-foreground"
            >
              {cost}
            </span>
          ) : (
            <span />
          )}
          {share != null && <div data-slot="event-card-share">{share}</div>}
        </div>
      )}
    </div>
  )
}

export { EventCard }
export type { EventCardProps, EventMineral }
