"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LazySection } from "@/components/lazy-section"
import { SectionErrorBoundary } from "@/components/section-error-boundary"
import { useMemoryPressure } from "@/hooks/use-memory-pressure"
import { cn } from "@/lib/utils"

function DemoSection({ name, mineral, delay }: { name: string; mineral: string; delay: number }) {
  const colors: Record<string, string> = {
    cobalt: "border-[var(--color-cobalt)]/20 bg-[var(--color-cobalt)]/5",
    tanzanite: "border-[var(--color-tanzanite)]/20 bg-[var(--color-tanzanite)]/5",
    malachite: "border-[var(--color-malachite)]/20 bg-[var(--color-malachite)]/5",
    gold: "border-[var(--color-gold)]/20 bg-[var(--color-gold)]/5",
    terracotta: "border-[var(--color-terracotta)]/20 bg-[var(--color-terracotta)]/5",
  }
  const dots: Record<string, string> = {
    cobalt: "bg-[var(--color-cobalt)]",
    tanzanite: "bg-[var(--color-tanzanite)]",
    malachite: "bg-[var(--color-malachite)]",
    gold: "bg-[var(--color-gold)]",
    terracotta: "bg-[var(--color-terracotta)]",
  }
  return (
    <div className={cn("flex flex-col gap-3 rounded-2xl border p-6", colors[mineral])}>
      <div className="flex items-center gap-2">
        <div className={cn("size-2.5 rounded-full", dots[mineral])} />
        <span className="text-sm font-semibold text-foreground">{name}</span>
        <Badge variant="outline" className="ml-auto text-[10px]">
          mounted
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground">
        This section mounted after a {delay}ms delay in the queue. Scroll it far away and it will
        unmount to reclaim memory.
      </p>
      <div className="flex items-end gap-1">
        {Array.from({ length: 12 }, (_, i) => (
          <div
            key={i}
            className={cn("w-3 rounded-t transition-all", dots[mineral])}
            style={{ height: `${20 + Math.random() * 40}px`, opacity: 0.3 + Math.random() * 0.7 }}
          />
        ))}
      </div>
    </div>
  )
}

function SkeletonFallback() {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-secondary/30 p-6">
      <div className="flex items-center gap-2">
        <div className="size-2.5 animate-pulse rounded-full bg-muted-foreground/20" />
        <div className="h-4 w-32 animate-pulse rounded bg-muted-foreground/20" />
        <div className="ml-auto h-4 w-16 animate-pulse rounded bg-muted-foreground/20" />
      </div>
      <div className="h-3 w-3/4 animate-pulse rounded bg-muted-foreground/10" />
      <div className="flex items-end gap-1">
        {Array.from({ length: 12 }, (_, i) => (
          <div
            key={i}
            className="w-3 animate-pulse rounded-t bg-muted-foreground/10"
            style={{ height: `${20 + Math.random() * 40}px` }}
          />
        ))}
      </div>
    </div>
  )
}

export function LazyLoadingDemo() {
  const [enabled, setEnabled] = useState(true)
  const memory = useMemoryPressure()

  const sections = [
    { name: "Current Conditions", mineral: "malachite", delay: 0 },
    { name: "Hourly Forecast", mineral: "cobalt", delay: 150 },
    { name: "7-Day Outlook", mineral: "tanzanite", delay: 300 },
    { name: "Weather Charts", mineral: "gold", delay: 450 },
    { name: "Community Reports", mineral: "terracotta", delay: 600 },
  ]

  return (
    <div className="flex flex-col gap-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4">
        <Button
          variant={enabled ? "default" : "outline"}
          size="sm"
          onClick={() => setEnabled(!enabled)}
        >
          {enabled ? "Sequential loading ON" : "Sequential loading OFF"}
        </Button>
        {memory.usedMB !== null && (
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "size-2 rounded-full",
                memory.isUnderPressure ? "bg-destructive" : "bg-[var(--color-malachite)]"
              )}
            />
            <span className="text-xs text-muted-foreground">
              Memory: {memory.usedMB}MB / {memory.totalMB}MB ({memory.usagePercent}%)
            </span>
          </div>
        )}
        {memory.usedMB === null && (
          <span className="text-xs text-muted-foreground">
            Memory API not available (Chrome only)
          </span>
        )}
      </div>

      {/* Sections */}
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 sm:p-6">
        <p className="text-xs text-muted-foreground">
          {enabled
            ? "Sections mount one at a time through a FIFO queue (150ms mobile / 50ms desktop delay). Scroll down to see them appear."
            : "All sections mount simultaneously (disabled mode)."}
        </p>

        {/* First section always eager */}
        <SectionErrorBoundary section="Current Conditions">
          <DemoSection {...sections[0]} />
        </SectionErrorBoundary>

        {/* Remaining sections use LazySection */}
        {sections.slice(1).map((s) => (
          <LazySection
            key={s.name}
            section={s.name}
            disabled={!enabled}
            fallback={<SkeletonFallback />}
          >
            <SectionErrorBoundary section={s.name}>
              <DemoSection {...s} />
            </SectionErrorBoundary>
          </LazySection>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span>Mobile delay: 150ms</span>
        <span className="text-border">|</span>
        <span>Desktop delay: 50ms</span>
        <span className="text-border">|</span>
        <span>Unmount distance: 1500px</span>
      </div>
    </div>
  )
}
