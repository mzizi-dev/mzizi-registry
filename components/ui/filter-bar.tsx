"use client"

import * as React from "react"
import { X } from "lucide-react"
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
  className?: string
}

function FilterBar({
  options,
  selected: controlledSelected,
  onSelectionChange,
  multiple = true,
  showAll = true,
  showClear = true,
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
      className={cn(
        "flex flex-wrap items-center gap-2",
        className
      )}
    >
      {showAll && (
        <Badge
          variant={isAllSelected ? "default" : "outline"}
          className="cursor-pointer select-none transition-colors"
          onClick={() => setSelected([])}
        >
          All
        </Badge>
      )}
      {options.map((option) => {
        const isActive = selected.includes(option.value)
        return (
          <Badge
            key={option.value}
            variant={isActive ? "default" : "outline"}
            className="cursor-pointer select-none transition-colors"
            onClick={() => handleToggle(option.value)}
          >
            {option.label}
            {option.count !== undefined && (
              <span className="ml-1 opacity-60">{option.count}</span>
            )}
          </Badge>
        )
      })}
      {showClear && selected.length > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 gap-1 px-2 text-xs text-muted-foreground"
          onClick={() => setSelected([])}
        >
          <X className="size-3" />
          Clear
        </Button>
      )}
    </div>
  )
}

export { FilterBar }
export type { FilterBarProps, FilterOption }
