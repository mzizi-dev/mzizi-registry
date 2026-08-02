"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface DateLabelProps extends React.ComponentProps<"time"> {
  /** Date to display */
  date: Date | string | number
  /** Force absolute format (skip relative) */
  absolute?: boolean
  /** Show time component */
  showTime?: boolean
  /** Relative threshold in hours — beyond this, show absolute date */
  relativeThreshold?: number
}

function formatRelative(date: Date): string {
  const now = Date.now()
  const diff = now - date.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return "just now"
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days === 1) return "yesterday"
  if (days < 7) return `${days}d ago`
  return ""
}

function formatAbsolute(date: Date, showTime: boolean): string {
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }
  if (showTime) {
    opts.hour = "2-digit"
    opts.minute = "2-digit"
  }
  return date.toLocaleDateString(undefined, opts)
}

function DateLabel({
  date,
  absolute = false,
  showTime = false,
  relativeThreshold = 168, // 7 days in hours
  className,
  ...props
}: DateLabelProps) {
  const d = React.useMemo(() => new Date(date), [date])
  const iso = d.toISOString()

  const display = React.useMemo(() => {
    if (absolute) return formatAbsolute(d, showTime)
    const hoursAgo = (Date.now() - d.getTime()) / (1000 * 60 * 60)
    if (hoursAgo < relativeThreshold) {
      const rel = formatRelative(d)
      if (rel) return rel
    }
    return formatAbsolute(d, showTime)
  }, [d, absolute, showTime, relativeThreshold])

  return (
    <time
      data-slot="date-label"
      data-portal="https://mzizi.dev/components/date-label"
      role="article"
      dateTime={iso}
      title={formatAbsolute(d, true)}
      className={cn("text-muted-foreground tabular-nums", className)}
      {...props}
    >
      {display}
    </time>
  )
}

export { DateLabel }
export type { DateLabelProps }
