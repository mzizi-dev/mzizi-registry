"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface FontSettings {
  fontSize: number
  lineHeight: number
  fontFamily: "sans" | "serif" | "system"
  theme: "light" | "dark" | "sepia"
}

interface FontSettingsPanelProps extends Omit<React.ComponentProps<"div">, "onChange"> {
  settings: FontSettings
  onChange: (settings: FontSettings) => void
}

const themes = [
  { key: "light" as const, label: "Light", bg: "bg-white", text: "text-black" },
  { key: "dark" as const, label: "Dark", bg: "bg-[#1A1A1A]", text: "text-white" },
  { key: "sepia" as const, label: "Sepia", bg: "bg-[#F4ECD8]", text: "text-[#5B4636]" },
]

function FontSettingsPanel({ settings, onChange, className, ...props }: FontSettingsPanelProps) {
  const update = (partial: Partial<FontSettings>) => onChange({ ...settings, ...partial })

  return (
    <div
      data-slot="font-settings-panel"
      data-portal="https://mzizi.dev/components/font-settings-panel"
      className={cn(
        "space-y-4 rounded-[var(--radius-xl,17px)] border border-border bg-card p-5",
        className
      )}
      {...props}
    >
      {/* Font size */}
      <div>
        <label className="text-xs font-medium text-muted-foreground">Font Size</label>
        <div className="mt-1.5 flex items-center gap-3">
          <span className="text-xs text-muted-foreground">A</span>
          <input
            type="range"
            min={12}
            max={28}
            value={settings.fontSize}
            onChange={(e) => update({ fontSize: parseInt(e.target.value) })}
            className="h-1 flex-1 accent-primary"
            aria-label="Font size"
          />
          <span className="text-lg text-muted-foreground">A</span>
          <span className="w-8 text-right text-xs tabular-nums">{settings.fontSize}px</span>
        </div>
      </div>

      {/* Line height */}
      <div>
        <label className="text-xs font-medium text-muted-foreground">Line Spacing</label>
        <div className="mt-1.5 flex items-center gap-3">
          <input
            type="range"
            min={1.2}
            max={2.4}
            step={0.1}
            value={settings.lineHeight}
            onChange={(e) => update({ lineHeight: parseFloat(e.target.value) })}
            className="h-1 flex-1 accent-primary"
            aria-label="Line height"
          />
          <span className="w-8 text-right text-xs tabular-nums">
            {settings.lineHeight.toFixed(1)}
          </span>
        </div>
      </div>

      {/* Font family */}
      <div>
        <label className="text-xs font-medium text-muted-foreground">Font</label>
        <div className="mt-1.5 flex gap-1.5">
          {[
            { key: "serif" as const, label: "Serif", family: "var(--font-serif, serif)" },
            { key: "sans" as const, label: "Sans", family: "var(--font-sans, sans-serif)" },
            { key: "system" as const, label: "System", family: "system-ui" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => update({ fontFamily: f.key })}
              aria-pressed={settings.fontFamily === f.key}
              className={cn(
                "h-10 flex-1 rounded-full text-sm font-medium transition-colors",
                settings.fontFamily === f.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
              style={{ fontFamily: f.family }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reader theme */}
      <div>
        <label className="text-xs font-medium text-muted-foreground">Theme</label>
        <div className="mt-1.5 flex gap-1.5">
          {themes.map((t) => (
            <button
              key={t.key}
              onClick={() => update({ theme: t.key })}
              aria-pressed={settings.theme === t.key}
              className={cn(
                "flex h-10 flex-1 items-center justify-center rounded-full text-xs font-medium transition-all",
                t.bg,
                t.text,
                settings.theme === t.key && "ring-2 ring-primary"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export { FontSettingsPanel }
export type { FontSettingsPanelProps, FontSettings }
