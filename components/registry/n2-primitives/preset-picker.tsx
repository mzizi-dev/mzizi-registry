"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { SafeAreaFrame, type SafeInsets } from "@/components/ui/safe-area-frame"

/**
 * PresetPicker — choose output sizes. Each size is a true-aspect thumbnail
 * with its platform bands (SafeAreaFrame), grouped by platform. Two actions
 * per size, kept apart so neither is ambiguous: select the card to make it
 * the ACTIVE size (one at a time, `aria-pressed`), tick its checkbox to
 * INCLUDE it in a batch (any number). Both are 44px+ targets.
 */

interface PresetOption {
  id: string
  name: string
  width: number
  height: number
  safe?: SafeInsets
}

interface PresetGroup {
  id: string
  label: string
  presets: PresetOption[]
}

interface PresetPickerProps extends Omit<React.ComponentProps<"div">, "onChange"> {
  groups: PresetGroup[]
  /** The active preset id. */
  active: string
  onActiveChange: (id: string) => void
  /** Ids included in the batch. */
  included: string[]
  onIncludedChange: (ids: string[]) => void
}

function PresetPicker({
  groups,
  active,
  onActiveChange,
  included,
  onIncludedChange,
  className,
  ...props
}: PresetPickerProps) {
  const toggle = (id: string, on: boolean) =>
    onIncludedChange(
      on ? [...included.filter((x) => x !== id), id] : included.filter((x) => x !== id)
    )
  return (
    <div data-slot="preset-picker" className={cn("space-y-5", className)} {...props}>
      {groups.map((g) => (
        <div key={g.id} data-slot="preset-picker-group">
          <h3 className="text-xs font-semibold tracking-[0.12em] text-foreground/80 uppercase">
            {g.label}
          </h3>
          <ul className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 2xl:grid-cols-4">
            {g.presets.map((p) => {
              const isActive = p.id === active
              return (
                <li
                  key={p.id}
                  data-slot="preset-picker-item"
                  data-active={isActive || undefined}
                  className={cn(
                    "relative rounded-[14px] border bg-background transition-colors",
                    isActive ? "border-primary bg-primary/10" : "border-border"
                  )}
                >
                  <button
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => onActiveChange(p.id)}
                    className="flex min-h-28 w-full flex-col items-center gap-1.5 rounded-[14px] p-3 pr-10 text-center focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    <SafeAreaFrame width={p.width} height={p.height} safe={p.safe} box={48} />
                    <span className="text-sm leading-tight font-medium text-foreground">
                      {p.name}
                    </span>
                    <span className="font-mono text-xs text-foreground/80">
                      {p.width}×{p.height}
                    </span>
                  </button>
                  <label className="absolute top-1 right-1 grid size-11 cursor-pointer place-items-center rounded-full hover:bg-muted">
                    <input
                      type="checkbox"
                      checked={included.includes(p.id)}
                      onChange={(e) => toggle(p.id, e.currentTarget.checked)}
                      aria-label={`Include ${p.name} in the set`}
                      className="size-5 cursor-pointer rounded-[7px] accent-[var(--primary)]"
                    />
                  </label>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </div>
  )
}

export { PresetPicker }
export type { PresetPickerProps, PresetGroup, PresetOption }
