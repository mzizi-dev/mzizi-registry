"use client"

import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

// ── DatePicker (single date) ────────────────────────────────────────

interface DatePickerProps {
  /** Currently selected date */
  date?: Date
  /** Called when the user picks a date */
  onDateChange?: (date: Date | undefined) => void
  /** Placeholder when no date is selected */
  placeholder?: string
  /** Date format string (date-fns) */
  dateFormat?: string
  /** Disable the picker */
  disabled?: boolean
  className?: string
}

function DatePicker({
  date,
  onDateChange,
  placeholder = "Pick a date",
  dateFormat = "PPP",
  disabled = false,
  className,
}: DatePickerProps) {
  const [selected, setSelected] = React.useState<Date | undefined>(date)
  const [open, setOpen] = React.useState(false)

  // Sync controlled value
  React.useEffect(() => {
    setSelected(date)
  }, [date])

  const handleSelect = (day: Date | undefined) => {
    setSelected(day)
    onDateChange?.(day)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          data-slot="date-picker"
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-[280px] justify-start text-left font-normal",
            !selected && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 size-4" />
          {selected ? format(selected, dateFormat) : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={handleSelect}
        />
      </PopoverContent>
    </Popover>
  )
}

// ── DateRangePicker ─────────────────────────────────────────────────

interface DateRange {
  from: Date | undefined
  to?: Date | undefined
}

interface DateRangePickerProps {
  /** Currently selected date range */
  dateRange?: DateRange
  /** Called when the user picks a range */
  onDateRangeChange?: (range: DateRange | undefined) => void
  /** Placeholder when no range is selected */
  placeholder?: string
  /** Date format string (date-fns) */
  dateFormat?: string
  /** Disable the picker */
  disabled?: boolean
  className?: string
}

function DateRangePicker({
  dateRange,
  onDateRangeChange,
  placeholder = "Pick a date range",
  dateFormat = "LLL dd, y",
  disabled = false,
  className,
}: DateRangePickerProps) {
  const [range, setRange] = React.useState<DateRange | undefined>(dateRange)

  React.useEffect(() => {
    setRange(dateRange)
  }, [dateRange])

  const handleSelect = (selected: DateRange | undefined) => {
    setRange(selected)
    onDateRangeChange?.(selected)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          data-slot="date-range-picker"
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-[300px] justify-start text-left font-normal",
            !range && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 size-4" />
          {range?.from ? (
            range.to ? (
              <>
                {format(range.from, dateFormat)} –{" "}
                {format(range.to, dateFormat)}
              </>
            ) : (
              format(range.from, dateFormat)
            )
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          defaultMonth={range?.from}
          selected={range}
          onSelect={handleSelect}
          numberOfMonths={2}
        />
      </PopoverContent>
    </Popover>
  )
}

export { DatePicker, DateRangePicker }
export type { DatePickerProps, DateRangePickerProps, DateRange }
