"use client"

// ── INFRASTRUCTURE HARNESS (auto-wired) ──
// Every brand component participates in observability, motion, a11y,
// and health monitoring via the harness. Zero manual config.
import { useNyuchiHarness } from "@/lib/harness"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "@/lib/icons"
import { cn } from "@/lib/utils"

/* ═══════════════════════════════════════════════════════════════
   NYUCHI CALENDAR — Brand Data Display Component

   Wraps the base calendar primitive with Mukoko-specific
   features that create brand identity:

   1. Event dot indicators — mineral-colored dots under dates
      that have associated content (events, deadlines, etc.)
   2. Mineral highlight on today/selected date
   3. Month navigation with brand typography
   4. Integrated agenda slot for selected-day content

   This is used by nhimbe (events), planner (tasks), and any
   app that needs a date-anchored content view.

   Design identity markers (4.2.0 density refresh):
   - 14px card radius for the calendar container
   - 7px inner radius for day cells
   - Compact square day cells (aspect-ratio:1) — the 4.2.0 change,
     replacing the fixed 44px (h-11) rows
   - Mineral (var(--color-malachite,#64FFDA) default) for today/selected
   - 4px mineral-colored dots for event indicators
   - Day headers in 11px uppercase Noto Sans
   ═══════════════════════════════════════════════════════════════ */

type Mineral = "cobalt" | "tanzanite" | "malachite" | "gold" | "terracotta"

const mineralColorMap: Record<Mineral, string> = {
  cobalt: "var(--color-cobalt,#00B0FF)",
  tanzanite: "var(--color-tanzanite,#B388FF)",
  malachite: "var(--color-malachite,#64FFDA)",
  gold: "var(--color-gold,#FFD740)",
  terracotta: "var(--color-terracotta,#D4A574)",
}

interface CalendarEvent {
  /** Date string (YYYY-MM-DD) or Date object */
  date: string | Date
  /** Optional mineral color for the dot (defaults to malachite) */
  mineral?: Mineral
  /** Event data passed through to the agenda slot */
  [key: string]: unknown
}

interface NyuchiCalendarProps {
  /** Skeletonise while the first load resolves */
  loading?: boolean
  /** Events to display as dots on the calendar */
  events?: CalendarEvent[]
  /** Currently selected date */
  selectedDate?: Date
  /** Callback when a date is selected */
  onDateSelect?: (date: Date) => void
  /** Callback when month changes */
  onMonthChange?: (month: Date) => void
  /** Render prop for the agenda area below the calendar */
  renderAgenda?: (date: Date, events: CalendarEvent[]) => React.ReactNode
  /** Initial month to display */
  defaultMonth?: Date
  className?: string
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function NyuchiCalendar({
  loading = false,
  events = [],
  selectedDate,
  onDateSelect,
  onMonthChange,
  renderAgenda,
  defaultMonth,
  className,
}: NyuchiCalendarProps) {
  // All hooks run unconditionally, before any early return.
  useNyuchiHarness("calendar")
  const [currentMonth, setCurrentMonth] = React.useState(defaultMonth || new Date())
  const [selected, setSelected] = React.useState<Date | undefined>(selectedDate)

  React.useEffect(() => {
    if (selectedDate) setSelected(selectedDate)
  }, [selectedDate])

  /* Build a lookup: "YYYY-MM-DD" -> CalendarEvent[] (local date, not UTC) */
  const eventsByDate = React.useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()
    for (const ev of events) {
      const d = typeof ev.date === "string" ? ev.date.slice(0, 10) : dateKey(ev.date)
      const existing = map.get(d) || []
      existing.push(ev)
      map.set(d, existing)
    }
    return map
  }, [events])

  if (loading) {
    return (
      <div
        data-slot="nyuchi-calendar"
        data-portal="https://mzizi.dev/components/nyuchi-calendar"
        data-loading
        aria-busy="true"
        role="application"
        aria-label="Calendar"
        className="animate-pulse space-y-3 rounded-[var(--radius-lg,14px)] bg-card p-4 ring-1 ring-foreground/10"
      >
        <div className="flex justify-between">
          <div className="h-4 w-24 rounded bg-muted" />
          <div className="flex gap-1">
            <div className="size-8 rounded bg-muted" />
            <div className="size-8 rounded bg-muted" />
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="aspect-square rounded bg-muted" />
          ))}
        </div>
      </div>
    )
  }

  /* Calendar grid computation */
  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const firstDay = new Date(year, month, 1).getDay() // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const todayKey = dateKey(new Date())

  function handlePrev() {
    const prev = new Date(year, month - 1, 1)
    setCurrentMonth(prev)
    onMonthChange?.(prev)
  }

  function handleNext() {
    const next = new Date(year, month + 1, 1)
    setCurrentMonth(next)
    onMonthChange?.(next)
  }

  function handleDayClick(day: number) {
    const date = new Date(year, month, day)
    setSelected(date)
    onDateSelect?.(date)
  }

  function dayKey(day: number): string {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
  }

  const monthLabel = currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })

  const selectedKey = selected ? dateKey(selected) : null
  const selectedEvents = selectedKey ? eventsByDate.get(selectedKey) || [] : []

  return (
    <div
      data-slot="nyuchi-calendar"
      role="application"
      aria-label="Calendar"
      className={cn("flex flex-col gap-4", className)}
    >
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Previous month"
          className="p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
        >
          <ChevronLeft className="size-5" />
        </button>
        <span className="text-lg font-semibold text-foreground">{monthLabel}</span>
        <button
          type="button"
          onClick={handleNext}
          aria-label="Next month"
          className="p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1">
        {DAY_LABELS.map((d) => (
          <div
            key={d}
            className="text-center text-[11px] font-medium text-muted-foreground uppercase"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="rounded-[var(--radius-card,14px)] bg-card p-2 ring-1 ring-foreground/10">
        <div className="grid grid-cols-7 gap-[2px]">
          {/* Empty cells for offset */}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}

          {/* Day cells */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const key = dayKey(day)
            const isToday = key === todayKey
            const isSelected =
              selected &&
              selected.getDate() === day &&
              selected.getMonth() === month &&
              selected.getFullYear() === year
            const dayEvents = eventsByDate.get(key) || []
            const hasEvents = dayEvents.length > 0

            /* Dominant mineral for the dot (first event mineral) */
            const dotMineral: Mineral = dayEvents[0]?.mineral || "malachite"
            const dotColor =
              isToday || isSelected
                ? "var(--color-background, var(--muted,#050504))"
                : mineralColorMap[dotMineral]

            return (
              <button
                type="button"
                key={day}
                onClick={() => handleDayClick(day)}
                aria-pressed={isSelected}
                aria-label={`${monthLabel} ${day}${hasEvents ? `, ${dayEvents.length} event${dayEvents.length === 1 ? "" : "s"}` : ""}`}
                className={cn(
                  // 4.2.0: compact square cells (aspect-ratio:1).
                  "flex aspect-square flex-col items-center justify-center rounded-[var(--radius-inner,7px)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]",
                  isSelected && "bg-[var(--color-malachite)]",
                  isToday && !isSelected && "bg-[var(--color-malachite)]/20"
                )}
              >
                <span
                  className={cn(
                    "text-sm",
                    isSelected && "font-semibold text-background",
                    isToday && !isSelected && "font-semibold text-[var(--color-malachite)]",
                    !isToday && !isSelected && "text-foreground"
                  )}
                >
                  {day}
                </span>
                {/* Event dot indicator — the brand identity marker */}
                {hasEvents && (
                  <div
                    className="mt-0.5 size-1 rounded-full"
                    style={{ backgroundColor: dotColor }}
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Agenda slot for selected day */}
      {selected && renderAgenda && (
        <div data-slot="nyuchi-calendar-agenda">{renderAgenda(selected, selectedEvents)}</div>
      )}
    </div>
  )
}

export { NyuchiCalendar, mineralColorMap }
export type { NyuchiCalendarProps, CalendarEvent, Mineral }
