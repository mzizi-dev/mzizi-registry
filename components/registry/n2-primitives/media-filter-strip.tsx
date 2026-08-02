"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface MediaFilter {
  id: string
  name: string
  previewUrl?: string
  previewColor?: string
}

interface MediaFilterStripProps extends Omit<React.ComponentProps<"div">, "onSelect"> {
  filters: MediaFilter[]
  selectedId?: string
  onSelect?: (filterId: string) => void
}

function MediaFilterStrip({
  filters,
  selectedId,
  onSelect,
  className,
  ...props
}: MediaFilterStripProps) {
  return (
    <div
      data-slot="media-filter-strip"
      data-portal="https://mzizi.dev/components/media-filter-strip"
      role="radiogroup"
      aria-label="Filters"
      className={cn("flex scrollbar-none gap-3 overflow-x-auto pb-2", className)}
      {...props}
    >
      {filters.map((filter) => (
        <button
          key={filter.id}
          role="radio"
          aria-checked={selectedId === filter.id}
          onClick={() => onSelect?.(filter.id)}
          className={cn(
            "flex shrink-0 flex-col items-center gap-1 transition-transform",
            selectedId === filter.id && "scale-110"
          )}
        >
          <div
            className={cn(
              "size-16 overflow-hidden rounded-full border-2 transition-colors",
              selectedId === filter.id
                ? "border-[var(--color-malachite,#64FFDA)]"
                : "border-transparent"
            )}
          >
            {filter.previewUrl ? (
              <img src={filter.previewUrl} alt={filter.name} className="size-full object-cover" />
            ) : (
              <div
                className="size-full"
                style={{ backgroundColor: filter.previewColor || "#333" }}
              />
            )}
          </div>
          <span
            className={cn(
              "text-[10px] font-medium",
              selectedId === filter.id ? "text-[var(--color-malachite,#64FFDA)]" : "text-white/60"
            )}
          >
            {filter.name}
          </span>
        </button>
      ))}
    </div>
  )
}

export { MediaFilterStrip }
export type { MediaFilterStripProps }
