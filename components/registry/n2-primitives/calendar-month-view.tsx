"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface DayEvent {
  id: string
  color?: string
}

interface CalendarMonthViewProps extends React.ComponentProps<"div"> {
  year: number
  month: number
  events?: Record<string, DayEvent[]>
  selectedDate?: string
  onDateSelect?: (date: string) => void
  todayHighlight?: boolean
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = []
  const d = new Date(year, month, 1)
  while (d.getMonth() === month) {
    days.push(new Date(d))
    d.setDate(d.getDate() + 1)
  }
  return days
}

function getStartOffset(year: number, month: number): number {
  const d = new Date(year, month, 1).getDay()
  return d === 0 ? 6 : d - 1
}

function CalendarMonthView({
  year,
  month,
  events = {},
  selectedDate,
  onDateSelect,
  todayHighlight = true,
  className,
  ...props
}: CalendarMonthViewProps) {
  const days = getDaysInMonth(year, month)
  const offset = getStartOffset(year, month)
  const today = new Date().toISOString().split("T")[0]

  return (
    <div
      data-slot="calendar-month-view"
      data-portal="https://mzizi.dev/components/calendar-month-view"
      className={cn("", className)}
      role="grid"
      aria-label={`${new Date(year, month).toLocaleDateString(undefined, { month: "long", year: "numeric" })}`}
      {...props}
    >
      <div className="grid grid-cols-7 gap-px" role="row">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            role="columnheader"
            className="py-2 text-center text-[10px] font-medium text-muted-foreground"
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px">
        {Array.from({ length: offset }).map((_, i) => (
          <div key={`pad-${i}`} />
        ))}
        {days.map((day) => {
          const key = day.toISOString().split("T")[0]
          const isToday = todayHighlight && key === today
          const isSelected = key === selectedDate
          const dayEvents = events[key] || []
          return (
            <button
              key={key}
              role="gridcell"
              aria-selected={isSelected}
              onClick={() => onDateSelect?.(key)}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-[var(--radius-sm,7px)] py-1.5 text-sm transition-colors",
                isSelected && "bg-primary text-primary-foreground",
                isToday && !isSelected && "font-bold text-[var(--color-malachite,#64FFDA)]",
                !isSelected && !isToday && "hover:bg-muted"
              )}
            >
              <span className="tabular-nums">{day.getDate()}</span>
              {dayEvents.length > 0 && (
                <div className="flex gap-0.5">
                  {dayEvents.slice(0, 3).map((e, i) => (
                    <div
                      key={i}
                      className="size-1 rounded-full"
                      style={{ backgroundColor: e.color || "var(--color-malachite,#64FFDA)" }}
                    />
                  ))}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export { CalendarMonthView }
export type { CalendarMonthViewProps }
