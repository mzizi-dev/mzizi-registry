import * as React from "react"
import { cn } from "@/lib/utils"

interface BookingConfirmationProps extends React.ComponentProps<"div"> {
  title: string
  type: string
  date: string
  time?: string
  location?: string
  reference: string
  status?: "confirmed" | "pending"
  onAddToCalendar?: () => void
  onShare?: () => void
}

function BookingConfirmation({
  title,
  type,
  date,
  time,
  location,
  reference,
  status = "confirmed",
  onAddToCalendar,
  onShare,
  className,
  ...props
}: BookingConfirmationProps) {
  return (
    <div
      data-slot="booking-confirmation"
      data-portal="https://mzizi.dev/components/booking-confirmation"
      role="status"
      aria-live="polite"
      className={cn(
        "rounded-[var(--radius-xl,17px)] border border-border bg-card p-5 text-center",
        className
      )}
      {...props}
    >
      <div
        className={cn(
          "mx-auto flex size-12 items-center justify-center rounded-full text-xl",
          status === "confirmed"
            ? "bg-[var(--color-malachite,#64FFDA)]/15"
            : "bg-[var(--color-gold,#FFD740)]/15"
        )}
      >
        {status === "confirmed" ? "✓" : "⏳"}
      </div>
      <div
        className="mt-3 text-base font-semibold"
        style={{ fontFamily: "var(--font-serif, serif)" }}
      >
        Booking {status === "confirmed" ? "Confirmed" : "Pending"}
      </div>
      <div className="mt-1 text-sm text-muted-foreground">{type}</div>

      <div className="mx-auto mt-4 max-w-xs space-y-2 text-left text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Event</span>
          <span className="font-medium">{title}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Date</span>
          <span>{date}</span>
        </div>
        {time && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Time</span>
            <span>{time}</span>
          </div>
        )}
        {location && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Location</span>
            <span>{location}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-muted-foreground">Reference</span>
          <span className="font-mono text-xs">{reference}</span>
        </div>
      </div>

      {/* QR placeholder */}
      <div className="mx-auto mt-4 flex size-24 items-center justify-center rounded-[var(--radius-md,12px)] bg-muted">
        <span className="text-3xl text-muted-foreground">▣</span>
      </div>

      <div className="mt-4 flex gap-2">
        {onAddToCalendar && (
          <button
            onClick={onAddToCalendar}
            className="h-10 flex-1 rounded-full border border-border text-xs font-medium transition-colors hover:bg-muted"
          >
            Add to Calendar
          </button>
        )}
        {onShare && (
          <button
            onClick={onShare}
            className="h-10 flex-1 rounded-full border border-border text-xs font-medium transition-colors hover:bg-muted"
          >
            Share
          </button>
        )}
      </div>
    </div>
  )
}

export { BookingConfirmation }
export type { BookingConfirmationProps }
