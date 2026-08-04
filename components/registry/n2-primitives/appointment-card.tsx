"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface AppointmentCardProps extends React.ComponentProps<"div"> {
  providerName: string
  providerAvatar?: string
  specialty?: string
  date: Date | string
  time?: string
  location?: string
  status?: "scheduled" | "confirmed" | "in-progress" | "completed" | "cancelled"
  type?: "in-person" | "telemedicine"
  onJoin?: () => void
  onCancel?: () => void
  onReschedule?: () => void
}

const statusStyles: Record<string, string> = {
  scheduled: "bg-[var(--color-cobalt,#00B0FF)]/10 text-[var(--color-cobalt,#00B0FF)]",
  confirmed: "bg-[var(--color-malachite,#64FFDA)]/10 text-[var(--color-malachite,#64FFDA)]",
  "in-progress": "bg-[var(--color-gold,#FFD740)]/10 text-[var(--color-gold,#FFD740)]",
  completed: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/10 text-destructive",
}

function AppointmentCard({
  providerName,
  providerAvatar,
  specialty,
  date,
  time,
  location,
  status = "scheduled",
  type = "in-person",
  onJoin,
  onCancel,
  onReschedule,
  className,
  ...props
}: AppointmentCardProps) {
  const d = new Date(date)
  const dateStr = d.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  })

  return (
    <div
      data-slot="appointment-card"
      data-portal="https://mzizi.dev/components/appointment-card"
      role="article"
      className={cn(
        "flex gap-3 rounded-[var(--radius-lg,14px)] border border-border bg-card p-4",
        className
      )}
      {...props}
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium">
        {providerAvatar ? (
          <img
            src={providerAvatar}
            alt={providerName}
            className="size-full rounded-full object-cover"
          />
        ) : (
          providerName.charAt(0)
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-sm font-medium">{providerName}</div>
            {specialty && <div className="text-xs text-muted-foreground">{specialty}</div>}
          </div>
          <span
            className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", statusStyles[status])}
          >
            {status}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span>{dateStr}</span>
          {time && <span>{time}</span>}
          {location && <span>{location}</span>}
          {type === "telemedicine" && (
            <span className="text-[var(--color-cobalt,#00B0FF)]">Video call</span>
          )}
        </div>
        {(onJoin || onCancel || onReschedule) && (
          <div className="mt-3 flex gap-2">
            {onJoin && status !== "cancelled" && status !== "completed" && (
              <button
                onClick={onJoin}
                className="h-8 rounded-full bg-primary px-3 text-xs font-medium text-primary-foreground"
              >
                {type === "telemedicine" ? "Join Call" : "Check In"}
              </button>
            )}
            {onReschedule && status === "scheduled" && (
              <button
                onClick={onReschedule}
                className="h-8 rounded-full border border-border px-3 text-xs font-medium transition-colors hover:bg-muted"
              >
                Reschedule
              </button>
            )}
            {onCancel && status === "scheduled" && (
              <button
                onClick={onCancel}
                className="h-8 rounded-full px-3 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
              >
                Cancel
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export { AppointmentCard }
export type { AppointmentCardProps }
