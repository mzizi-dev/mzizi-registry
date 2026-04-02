"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

interface DayEvent {
  title: string
  start: Date
  end: Date
  color?: string
}

const HOUR_START = 8
const HOUR_END = 20
const HOURS = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i)

function formatHour(hour: number) {
  const suffix = hour >= 12 ? "PM" : "AM"
  const h = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
  return `${h} ${suffix}`
}

function CalendarDayView({
  events,
  date,
  onEventClick,
  className,
  ...props
}: {
  events: DayEvent[]
  date: Date
  onEventClick?: (event: DayEvent) => void
} & React.ComponentProps<"div">) {
  const dayEvents = events.filter(
    (e) =>
      e.start.getFullYear() === date.getFullYear() &&
      e.start.getMonth() === date.getMonth() &&
      e.start.getDate() === date.getDate()
  )

  const totalMinutes = (HOUR_END - HOUR_START) * 60

  function getPosition(event: DayEvent) {
    const startMin = event.start.getHours() * 60 + event.start.getMinutes() - HOUR_START * 60
    const endMin = event.end.getHours() * 60 + event.end.getMinutes() - HOUR_START * 60
    return {
      top: `${Math.max(0, (startMin / totalMinutes) * 100)}%`,
      height: `${Math.max(2, ((endMin - startMin) / totalMinutes) * 100)}%`,
    }
  }

  return (
    <div
      data-slot="calendar-day-view"
      className={cn("overflow-auto rounded-xl border border-border bg-card", className)}
      {...props}
    >
      <div className="border-b border-border bg-muted px-4 py-2">
        <span className="text-sm font-semibold text-foreground">
          {date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
        </span>
      </div>
      <div className="grid grid-cols-[60px_1fr]">
        <div>
          {HOURS.map((hour) => (
            <div key={hour} className="flex h-14 items-start justify-end border-b border-border pr-2 pt-1">
              <span className="text-[10px] text-muted-foreground">{formatHour(hour)}</span>
            </div>
          ))}
        </div>
        <div className="relative border-l border-border">
          {HOURS.map((hour) => (
            <div key={hour} className="h-14 border-b border-border" />
          ))}
          {dayEvents.map((event, index) => {
            const pos = getPosition(event)
            return (
              <button
                key={index}
                type="button"
                onClick={() => onEventClick?.(event)}
                className="absolute inset-x-2 overflow-hidden rounded-md px-2 py-1 text-left text-xs font-medium transition-opacity hover:opacity-80"
                style={{
                  top: pos.top,
                  height: pos.height,
                  backgroundColor: event.color ?? "var(--color-cobalt)",
                  color: "white",
                }}
              >
                {event.title}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export { CalendarDayView, type DayEvent }
