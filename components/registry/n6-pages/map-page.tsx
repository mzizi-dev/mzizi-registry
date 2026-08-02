"use client"
import * as React from "react"
import { cn } from "@/lib/utils"
interface MapPageProps {
  mapContent?: React.ReactNode
  searchBar?: React.ReactNode
  bottomSheet?: React.ReactNode
  showMyLocation?: boolean
  children?: React.ReactNode
  loading?: boolean
  className?: string
}
export function MapPage({
  mapContent,
  searchBar,
  bottomSheet,
  children,
  loading = false,
  className,
}: MapPageProps) {
  if (loading)
    return (
      <main
        data-slot="map-page"
        data-portal="https://mzizi.dev/components/map-page"
        data-loading
        role="main"
        className="relative h-screen animate-pulse"
      >
        <div className="h-full bg-muted" />
        <div className="absolute top-4 right-4 left-4 h-12 rounded-full bg-card shadow" />
      </main>
    )
  return (
    <main
      data-slot="map-page"
      role="main"
      aria-label="Map"
      className={cn("relative flex h-screen flex-col", className)}
    >
      {searchBar && <div className="absolute top-4 right-4 left-4 z-10">{searchBar}</div>}
      <div className="relative flex-1">
        {mapContent || (
          <div className="flex h-full items-center justify-center bg-muted text-sm text-muted-foreground">
            Map loads here
          </div>
        )}
        {children}
      </div>
      {bottomSheet && <div className="relative z-10">{bottomSheet}</div>}
    </main>
  )
}
export type { MapPageProps }
