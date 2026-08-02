"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const bentoGridVariants = cva("grid auto-rows-[minmax(180px,auto)] gap-4", {
  variants: {
    columns: {
      2: "grid-cols-1 sm:grid-cols-2",
      3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
      4: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
      6: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6",
    },
    density: {
      compact: "gap-2 auto-rows-[minmax(120px,auto)]",
      default: "gap-4 auto-rows-[minmax(180px,auto)]",
      spacious: "gap-6 auto-rows-[minmax(240px,auto)]",
    },
  },
  defaultVariants: {
    columns: 4,
    density: "default",
  },
})

const bentoTileVariants = cva(
  "relative overflow-hidden rounded-lg border bg-card p-6 shadow-sm transition-all hover:shadow-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
  {
    variants: {
      size: {
        "1x1": "col-span-1 row-span-1",
        "1x2": "col-span-1 row-span-2",
        "2x1": "col-span-1 sm:col-span-2 row-span-1",
        "2x2": "col-span-1 sm:col-span-2 row-span-2",
        "3x1": "col-span-1 sm:col-span-2 lg:col-span-3 row-span-1",
        "3x2": "col-span-1 sm:col-span-2 lg:col-span-3 row-span-2",
      },
      tone: {
        default: "bg-card",
        muted: "bg-muted",
        accent: "bg-accent text-accent-foreground",
        primary: "bg-primary text-primary-foreground",
      },
    },
    defaultVariants: {
      size: "1x1",
      tone: "default",
    },
  }
)

interface BentoGridProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof bentoGridVariants> {}

function BentoGrid({ className, columns, density, children, ...props }: BentoGridProps) {
  return (
    <div
      data-slot="bento-grid"
      data-portal="https://mzizi.dev/components/bento-grid"
      data-columns={columns}
      data-density={density}
      role="list"
      className={cn(bentoGridVariants({ columns, density }), className)}
      {...props}
    >
      {children}
    </div>
  )
}

interface BentoTileProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof bentoTileVariants> {
  asChild?: boolean
}

function BentoTile({ className, size, tone, children, ...props }: BentoTileProps) {
  return (
    <div
      data-slot="bento-tile"
      data-size={size}
      data-tone={tone}
      role="listitem"
      className={cn(bentoTileVariants({ size, tone }), className)}
      {...props}
    >
      {children}
    </div>
  )
}

function BentoTileHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="bento-tile-header"
      className={cn("mb-3 flex items-start justify-between gap-2", className)}
      {...props}
    />
  )
}

function BentoTileTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      data-slot="bento-tile-title"
      className={cn("text-lg leading-tight font-semibold tracking-tight", className)}
      {...props}
    />
  )
}

function BentoTileDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      data-slot="bento-tile-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function BentoTileContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="bento-tile-content" className={cn("mt-auto", className)} {...props} />
}

export {
  BentoGrid,
  BentoTile,
  BentoTileHeader,
  BentoTileTitle,
  BentoTileDescription,
  BentoTileContent,
  bentoGridVariants,
  bentoTileVariants,
}
