"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type SlotStatus = "available" | "partial" | "unavailable" | "selected"

interface TimeSlot {
  time: string
  status: SlotStatus
}

interface BookingDay {
  date: string
  label: string
  slots: TimeSlot[]
}

interface BookingCalendarProps extends React.ComponentProps<"div"> {
  days: BookingDay[]
  selectedSlot?: { date: string; time: string }
  onSlotSelect?: (date: string, time: string) => void
}

const slotStyles: Record<SlotStatus, string> = {
  available:
    "bg-[var(--color-malachite,#64FFDA)]/10 text-foreground hover:bg-[var(--color-malachite,#64FFDA)]/20 cursor-pointer",
  partial:
    "bg-[var(--color-gold,#FFD740)]/10 text-foreground hover:bg-[var(--color-gold,#FFD740)]/20 cursor-pointer",
  unavailable: "bg-muted/30 text-muted-foreground/40 cursor-not-allowed",
  selected: "bg-primary text-primary-foreground ring-2 ring-primary/30",
}

function BookingCalendar({
  days,
  selectedSlot,
  onSlotSelect,
  className,
  ...props
}: BookingCalendarProps) {
  return (
    <div
      data-slot="booking-calendar"
      data-portal="https://mzizi.dev/components/booking-calendar"
      className={cn("overflow-x-auto", className)}
      role="grid"
      aria-label="Booking availability"
      {...props}
    >
      <div className="inline-flex gap-3 pb-2">
        {days.map((day) => (
          <div key={day.date} className="w-28 shrink-0">
            <div className="mb-2 text-center text-xs font-medium">{day.label}</div>
            <div className="space-y-1">
              {day.slots.map((slot) => {
                const isSelected =
                  selectedSlot?.date === day.date && selectedSlot?.time === slot.time
                const effectiveStatus = isSelected ? "selected" : slot.status
                return (
                  <button
                    key={slot.time}
                    disabled={slot.status === "unavailable"}
                    onClick={() =>
                      slot.status !== "unavailable" && onSlotSelect?.(day.date, slot.time)
                    }
                    aria-label={`${slot.time} on ${day.label}: ${slot.status}`}
                    aria-pressed={isSelected}
                    className={cn(
                      "w-full rounded-[var(--radius-sm,7px)] py-1.5 text-center text-xs font-medium transition-colors",
                      slotStyles[effectiveStatus]
                    )}
                  >
                    {slot.time}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-4 text-[9px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="size-2 rounded-full bg-[var(--color-malachite,#64FFDA)]/40" /> Available
        </span>
        <span className="flex items-center gap-1">
          <span className="size-2 rounded-full bg-[var(--color-gold,#FFD740)]/40" /> Limited
        </span>
        <span className="flex items-center gap-1">
          <span className="size-2 rounded-full bg-muted" /> Unavailable
        </span>
      </div>
    </div>
  )
}

export { BookingCalendar }
export type { BookingCalendarProps }
