"use client"

import * as React from "react"
import { Toolbar as ToolbarPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Toolbar({
  className,
  ariaLabel,
  ...props
}: React.ComponentProps<typeof ToolbarPrimitive.Root> & { ariaLabel: string }) {
  return (
    <ToolbarPrimitive.Root
      aria-label={ariaLabel}
      data-slot="toolbar"
      data-portal="https://mzizi.dev/components/toolbar"
      className={cn(
        "flex items-center gap-1 rounded-lg border bg-background p-1 shadow-sm data-[orientation=vertical]:flex-col",
        className
      )}
      {...props}
    />
  )
}

function ToolbarButton({
  className,
  ...props
}: React.ComponentProps<typeof ToolbarPrimitive.Button>) {
  return (
    <ToolbarPrimitive.Button
      data-slot="toolbar-button"
      className={cn(
        "inline-flex h-9 min-w-[48px] items-center justify-center gap-2 rounded-md px-3 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-muted data-[state=on]:text-foreground",
        className
      )}
      {...props}
    />
  )
}

function ToolbarLink({ className, ...props }: React.ComponentProps<typeof ToolbarPrimitive.Link>) {
  return (
    <ToolbarPrimitive.Link
      data-slot="toolbar-link"
      className={cn(
        "inline-flex h-9 min-w-[48px] items-center gap-2 rounded-md px-3 text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none",
        className
      )}
      {...props}
    />
  )
}

function ToolbarSeparator({
  className,
  ...props
}: React.ComponentProps<typeof ToolbarPrimitive.Separator>) {
  return (
    <ToolbarPrimitive.Separator
      data-slot="toolbar-separator"
      className={cn(
        "-mx-0.5 my-0.5 w-px bg-border data-[orientation=horizontal]:h-full data-[orientation=horizontal]:w-px data-[orientation=vertical]:mx-0.5 data-[orientation=vertical]:my-0 data-[orientation=vertical]:h-px data-[orientation=vertical]:w-full",
        className
      )}
      {...props}
    />
  )
}

function ToolbarToggleGroup({
  className,
  ...props
}: React.ComponentProps<typeof ToolbarPrimitive.ToggleGroup>) {
  return (
    <ToolbarPrimitive.ToggleGroup
      data-slot="toolbar-toggle-group"
      className={cn("flex items-center gap-0.5", className)}
      {...props}
    />
  )
}

function ToolbarToggleItem({
  className,
  ...props
}: React.ComponentProps<typeof ToolbarPrimitive.ToggleItem>) {
  return (
    <ToolbarPrimitive.ToggleItem
      data-slot="toolbar-toggle-item"
      className={cn(
        "inline-flex h-9 min-w-[48px] items-center justify-center gap-2 rounded-md px-3 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-muted data-[state=on]:text-foreground",
        className
      )}
      {...props}
    />
  )
}

export {
  Toolbar,
  ToolbarButton,
  ToolbarLink,
  ToolbarSeparator,
  ToolbarToggleGroup,
  ToolbarToggleItem,
}
