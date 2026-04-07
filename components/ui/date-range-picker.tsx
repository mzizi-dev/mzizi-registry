"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import type { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface DateRangePreset {
  label: string
  range: DateRange
}

function DateRangePicker({
  className,
  dateRange,
  onDateRangeChange,
  presets,
  placeholder = "Pick a date range",
  ...props
}: React.ComponentProps<"div"> & {
  dateRange?: DateRange
  onDateRangeChange?: (range: DateRange | undefined) => void
  presets?: DateRangePreset[]
  placeholder?: string
}) {
  const formatDate = (date: Date) =>
    date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })

  return (
    <div data-slot="date-range-picker" className={cn("grid gap-2", className)} {...props}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="default"
            className={cn(
              "w-full justify-start text-left font-normal",
              !dateRange?.from && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="size-4" />
            {dateRange?.from ? (
              dateRange.to ? (
                <span>
                  {formatDate(dateRange.from)} &ndash; {formatDate(dateRange.to)}
                </span>
              ) : (
                <span>{formatDate(dateRange.from)}</span>
              )
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex flex-col gap-2 sm:flex-row">
            {presets && presets.length > 0 && (
              <div className="flex flex-row gap-1 border-b p-3 sm:flex-col sm:border-r sm:border-b-0">
                {presets.map((preset) => (
                  <Button
                    key={preset.label}
                    variant="ghost"
                    size="sm"
                    className="justify-start text-xs"
                    onClick={() => onDateRangeChange?.(preset.range)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            )}
            <div className="p-3">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={onDateRangeChange}
                numberOfMonths={2}
                defaultMonth={dateRange?.from}
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

export { DateRangePicker }
export type { DateRangePreset }
