"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface CurrencyInputProps extends Omit<React.ComponentProps<"input">, "value" | "onChange"> {
  value?: number
  onChange?: (value: number) => void
  currency?: string
  onCurrencyChange?: (currency: string) => void
  currencies?: string[]
  placeholder?: string
}

const defaultCurrencies = ["MXT", "ZWL", "USD", "ZAR", "KES", "GHS", "NGN", "BWP"]

function CurrencyInput({
  value,
  onChange,
  currency = "MXT",
  onCurrencyChange,
  currencies = defaultCurrencies,
  placeholder = "0.00",
  className,
  ...props
}: CurrencyInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9.]/g, "")
    const parsed = parseFloat(raw)
    if (!isNaN(parsed)) onChange?.(parsed)
    else if (raw === "" || raw === ".") onChange?.(0)
  }

  return (
    <div
      data-slot="currency-input"
      data-portal="https://mzizi.dev/components/currency-input"
      className={cn(
        "flex h-12 items-center rounded-full border border-input bg-input/30 transition-colors focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50",
        className
      )}
    >
      {onCurrencyChange ? (
        <select
          value={currency}
          onChange={(e) => onCurrencyChange(e.target.value)}
          className="h-full rounded-l-full border-r border-border bg-transparent px-3 text-xs font-bold outline-none"
          aria-label="Currency"
        >
          {currencies.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      ) : (
        <span className="flex h-full items-center border-r border-border px-3 text-xs font-bold text-muted-foreground">
          {currency}
        </span>
      )}
      <input
        type="text"
        inputMode="decimal"
        value={value !== undefined ? value.toString() : ""}
        onChange={handleChange}
        placeholder={placeholder}
        className="h-full flex-1 bg-transparent px-3 text-right font-mono text-sm outline-none placeholder:text-muted-foreground"
        aria-label={`Amount in ${currency}`}
        {...props}
      />
    </div>
  )
}

export { CurrencyInput }
export type { CurrencyInputProps }
