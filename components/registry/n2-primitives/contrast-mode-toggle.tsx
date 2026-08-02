"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type ContrastMode = "light" | "dark" | "high-contrast" | "system"

interface ContrastModeToggleProps extends Omit<React.ComponentProps<"div">, "onChange"> {
  value?: ContrastMode
  onChange?: (mode: ContrastMode) => void
  compact?: boolean
}

const modes: { value: ContrastMode; label: string; icon: string }[] = [
  { value: "light", label: "Light", icon: "☀" },
  { value: "dark", label: "Dark", icon: "🌙" },
  { value: "high-contrast", label: "High Contrast", icon: "◐" },
  { value: "system", label: "System", icon: "💻" },
]

function ContrastModeToggle({
  value = "system",
  onChange,
  compact = false,
  className,
  ...props
}: ContrastModeToggleProps) {
  return (
    <div
      data-slot="contrast-mode-toggle"
      data-portal="https://mzizi.dev/components/contrast-mode-toggle"
      role="radiogroup"
      aria-label="Display mode"
      className={cn("inline-flex rounded-full border border-border bg-muted/30 p-0.5", className)}
      {...props}
    >
      {modes.map((mode) => (
        <button
          key={mode.value}
          role="radio"
          aria-checked={value === mode.value}
          aria-label={mode.label}
          onClick={() => onChange?.(mode.value)}
          className={cn(
            "rounded-full transition-colors",
            compact ? "size-8 text-sm" : "h-9 px-3 text-xs",
            value === mode.value
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {compact ? mode.icon : mode.label}
        </button>
      ))}
    </div>
  )
}

export { ContrastModeToggle }
export type { ContrastModeToggleProps }
