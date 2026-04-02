"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface TimePickerProps {
  value?: string
  onChange?: (value: string) => void
  use12Hour?: boolean
  className?: string
}

function pad(n: number) {
  return n.toString().padStart(2, "0")
}

function TimePicker({
  value = "12:00",
  onChange,
  use12Hour = false,
  className,
}: TimePickerProps) {
  const [hour, minute] = value.split(":").map(Number)
  const [period, setPeriod] = React.useState<"AM" | "PM">(hour >= 12 ? "PM" : "AM")

  function update(h: number, m: number, p?: "AM" | "PM") {
    const newPeriod = p ?? period
    let h24 = h
    if (use12Hour) {
      if (newPeriod === "PM" && h < 12) h24 = h + 12
      if (newPeriod === "AM" && h === 12) h24 = 0
    }
    onChange?.(`${pad(h24)}:${pad(m)}`)
  }

  const displayHour = use12Hour ? (hour % 12 || 12) : hour
  const hours = use12Hour ? Array.from({ length: 12 }, (_, i) => i + 1) : Array.from({ length: 24 }, (_, i) => i)
  const minutes = Array.from({ length: 60 }, (_, i) => i)

  return (
    <div
      data-slot="time-picker"
      className={cn(
        "inline-flex items-center gap-2 rounded-xl border border-input bg-input/30 p-2",
        className
      )}
    >
      <div className="flex flex-col items-center gap-1">
        <span className="text-[10px] font-medium text-muted-foreground">Hour</span>
        <select
          value={displayHour}
          onChange={(e) => update(Number(e.target.value), minute)}
          aria-label="Hour"
          className="h-9 w-14 rounded-lg border border-border bg-background px-1 text-center text-sm outline-none focus:border-ring focus:ring-ring/50 focus:ring-[3px]"
        >
          {hours.map((h) => (
            <option key={h} value={h}>{pad(h)}</option>
          ))}
        </select>
      </div>
      <span className="mt-4 text-lg font-semibold text-muted-foreground">:</span>
      <div className="flex flex-col items-center gap-1">
        <span className="text-[10px] font-medium text-muted-foreground">Min</span>
        <select
          value={minute}
          onChange={(e) => update(use12Hour ? displayHour : hour, Number(e.target.value))}
          aria-label="Minute"
          className="h-9 w-14 rounded-lg border border-border bg-background px-1 text-center text-sm outline-none focus:border-ring focus:ring-ring/50 focus:ring-[3px]"
        >
          {minutes.map((m) => (
            <option key={m} value={m}>{pad(m)}</option>
          ))}
        </select>
      </div>
      {use12Hour && (
        <div className="mt-4 flex flex-col gap-0.5">
          {(["AM", "PM"] as const).map((p) => (
            <Button
              key={p}
              type="button"
              variant={period === p ? "default" : "ghost"}
              size="xs"
              onClick={() => {
                setPeriod(p)
                update(displayHour, minute, p)
              }}
            >
              {p}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}

export { TimePicker }
export type { TimePickerProps }
