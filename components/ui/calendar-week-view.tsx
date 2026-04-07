"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

interface WeekEvent {
  title: string
  start: Date
  end: Date
  color?: string
}

const HOUR_START = 8
const HOUR_END = 20
const HOURS = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i)
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

function formatHour(hour: number) {
  const suffix = hour >= 12 ? "PM" : "AM"
  const h = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
  return `${h} ${suffix}`
}

function CalendarWeekView({
  events,
  weekStart,
  onEventClick,
  className,
  ...props
}: {
  events: WeekEvent[]
  weekStart: Date
  onEventClick?: (event: WeekEvent) => void
} & React.ComponentProps<"div">) {
  const days = React.useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart)
        d.setDate(d.getDate() + i)
        return d
      }),
    [weekStart]
  )

  function getEventsForDay(day: Date) {
    return events.filter(
      (e) =>
        e.start.getFullYear() === day.getFullYear() &&
        e.start.getMonth() === day.getMonth() &&
        e.start.getDate() === day.getDate()
    )
  }

  function getPosition(event: WeekEvent) {
    const startMinutes = event.start.getHours() * 60 + event.start.getMinutes() - HOUR_START * 60
    const endMinutes = event.end.getHours() * 60 + event.end.getMinutes() - HOUR_START * 60
    const totalMinutes = (HOUR_END - HOUR_START) * 60
    return {
      top: `${Math.max(0, (startMinutes / totalMinutes) * 100)}%`,
      height: `${Math.max(2, ((endMinutes - startMinutes) / totalMinutes) * 100)}%`,
    }
  }

  return (
    <div
      data-slot="calendar-week-view"
      className={cn("overflow-auto rounded-xl border border-border bg-card", className)}
      {...props}
    >
      <div className="grid min-w-[700px] grid-cols-[60px_repeat(7,1fr)]">
        {/* Header */}
        <div className="border-b border-border bg-muted p-2" />
        {days.map((day, i) => (
          <div key={i} className="border-b border-l border-border bg-muted px-2 py-2 text-center">
            <div className="text-xs font-medium text-muted-foreground">
              {DAY_LABELS[day.getDay()]}
            </div>
            <div className="text-sm font-semibold text-foreground">{day.getDate()}</div>
          </div>
        ))}
        {/* Time grid */}
        <div className="relative">
          {HOURS.map((hour) => (
            <div key={hour} className="h-12 border-b border-border px-2 py-1">
              <span className="text-[10px] text-muted-foreground">{formatHour(hour)}</span>
            </div>
          ))}
        </div>
        {days.map((day, dayIndex) => (
          <div key={dayIndex} className="relative border-l border-border">
            {HOURS.map((hour) => (
              <div key={hour} className="h-12 border-b border-border" />
            ))}
            {getEventsForDay(day).map((event, eventIndex) => {
              const pos = getPosition(event)
              return (
                <button
                  key={eventIndex}
                  type="button"
                  onClick={() => onEventClick?.(event)}
                  className="absolute inset-x-1 overflow-hidden rounded-md px-1.5 py-0.5 text-left text-[10px] leading-tight font-medium transition-opacity hover:opacity-80"
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
        ))}
      </div>
    </div>
  )
}

export { CalendarWeekView, type WeekEvent }
