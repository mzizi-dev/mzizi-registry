import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * SegmentedControl — a connected pill of 2–4 mutually exclusive options, built on native
 * radios so it needs no script: arrow keys move between segments, the form submits the
 * chosen value, and screen readers announce a radio group named by its legend. One
 * contract for every build: `contracts/ui/segmented-control` (`segmented-control.astro`
 * renders the same markup). A server component.
 */

const SEGMENT_SIZE = {
  default: "min-h-12 px-4 text-body-sm",
  sm: "min-h-10 px-3 text-body-sm",
} as const

const SEGMENT =
  "inline-flex items-center justify-center rounded-full font-medium text-foreground/80 transition-colors duration-200 ease-soft hover:text-foreground peer-checked:bg-card peer-checked:text-foreground peer-checked:shadow-sm peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background"

interface SegmentedControlProps {
  /** The radio group's form field name. */
  name: string
  /** The group's name, as a <legend>. */
  legend: string
  /** `[value, label]` pairs, one segment each, in order. */
  options: [string, string][]
  /** The checked segment's value. */
  value: string
  /** Keep the legend for screen readers only. */
  hideLegend?: boolean
  /** 48px segments, or 40px at `sm`. */
  size?: keyof typeof SEGMENT_SIZE
  className?: string
}

function SegmentedControl({
  name,
  legend,
  options,
  value,
  hideLegend = false,
  size = "default",
  className,
}: SegmentedControlProps) {
  return (
    <fieldset data-slot="segmented-control" className={cn("min-w-0", className)}>
      <legend
        className={hideLegend ? "sr-only" : "mb-1.5 block text-body-sm font-medium text-foreground"}
      >
        {legend}
      </legend>
      <div className="inline-flex max-w-full flex-wrap gap-1 rounded-full border border-border bg-muted p-1">
        {options.map(([v, label]) => (
          <label key={v} className="relative cursor-pointer">
            <input
              type="radio"
              name={name}
              value={v}
              defaultChecked={v === value}
              className="peer sr-only"
            />
            <span
              data-slot="segmented-control-segment"
              className={`${SEGMENT_SIZE[size]} ${SEGMENT}`}
            >
              {label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

export { SegmentedControl }
export type { SegmentedControlProps }
