import * as React from "react"
import { cn } from "@/lib/utils"

interface TimelineProps extends React.ComponentProps<"div"> {
  children: React.ReactNode
}

function Timeline({ className, children, ...props }: TimelineProps) {
  return (
    <div
      data-slot="timeline"
      data-portal="https://mzizi.dev/components/timeline"
      className={cn("relative space-y-0", className)}
      {...props}
    >
      {children}
    </div>
  )
}

interface TimelineItemProps extends React.ComponentProps<"div"> {
  children: React.ReactNode
}

function TimelineItem({ className, children, ...props }: TimelineItemProps) {
  return (
    <div
      data-slot="timeline-item"
      className={cn("relative flex gap-4 pb-8 last:pb-0", className)}
      {...props}
    >
      {children}
    </div>
  )
}

interface TimelineDotProps extends React.ComponentProps<"div"> {
  /** Mineral accent color */
  color?: "cobalt" | "tanzanite" | "malachite" | "gold" | "terracotta" | "default"
}

const DOT_COLORS: Record<string, string> = {
  cobalt: "bg-[var(--color-primary,var(--color-cobalt,#00B0FF))]",
  tanzanite: "bg-[var(--color-accent,var(--color-tanzanite,#B388FF))]",
  malachite: "bg-[var(--status-success,var(--color-malachite,#64FFDA))]",
  gold: "bg-[var(--status-warning,var(--color-gold,#FFD740))]",
  terracotta: "bg-[var(--status-error,var(--color-terracotta,#D4A574))]",
  default: "bg-primary",
}

function TimelineDot({ color = "default", className, ...props }: TimelineDotProps) {
  return (
    <div
      data-slot="timeline-dot"
      className={cn("relative flex flex-col items-center", className)}
      {...props}
    >
      <div className={cn("z-10 flex size-3 shrink-0 rounded-full", DOT_COLORS[color])} />
      <div className="w-px flex-1 bg-border" />
    </div>
  )
}

interface TimelineContentProps extends React.ComponentProps<"div"> {
  children: React.ReactNode
}

function TimelineContent({ className, children, ...props }: TimelineContentProps) {
  return (
    <div
      data-slot="timeline-content"
      className={cn("flex-1 space-y-1 pt-0 pb-2", className)}
      {...props}
    >
      {children}
    </div>
  )
}

interface TimelineTimeProps extends React.ComponentProps<"time"> {
  children: React.ReactNode
}

function TimelineTime({ className, children, ...props }: TimelineTimeProps) {
  return (
    <time
      data-slot="timeline-time"
      className={cn("text-xs text-muted-foreground", className)}
      {...props}
    >
      {children}
    </time>
  )
}

interface TimelineHeadingProps extends React.ComponentProps<"h4"> {
  children: React.ReactNode
}

function TimelineHeading({ className, children, ...props }: TimelineHeadingProps) {
  return (
    <h4
      data-slot="timeline-heading"
      className={cn("text-sm leading-tight font-medium", className)}
      {...props}
    >
      {children}
    </h4>
  )
}

interface TimelineDescriptionProps extends React.ComponentProps<"p"> {
  children: React.ReactNode
}

function TimelineDescription({ className, children, ...props }: TimelineDescriptionProps) {
  return (
    <p
      data-slot="timeline-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    >
      {children}
    </p>
  )
}

export {
  Timeline,
  TimelineItem,
  TimelineDot,
  TimelineContent,
  TimelineTime,
  TimelineHeading,
  TimelineDescription,
}
