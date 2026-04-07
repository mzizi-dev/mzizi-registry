"use client"

import * as React from "react"
import { MinusIcon, PlusIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface NumberInputProps {
  value?: number
  onChange?: (value: number) => void
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  className?: string
}

function NumberInput({
  value = 0,
  onChange,
  min = -Infinity,
  max = Infinity,
  step = 1,
  disabled = false,
  className,
}: NumberInputProps) {
  function clamp(n: number) {
    return Math.min(max, Math.max(min, n))
  }

  function decrement() {
    onChange?.(clamp(value - step))
  }

  function increment() {
    onChange?.(clamp(value + step))
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const parsed = parseFloat(e.target.value)
    if (!Number.isNaN(parsed)) {
      onChange?.(clamp(parsed))
    }
  }

  return (
    <div
      data-slot="number-input"
      className={cn(
        "inline-flex items-center rounded-4xl border border-input bg-input/30 transition-colors focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50",
        disabled && "pointer-events-none opacity-50",
        className
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        disabled={disabled || value <= min}
        onClick={decrement}
        aria-label="Decrease"
        className="rounded-l-4xl rounded-r-none"
      >
        <MinusIcon />
      </Button>
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={handleChange}
        disabled={disabled}
        aria-label="Number value"
        className="h-8 w-14 border-x border-border bg-transparent text-center text-sm outline-none"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        disabled={disabled || value >= max}
        onClick={increment}
        aria-label="Increase"
        className="rounded-l-none rounded-r-4xl"
      >
        <PlusIcon />
      </Button>
    </div>
  )
}

export { NumberInput }
export type { NumberInputProps }
