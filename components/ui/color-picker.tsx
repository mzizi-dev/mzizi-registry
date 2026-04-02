"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

interface ColorPickerProps {
  value?: string
  onChange?: (value: string) => void
  className?: string
}

const MINERAL_PRESETS = [
  { name: "Cobalt", hex: "#0047AB" },
  { name: "Tanzanite", hex: "#B388FF" },
  { name: "Malachite", hex: "#64FFDA" },
  { name: "Gold", hex: "#FFD740" },
  { name: "Terracotta", hex: "#D4A574" },
] as const

const COMMON_PRESETS = [
  "#000000", "#FFFFFF", "#EF4444", "#F97316", "#22C55E",
  "#3B82F6", "#8B5CF6", "#EC4899", "#6B7280", "#0EA5E9",
] as const

function ColorPicker({ value = "#0047AB", onChange, className }: ColorPickerProps) {
  const [hex, setHex] = React.useState(value)

  React.useEffect(() => {
    setHex(value)
  }, [value])

  function selectColor(color: string) {
    setHex(color)
    onChange?.(color)
  }

  function handleHexChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value
    setHex(v)
    if (/^#[0-9A-Fa-f]{6}$/.test(v)) {
      onChange?.(v)
    }
  }

  return (
    <div data-slot="color-picker" className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-center gap-3">
        <div
          className="size-10 shrink-0 rounded-lg border border-border"
          style={{ backgroundColor: hex }}
        />
        <Input
          value={hex}
          onChange={handleHexChange}
          className="h-9 font-mono"
          maxLength={7}
          aria-label="Hex color value"
        />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-muted-foreground">Minerals</span>
        <div className="flex flex-wrap gap-1.5">
          {MINERAL_PRESETS.map(({ name, hex: presetHex }) => (
            <button
              key={name}
              type="button"
              title={name}
              aria-label={name}
              onClick={() => selectColor(presetHex)}
              className={cn(
                "size-7 rounded-md border-2 transition-all hover:scale-110",
                hex === presetHex ? "border-ring ring-ring/50 ring-[2px]" : "border-transparent"
              )}
              style={{ backgroundColor: presetHex }}
            />
          ))}
        </div>
        <span className="text-xs font-medium text-muted-foreground">Common</span>
        <div className="flex flex-wrap gap-1.5">
          {COMMON_PRESETS.map((presetHex) => (
            <button
              key={presetHex}
              type="button"
              aria-label={presetHex}
              onClick={() => selectColor(presetHex)}
              className={cn(
                "size-7 rounded-md border-2 transition-all hover:scale-110",
                hex === presetHex ? "border-ring ring-ring/50 ring-[2px]" : "border-border/50"
              )}
              style={{ backgroundColor: presetHex }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export { ColorPicker }
export type { ColorPickerProps }
