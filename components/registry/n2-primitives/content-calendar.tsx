"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface ContentItem {
  id: string
  title: string
  type: string
  status: "draft" | "scheduled" | "published"
  date: string
  color?: string
}

interface ContentCalendarProps extends React.ComponentProps<"div"> {
  items: ContentItem[]
  view?: "week" | "month"
  onItemClick?: (id: string) => void
  onDateClick?: (date: string) => void
}

const statusStyles = {
  draft: "border-muted-foreground/30 bg-muted/30",
  scheduled: "border-[var(--color-cobalt,#00B0FF)]/30 bg-[var(--color-cobalt,#00B0FF)]/5",
  published: "border-[var(--color-malachite,#64FFDA)]/30 bg-[var(--color-malachite,#64FFDA)]/5",
}

function ContentCalendar({
  items,
  view = "week",
  onItemClick,
  onDateClick,
  className,
  ...props
}: ContentCalendarProps) {
  const today = new Date()

  // `view` was destructured and never read: the grid was hardcoded to a week,
  // so a consumer passing the documented `view="month"` silently got seven days.
  // Both modes render the same 7-column grid — only the day set differs, and in
  // both cases it starts on a Monday so the columns line up.
  const days: Date[] = []
  if (view === "month") {
    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const gridStart = new Date(firstOfMonth)
    // getDay(): 0 = Sunday. Step back to the Monday on or before the 1st.
    gridStart.setDate(firstOfMonth.getDate() - ((firstOfMonth.getDay() + 6) % 7))
    const lastOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    for (
      let d = new Date(gridStart);
      d <= lastOfMonth || d.getDay() !== 1;
      d.setDate(d.getDate() + 1)
    ) {
      days.push(new Date(d))
    }
  } else {
    const start = new Date(today)
    start.setDate(today.getDate() - ((today.getDay() + 6) % 7))
    for (let i = 0; i < 7; i++) {
      days.push(new Date(start.getTime() + i * 86400000))
    }
  }

  return (
    <div
      data-slot="content-calendar"
      data-portal="https://mzizi.dev/components/content-calendar"
      data-view={view}
      role="grid"
      aria-label={`Content calendar, ${view} view`}
      className={cn("rounded-[var(--radius-xl,17px)] border border-border bg-card p-4", className)}
      {...props}
    >
      <div className="grid grid-cols-7 gap-2">
        {days.map((day, i) => {
          const key = day.toISOString().split("T")[0]
          const dayItems = items.filter((item) => item.date === key)
          const isToday = key === today.toISOString().split("T")[0]
          // The weekday name belongs to the column, not the cell — label only
          // the first row, or a month view repeats "Mon" five times per column.
          const showWeekday = i < 7
          const inCurrentMonth = view !== "month" || day.getMonth() === today.getMonth()
          return (
            <div
              key={key}
              className={cn("min-h-[100px]", !inCurrentMonth && "opacity-40")}
              onClick={() => onDateClick?.(key)}
            >
              <div
                className={cn(
                  "mb-1 text-center text-[10px] font-medium",
                  isToday ? "text-[var(--color-malachite,#64FFDA)]" : "text-muted-foreground"
                )}
              >
                {showWeekday && day.toLocaleDateString(undefined, { weekday: "short" })}
                <div className={cn("text-sm", isToday && "font-bold")}>{day.getDate()}</div>
              </div>
              <div className="space-y-1">
                {dayItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      onItemClick?.(item.id)
                    }}
                    className={cn(
                      "w-full rounded-[var(--radius-sm,7px)] border px-1.5 py-1 text-left text-[9px]",
                      statusStyles[item.status]
                    )}
                  >
                    <div className="truncate font-medium">{item.title}</div>
                    <div className="text-muted-foreground capitalize">{item.type}</div>
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export { ContentCalendar }
export type { ContentCalendarProps }
