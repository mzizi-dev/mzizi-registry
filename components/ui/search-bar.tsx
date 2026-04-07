"use client"

import * as React from "react"
import { Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"

interface SearchBarProps {
  /** Current search value */
  value?: string
  /** Called when the search value changes */
  onValueChange?: (value: string) => void
  /** Called when the user submits the search (Enter key) */
  onSubmit?: (value: string) => void
  /** Placeholder text */
  placeholder?: string
  /** Show keyboard shortcut hint (e.g., ⌘K) */
  showShortcut?: boolean
  /** Keyboard shortcut key (default "k") */
  shortcutKey?: string
  /** Show clear button when there is a value */
  showClear?: boolean
  className?: string
}

function SearchBar({
  value: controlledValue,
  onValueChange,
  onSubmit,
  placeholder = "Search...",
  showShortcut = true,
  shortcutKey = "k",
  showClear = true,
  className,
}: SearchBarProps) {
  const [internalValue, setInternalValue] = React.useState("")
  const inputRef = React.useRef<HTMLInputElement>(null)

  const value = controlledValue ?? internalValue
  const setValue = (v: string) => {
    setInternalValue(v)
    onValueChange?.(v)
  }

  // Global keyboard shortcut
  React.useEffect(() => {
    if (!showShortcut) return
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === shortcutKey) {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [showShortcut, shortcutKey])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onSubmit?.(value)
    }
    if (e.key === "Escape") {
      setValue("")
      inputRef.current?.blur()
    }
  }

  return (
    <div data-slot="search-bar" className={cn("relative", className)}>
      <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="pr-20 pl-9"
      />
      <div className="absolute top-1/2 right-2 flex -translate-y-1/2 items-center gap-1">
        {showClear && value && (
          <Button
            variant="ghost"
            size="sm"
            className="size-6 p-0"
            onClick={() => {
              setValue("")
              inputRef.current?.focus()
            }}
          >
            <X className="size-3" />
          </Button>
        )}
        {showShortcut && !value && <Kbd className="text-[10px]">⌘{shortcutKey.toUpperCase()}</Kbd>}
      </div>
    </div>
  )
}

export { SearchBar }
export type { SearchBarProps }
