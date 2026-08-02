"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface CaptionEditorProps extends Omit<React.ComponentProps<"div">, "onChange"> {
  value?: string
  onChange?: (value: string) => void
  fontFamily?: "sans" | "serif" | "mono"
  onFontChange?: (font: "sans" | "serif" | "mono") => void
  textColor?: string
  onColorChange?: (color: string) => void
  fontSize?: number
  onFontSizeChange?: (size: number) => void
  placeholder?: string
  maxLength?: number
}

const fontOptions = [
  { key: "sans" as const, label: "Aa", family: "var(--font-sans, sans-serif)" },
  { key: "serif" as const, label: "Aa", family: "var(--font-serif, serif)" },
  { key: "mono" as const, label: "</>", family: "var(--font-mono, monospace)" },
]

const colorPresets = [
  "#FFFFFF",
  "#050504",
  "#64FFDA",
  "#00B0FF",
  "#B388FF",
  "#FFD740",
  "#D4A574",
  "#F87171",
]

function CaptionEditor({
  value = "",
  onChange,
  fontFamily = "sans",
  onFontChange,
  textColor = "#FFFFFF",
  onColorChange,
  fontSize = 24,
  onFontSizeChange,
  placeholder = "Add text…",
  maxLength = 200,
  className,
  ...props
}: CaptionEditorProps) {
  const selectedFont = fontOptions.find((f) => f.key === fontFamily) || fontOptions[0]

  return (
    <div
      data-slot="caption-editor"
      data-portal="https://mzizi.dev/components/caption-editor"
      className={cn("space-y-3", className)}
      {...props}
    >
      {/* Text input */}
      <textarea
        value={value}
        onChange={(e) => onChange?.(e.target.value.slice(0, maxLength))}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={2}
        className="w-full resize-none rounded-[var(--radius-md,12px)] border border-border bg-transparent p-3 text-center outline-none placeholder:text-muted-foreground focus:border-ring"
        style={{ fontFamily: selectedFont.family, fontSize, color: textColor }}
      />
      <div className="text-right text-[9px] text-muted-foreground">
        {value.length}/{maxLength}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        {/* Font selector */}
        <div className="flex gap-1">
          {fontOptions.map((f) => (
            <button
              key={f.key}
              onClick={() => onFontChange?.(f.key)}
              aria-label={`Font: ${f.key}`}
              aria-pressed={fontFamily === f.key}
              className={cn(
                "h-8 rounded-full px-2.5 text-xs font-medium transition-colors",
                fontFamily === f.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
              style={{ fontFamily: f.family }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Color palette */}
        <div className="flex gap-1">
          {colorPresets.map((c) => (
            <button
              key={c}
              onClick={() => onColorChange?.(c)}
              aria-label={`Color ${c}`}
              aria-pressed={textColor === c}
              className={cn(
                "size-6 rounded-full border transition-transform",
                textColor === c ? "scale-125 border-ring" : "border-transparent"
              )}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        {/* Size slider */}
        {onFontSizeChange && (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground">A</span>
            <input
              type="range"
              min={14}
              max={48}
              value={fontSize}
              onChange={(e) => onFontSizeChange(parseInt(e.target.value))}
              className="h-1 w-16 accent-primary"
              aria-label="Font size"
            />
            <span className="text-sm text-muted-foreground">A</span>
          </div>
        )}
      </div>
    </div>
  )
}

export { CaptionEditor }
export type { CaptionEditorProps }
