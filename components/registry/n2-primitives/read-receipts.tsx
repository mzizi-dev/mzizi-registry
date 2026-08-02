"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface ReadReceipt {
  id: string
  name: string
  avatar?: string
  readAt: Date | string
}

interface ReadReceiptsProps extends React.ComponentProps<"div"> {
  /** List of readers */
  readers: ReadReceipt[]
  /** Max avatars to show before +N overflow */
  maxVisible?: number
  /** Compact inline variant */
  variant?: "inline" | "expanded"
}

function ReadReceipts({
  readers,
  maxVisible = 5,
  variant = "inline",
  className,
  ...props
}: ReadReceiptsProps) {
  const visible = readers.slice(0, maxVisible)
  const overflow = readers.length - maxVisible

  if (readers.length === 0) return null

  return (
    <div
      data-slot="read-receipts"
      data-portal="https://mzizi.dev/components/read-receipts"
      aria-label={`Read by ${readers.length} ${readers.length === 1 ? "person" : "people"}`}
      className={cn("flex items-center gap-1", className)}
      {...props}
    >
      {/* Avatar stack */}
      <div className="flex -space-x-1.5">
        {visible.map((reader) => (
          <div
            key={reader.id}
            className="flex size-5 items-center justify-center rounded-full bg-muted text-[8px] font-medium ring-2 ring-background"
            title={`${reader.name}`}
          >
            {reader.avatar ? (
              <img
                src={reader.avatar}
                alt={reader.name}
                className="size-full rounded-full object-cover"
              />
            ) : (
              reader.name.charAt(0).toUpperCase()
            )}
          </div>
        ))}
      </div>
      {overflow > 0 && <span className="text-[10px] text-muted-foreground">+{overflow}</span>}
      {variant === "inline" && (
        <span className="text-[10px] text-muted-foreground">
          {readers.length === 1 ? "Read" : `Read by ${readers.length}`}
        </span>
      )}
    </div>
  )
}

export { ReadReceipts }
export type { ReadReceiptsProps, ReadReceipt }
