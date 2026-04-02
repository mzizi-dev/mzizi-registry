"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

interface AutocompleteProps extends Omit<React.ComponentProps<"input">, "value" | "onChange"> {
  value: string
  onChange: (value: string) => void
  onSearch?: (query: string) => void | Promise<void>
  suggestions?: string[]
  loading?: boolean
}

function Autocomplete({
  className,
  value,
  onChange,
  onSearch,
  suggestions = [],
  loading = false,
  placeholder,
  ...props
}: AutocompleteProps) {
  const [open, setOpen] = React.useState(false)
  const [activeIndex, setActiveIndex] = React.useState(-1)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const listRef = React.useRef<HTMLUListElement>(null)

  React.useEffect(() => {
    if (value) {
      onSearch?.(value)
      setOpen(true)
    } else {
      setOpen(false)
    }
    setActiveIndex(-1)
  }, [value, onSearch])

  const handleSelect = React.useCallback(
    (suggestion: string) => {
      onChange(suggestion)
      setOpen(false)
      inputRef.current?.focus()
    },
    [onChange]
  )

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (!open || suggestions.length === 0) return

      if (e.key === "ArrowDown") {
        e.preventDefault()
        setActiveIndex((prev) => (prev + 1) % suggestions.length)
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setActiveIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1))
      } else if (e.key === "Enter" && activeIndex >= 0) {
        e.preventDefault()
        handleSelect(suggestions[activeIndex])
      } else if (e.key === "Escape") {
        setOpen(false)
      }
    },
    [open, suggestions, activeIndex, handleSelect]
  )

  const showDropdown = open && (suggestions.length > 0 || loading)

  return (
    <div data-slot="autocomplete" className={cn("relative", className)}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          data-slot="autocomplete-input"
          role="combobox"
          aria-expanded={showDropdown}
          aria-autocomplete="list"
          aria-controls="autocomplete-list"
          aria-activedescendant={activeIndex >= 0 ? `autocomplete-option-${activeIndex}` : undefined}
          className={cn(
            "bg-input/30 border-input focus-visible:border-ring focus-visible:ring-ring/50 placeholder:text-muted-foreground h-9 w-full min-w-0 rounded-4xl border px-3 py-1 text-base outline-none transition-colors focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 md:text-sm"
          )}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => value && suggestions.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          {...props}
        />
        {loading && (
          <Loader2 className="text-muted-foreground absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin" />
        )}
      </div>
      {showDropdown && (
        <ul
          ref={listRef}
          id="autocomplete-list"
          role="listbox"
          className="bg-popover ring-foreground/10 absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl p-1 text-sm shadow-lg ring-1"
        >
          {suggestions.map((suggestion, index) => (
            <li
              key={suggestion}
              id={`autocomplete-option-${index}`}
              role="option"
              aria-selected={index === activeIndex}
              className={cn(
                "cursor-pointer rounded-md px-3 py-2 transition-colors",
                index === activeIndex ? "bg-muted text-foreground" : "text-foreground hover:bg-muted/50"
              )}
              onMouseDown={() => handleSelect(suggestion)}
              onMouseEnter={() => setActiveIndex(index)}
            >
              {suggestion}
            </li>
          ))}
          {loading && suggestions.length === 0 && (
            <li className="text-muted-foreground px-3 py-2">Searching...</li>
          )}
        </ul>
      )}
    </div>
  )
}

export { Autocomplete, type AutocompleteProps }
