"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const segmentedControlVariants = cva(
  "inline-flex items-center rounded-full bg-muted p-1 text-muted-foreground",
  {
    variants: {
      size: {
        default: "h-12",
        sm: "h-10",
        lg: "h-14",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

const segmentVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium whitespace-nowrap ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm min-w-[48px]",
  {
    variants: {
      size: {
        default: "h-10",
        sm: "h-8 text-xs",
        lg: "h-12 text-base",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

type SegmentedControlContextValue = {
  value: string | undefined
  onValueChange: (value: string) => void
  size: VariantProps<typeof segmentVariants>["size"]
  name?: string
}

const SegmentedControlContext = React.createContext<SegmentedControlContextValue | null>(null)

function useSegmentedControl() {
  const context = React.useContext(SegmentedControlContext)
  if (!context) {
    throw new Error("SegmentedControl.Item must be used within SegmentedControl")
  }
  return context
}

interface SegmentedControlProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, "onChange">,
    VariantProps<typeof segmentedControlVariants> {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  name?: string
  ariaLabel: string
}

function SegmentedControl({
  className,
  size,
  value: controlledValue,
  defaultValue,
  onValueChange,
  name,
  ariaLabel,
  children,
  ...props
}: SegmentedControlProps) {
  const [uncontrolledValue, setUncontrolledValue] = React.useState<string | undefined>(defaultValue)
  const value = controlledValue !== undefined ? controlledValue : uncontrolledValue

  const handleValueChange = React.useCallback(
    (next: string) => {
      if (controlledValue === undefined) setUncontrolledValue(next)
      onValueChange?.(next)
    },
    [controlledValue, onValueChange]
  )

  return (
    <SegmentedControlContext.Provider
      value={{ value, onValueChange: handleValueChange, size, name }}
    >
      <div
        role="radiogroup"
        aria-label={ariaLabel}
        data-slot="segmented-control"
        data-portal="https://mzizi.dev/components/segmented-control"
        data-size={size}
        className={cn(segmentedControlVariants({ size }), className)}
        {...props}
      >
        {children}
      </div>
    </SegmentedControlContext.Provider>
  )
}

interface SegmentedControlItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string
}

function SegmentedControlItem({
  className,
  value,
  children,
  disabled,
  ...props
}: SegmentedControlItemProps) {
  const ctx = useSegmentedControl()
  const selected = ctx.value === value

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      data-slot="segmented-control-item"
      data-state={selected ? "on" : "off"}
      data-size={ctx.size}
      disabled={disabled}
      onClick={() => ctx.onValueChange(value)}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight" || e.key === "ArrowDown") {
          const next = e.currentTarget.nextElementSibling as HTMLButtonElement | null
          next?.focus()
          next?.click()
          e.preventDefault()
        }
        if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
          const prev = e.currentTarget.previousElementSibling as HTMLButtonElement | null
          prev?.focus()
          prev?.click()
          e.preventDefault()
        }
      }}
      className={cn(segmentVariants({ size: ctx.size }), className)}
      {...props}
    >
      {children}
    </button>
  )
}

export { SegmentedControl, SegmentedControlItem, segmentedControlVariants, segmentVariants }
