"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

interface TimeSlot {
  time: string
  available: boolean
}

function TimeSlotPicker({
  slots,
  selected,
  onSelect,
  className,
  ...props
}: {
  slots: TimeSlot[]
  selected?: string
  onSelect: (time: string) => void
} & Omit<React.ComponentProps<"div">, "onSelect">) {
  return (
    <div
      data-slot="time-slot-picker"
      className={cn("grid grid-cols-3 gap-2 sm:grid-cols-4", className)}
      role="listbox"
      aria-label="Available time slots"
      {...props}
    >
      {slots.map((slot) => {
        const isSelected = slot.time === selected
        return (
          <button
            key={slot.time}
            type="button"
            role="option"
            aria-selected={isSelected}
            disabled={!slot.available}
            onClick={() => slot.available && onSelect(slot.time)}
            className={cn(
              "inline-flex h-10 items-center justify-center rounded-lg text-sm font-medium tabular-nums transition-colors",
              isSelected
                ? "bg-[var(--color-cobalt)] text-white"
                : slot.available
                  ? "border border-border bg-input/30 text-foreground hover:bg-input/50"
                  : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
            )}
          >
            {slot.time}
          </button>
        )
      })}
    </div>
  )
}

export { TimeSlotPicker, type TimeSlot }
