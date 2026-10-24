"use client"

import * as React from "react"
import { X } from "@/lib/icons"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface FilterOption {
  label: string
  value: string
  count?: number
}

interface FilterBarProps {
  /** Available filter options */
  options: FilterOption[]
  /** Currently selected values */
  selected?: string[]
  /** Called when selection changes */
  onSelectionChange?: (selected: string[]) => void
  /** Allow multiple selections (default true) */
  multiple?: boolean
  /** Show "All" option (default true) */
  showAll?: boolean
  /** Show clear button when filters are active */
  showClear?: boolean
  /** The group's accessible name ("Filters" by default). */
  label?: string
  className?: string
}

/* Each chip is a real <button type="button"> with aria-pressed (#543): it is in the tab order,
   answers Enter and Space, and announces whether it is on. It was a <span> with onClick, which
   no keyboard could reach and no screen reader could name as a control. The chip keeps the
   badge's look through `asChild`, at the 44px chip height `discover-category-chip` uses. */
const CHIP = "h-11 cursor-pointer rounded-full px-4 text-sm select-none"

function FilterBar({
  options,
  selected: controlledSelected,
  onSelectionChange,
  multiple = true,
  showAll = true,
  showClear = true,
  label = "Filters",
  className,
}: FilterBarProps) {
  const [internalSelected, setInternalSelected] = React.useState<string[]>([])
  const selected = controlledSelected ?? internalSelected

  const setSelected = (values: string[]) => {
    setInternalSelected(values)
    onSelectionChange?.(values)
  }

  const isAllSelected = selected.length === 0

  const handleToggle = (value: string) => {
    if (multiple) {
      if (selected.includes(value)) {
        setSelected(selected.filter((v) => v !== value))
      } else {
        setSelected([...selected, value])
      }
    } else {
      if (selected.includes(value)) {
        setSelected([])
      } else {
        setSelected([value])
      }
    }
  }

  return (
    <div
      data-slot="filter-bar"
      data-portal="https://mzizi.dev/components/filter-bar"
      role="group"
      aria-label={label}
      className={cn("flex flex-wrap items-center gap-2", className)}
    >
      {showAll && (
        <Badge asChild variant={isAllSelected ? "default" : "outline"} className={CHIP}>
          <button type="button" data-filter-value="" aria-pressed={isAllSelected} onClick={() => setSelected([])}>
            All
          </button>
        </Badge>
      )}
      {options.map((option) => {
        const isActive = selected.includes(option.value)
        return (
          <Badge key={option.value} asChild variant={isActive ? "default" : "outline"} className={CHIP}>
            <button
              type="button"
              data-filter-value={option.value}
              aria-pressed={isActive}
              onClick={() => handleToggle(option.value)}
            >
              {option.label}
              {option.count !== undefined && <span className="ml-1 opacity-60">{option.count}</span>}
            </button>
          </Badge>
        )
      })}
      {showClear && selected.length > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="min-h-11 gap-1 px-3 text-xs text-muted-foreground"
          onClick={() => setSelected([])}
        >
          <X className="size-3" aria-hidden="true" />
          Clear
        </Button>
      )}
    </div>
  )
}

export { FilterBar }
export type { FilterBarProps, FilterOption }
