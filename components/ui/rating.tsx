"use client"

import * as React from "react"
import { Star } from "lucide-react"
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
  className,
}: RatingProps) {
  const [hoverValue, setHoverValue] = React.useState<number | null>(null)
  const displayValue = hoverValue ?? controlledValue

  return (
    <div
      data-slot="rating"
      className={cn("inline-flex items-center gap-1", className)}
      onMouseLeave={() => !readOnly && setHoverValue(null)}
    >
      {Array.from({ length: max }, (_, i) => {
        const starValue = i + 1
        const isFilled = starValue <= displayValue

        return (
          <button
            key={i}
            type="button"
            disabled={readOnly}
            onClick={() => onValueChange?.(starValue)}
            onMouseEnter={() => !readOnly && setHoverValue(starValue)}
            className={cn(
              "transition-colors",
              readOnly ? "cursor-default" : "cursor-pointer",
              isFilled
                ? "text-[var(--color-gold)]"
                : "text-muted-foreground/30"
            )}
          >
            <Star
              className={cn(SIZE_MAP[size])}
              fill={isFilled ? "currentColor" : "none"}
            />
          </button>
        )
      })}
      {showValue && (
        <span className="ml-1 text-sm text-muted-foreground">
          {controlledValue.toFixed(1)}
        </span>
      )}
    </div>
  )
}

export { Rating }
export type { RatingProps }
