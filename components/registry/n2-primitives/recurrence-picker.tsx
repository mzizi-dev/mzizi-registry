"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type Frequency = "daily" | "weekly" | "monthly" | "yearly" | "none"

interface RecurrencePickerProps extends React.ComponentProps<"div"> {
  frequency?: Frequency
  onFrequencyChange?: (freq: Frequency) => void
  interval?: number
  onIntervalChange?: (interval: number) => void
  daysOfWeek?: number[]
  onDaysChange?: (days: number[]) => void
  endDate?: string
  onEndDateChange?: (date: string) => void
  occurrences?: number
  onOccurrencesChange?: (count: number) => void
  endType?: "never" | "date" | "count"
  onEndTypeChange?: (type: "never" | "date" | "count") => void
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const freqLabels: Record<Frequency, string> = {
  none: "Does not repeat",
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
}

function RecurrencePicker({
  frequency = "none",
  onFrequencyChange,
  interval = 1,
  onIntervalChange,
  daysOfWeek = [],
  onDaysChange,
  endDate,
  onEndDateChange,
  occurrences = 10,
  onOccurrencesChange,
  endType = "never",
  onEndTypeChange,
  className,
  ...props
}: RecurrencePickerProps) {
  const toggleDay = (day: number) => {
    const next = daysOfWeek.includes(day)
      ? daysOfWeek.filter((d) => d !== day)
      : [...daysOfWeek, day]
    onDaysChange?.(next)
  }

  return (
    <div
      data-slot="recurrence-picker"
      data-portal="https://mzizi.dev/components/recurrence-picker"
      className={cn("space-y-3", className)}
      {...props}
    >
      <select
        value={frequency}
        onChange={(e) => onFrequencyChange?.(e.target.value as Frequency)}
        className="h-12 w-full rounded-full border border-input bg-input/30 px-4 text-sm outline-none"
        aria-label="Repeat frequency"
      >
        {Object.entries(freqLabels).map(([k, v]) => (
          <option key={k} value={k}>
            {v}
          </option>
        ))}
      </select>

      {frequency !== "none" && (
        <>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Every</span>
            <input
              type="number"
              min={1}
              max={99}
              value={interval}
              onChange={(e) => onIntervalChange?.(parseInt(e.target.value) || 1)}
              className="h-10 w-16 rounded-[var(--radius-md,12px)] border border-input bg-input/30 px-2 text-center text-sm outline-none"
              aria-label="Interval"
            />
            <span className="text-muted-foreground">
              {frequency === "daily"
                ? "day(s)"
                : frequency === "weekly"
                  ? "week(s)"
                  : frequency === "monthly"
                    ? "month(s)"
                    : "year(s)"}
            </span>
          </div>

          {frequency === "weekly" && (
            <div className="flex gap-1">
              {DAYS.map((day, i) => (
                <button
                  key={i}
                  onClick={() => toggleDay(i)}
                  aria-pressed={daysOfWeek.includes(i)}
                  className={cn(
                    "size-9 rounded-full text-xs font-medium transition-colors",
                    daysOfWeek.includes(i)
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  {day.charAt(0)}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Ends</span>
            <select
              value={endType}
              onChange={(e) => onEndTypeChange?.(e.target.value as "never" | "date" | "count")}
              className="h-10 rounded-[var(--radius-md,12px)] border border-input bg-input/30 px-3 text-sm outline-none"
              aria-label="End condition"
            >
              <option value="never">Never</option>
              <option value="date">On date</option>
              <option value="count">After</option>
            </select>
            {endType === "date" && (
              <input
                type="date"
                value={endDate || ""}
                onChange={(e) => onEndDateChange?.(e.target.value)}
                className="h-10 rounded-[var(--radius-md,12px)] border border-input bg-input/30 px-3 text-sm outline-none"
              />
            )}
            {endType === "count" && (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={1}
                  value={occurrences}
                  onChange={(e) => onOccurrencesChange?.(parseInt(e.target.value) || 1)}
                  className="h-10 w-16 rounded-[var(--radius-md,12px)] border border-input bg-input/30 px-2 text-center text-sm outline-none"
                />
                <span className="text-muted-foreground">times</span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export { RecurrencePicker }
export type { RecurrencePickerProps }
