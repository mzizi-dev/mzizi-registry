"use client"

import * as React from "react"
import { Star } from "@/lib/icons"
import { cn } from "@/lib/utils"

interface RatingProps {
  /** Current rating value (0-5) */
  value?: number
  /** Called when the user selects a rating */
  onValueChange?: (value: number) => void
  /** Maximum rating (default 5) */
  max?: number
  /** Read-only mode — no interaction */
  readOnly?: boolean
  /** Size of the stars */
  size?: "sm" | "md" | "lg"
  /** Show the numeric value next to the stars */
  showValue?: boolean
  /**
   * The accessible name. Read-only, it defaults to "<value> out of <max> stars" (the whole
   * rating, as an image); interactive, to "Rating" (the group's name). Interactive, each star
   * is a named toggle button ("3 stars", aria-pressed), so the group needs no radio semantics.
   */
  label?: string
  className?: string
}

const SIZE_MAP = {
  sm: "size-3.5",
  md: "size-5",
  lg: "size-6",
}

function Rating({
  value: controlledValue = 0,
  onValueChange,
  max = 5,
  readOnly = false,
  size = "md",
  showValue = false,
  label,
  className,
}: RatingProps) {
  const [hoverValue, setHoverValue] = React.useState<number | null>(null)
  const displayValue = hoverValue ?? controlledValue

  /* Read-only (#543): a picture of a rating, not a control. One role="img" named with the
     value, and the stars hidden from assistive tech, instead of a radiogroup of disabled
     buttons that announced nothing and could not be operated. */
  if (readOnly) {
    const spoken = Number.isInteger(controlledValue) ? String(controlledValue) : controlledValue.toFixed(1)
    return (
      <div
        data-slot="rating"
        data-portal="https://mzizi.dev/components/rating"
        data-readonly=""
        role="img"
        aria-label={label ?? `${spoken} out of ${max} stars`}
        className={cn("inline-flex items-center gap-1", className)}
      >
        {Array.from({ length: max }, (_, i) => {
          const isFilled = i + 1 <= controlledValue
          return (
            <span
              key={i}
              aria-hidden="true"
              className={cn(
                isFilled ? "text-[var(--status-warning,var(--color-gold,#FFD740))]" : "text-muted-foreground/30"
              )}
            >
              <Star className={cn(SIZE_MAP[size])} fill={isFilled ? "currentColor" : "none"} />
            </span>
          )
        })}
        {showValue && (
          <span aria-hidden="true" className="ml-1 text-sm text-muted-foreground">
            {controlledValue.toFixed(1)}
          </span>
        )}
      </div>
    )
  }

  return (
    <div
      data-slot="rating"
      data-portal="https://mzizi.dev/components/rating"
      role="group"
      aria-label={label ?? "Rating"}
      className={cn("inline-flex items-center gap-1", className)}
      onMouseLeave={() => setHoverValue(null)}
    >
      {Array.from({ length: max }, (_, i) => {
        const starValue = i + 1
        const isFilled = starValue <= displayValue

        return (
          <button
            key={i}
            type="button"
            aria-label={starValue === 1 ? "1 star" : `${starValue} stars`}
            aria-pressed={starValue <= controlledValue}
            onClick={() => onValueChange?.(starValue)}
            onMouseEnter={() => setHoverValue(starValue)}
            className={cn(
              "cursor-pointer transition-colors",
              isFilled
                ? "text-[var(--status-warning,var(--color-gold,#FFD740))]"
                : "text-muted-foreground/30"
            )}
          >
            <Star className={cn(SIZE_MAP[size])} fill={isFilled ? "currentColor" : "none"} />
          </button>
        )
      })}
      {showValue && (
        <span className="ml-1 text-sm text-muted-foreground">{controlledValue.toFixed(1)}</span>
      )}
    </div>
  )
}

export { Rating }
export type { RatingProps }
