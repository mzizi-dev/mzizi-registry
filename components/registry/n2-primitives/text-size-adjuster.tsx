"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type TextSize = "sm" | "default" | "lg" | "xl"

interface TextSizeAdjusterProps extends Omit<React.ComponentProps<"div">, "onChange"> {
  value?: TextSize
  onChange?: (size: TextSize) => void
}

const sizes: { value: TextSize; label: string; scale: string }[] = [
  { value: "sm", label: "A", scale: "text-xs" },
  { value: "default", label: "A", scale: "text-sm" },
  { value: "lg", label: "A", scale: "text-base" },
  { value: "xl", label: "A", scale: "text-lg" },
]

function TextSizeAdjuster({
  value = "default",
  onChange,
  className,
  ...props
}: TextSizeAdjusterProps) {
  return (
    <div
      data-slot="text-size-adjuster"
      data-portal="https://mzizi.dev/components/text-size-adjuster"
      role="radiogroup"
      aria-label="Text size"
      className={cn(
        "inline-flex items-end gap-1 rounded-full border border-border bg-muted/30 p-1",
        className
      )}
      {...props}
    >
      {sizes.map((size) => (
        <button
          key={size.value}
          role="radio"
          aria-checked={value === size.value}
          aria-label={`Text size ${size.value}`}
          onClick={() => onChange?.(size.value)}
          className={cn(
            "flex size-9 items-center justify-center rounded-full font-medium transition-colors",
            size.scale,
            value === size.value
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {size.label}
        </button>
      ))}
    </div>
  )
}

export { TextSizeAdjuster }
export type { TextSizeAdjusterProps }
