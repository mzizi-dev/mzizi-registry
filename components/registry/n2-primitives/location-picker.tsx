"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface LocationPickerProps extends Omit<React.ComponentProps<"div">, "onChange"> {
  value?: { lat: number; lng: number; address?: string }
  onChange?: (location: { lat: number; lng: number; address?: string }) => void
  placeholder?: string
  defaultCenter?: { lat: number; lng: number }
}

function LocationPicker({
  value,
  onChange,
  placeholder = "Search for a location…",
  defaultCenter = { lat: -17.8292, lng: 31.0522 },
  className,
  ...props
}: LocationPickerProps) {
  const [search, setSearch] = React.useState(value?.address || "")

  const handleManualInput = () => {
    /* In production, this would call a geocoding API.
       For the primitive, we just accept the search text as address. */
    if (search.trim()) {
      onChange?.({ ...defaultCenter, address: search.trim() })
    }
  }

  return (
    <div
      data-slot="location-picker"
      data-portal="https://mzizi.dev/components/location-picker"
      className={cn("space-y-2", className)}
      {...props}
    >
      {/* Search input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleManualInput()}
          placeholder={placeholder}
          className="h-12 flex-1 rounded-full border border-input bg-input/30 px-4 text-sm outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-[3px] focus:ring-ring/50"
          aria-label="Location search"
        />
        <button
          onClick={handleManualInput}
          className="h-12 shrink-0 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          Set
        </button>
      </div>

      {/* Map preview area — map library attaches here */}
      <div className="relative h-48 overflow-hidden rounded-[var(--radius-lg,14px)] bg-muted">
        <div className="absolute inset-0 flex items-center justify-center">
          {value ? (
            <div className="flex flex-col items-center gap-1">
              <div className="size-4 rounded-full border-3 border-white bg-[var(--color-malachite,#64FFDA)] shadow-md" />
              <span className="rounded-full bg-background/80 px-2 py-0.5 font-mono text-[9px] text-muted-foreground backdrop-blur-sm">
                {value.lat.toFixed(4)}, {value.lng.toFixed(4)}
              </span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">Tap map to set location</span>
          )}
        </div>
        {/* Grid to suggest map */}
        <svg className="absolute inset-0 size-full opacity-5" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="loc-grid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#loc-grid)" />
        </svg>
      </div>

      {/* Selected value */}
      {value?.address && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="size-1.5 rounded-full bg-[var(--color-malachite,#64FFDA)]" />
          <span className="truncate">{value.address}</span>
        </div>
      )}
    </div>
  )
}

export { LocationPicker }
export type { LocationPickerProps }
