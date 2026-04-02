"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

function MasonryGrid({
  children,
  columns = 3,
  gap = "1rem",
  className,
  ...props
}: {
  children: React.ReactNode
  columns?: number
  gap?: string
} & React.ComponentProps<"div">) {
  return (
    <div
      data-slot="masonry-grid"
      className={cn("[&>*]:break-inside-avoid", className)}
      style={{
        columns,
        columnGap: gap,
      }}
      {...props}
    >
      {React.Children.map(children, (child) => (
        <div style={{ marginBottom: gap }}>{child}</div>
      ))}
    </div>
  )
}

export { MasonryGrid }
