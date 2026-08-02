"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type Environment = "dev" | "staging" | "production"

interface FeatureFlagToggleProps extends Omit<React.ComponentProps<"div">, "onToggle"> {
  name: string
  description?: string
  environments: Record<Environment, boolean>
  onToggle?: (env: Environment, enabled: boolean) => void
  rolloutPct?: number
  onRolloutChange?: (pct: number) => void
}

const envColors: Record<Environment, string> = {
  dev: "var(--color-cobalt,#00B0FF)",
  staging: "var(--color-gold,#FFD740)",
  production: "var(--color-malachite,#64FFDA)",
}

function FeatureFlagToggle({
  name,
  description,
  environments,
  onToggle,
  rolloutPct,
  onRolloutChange,
  className,
  ...props
}: FeatureFlagToggleProps) {
  return (
    <div
      data-slot="feature-flag-toggle"
      data-portal="https://mzizi.dev/components/feature-flag-toggle"
      className={cn(
        "flex items-center gap-4 rounded-[var(--radius-lg,14px)] border border-border bg-card px-4 py-3",
        className
      )}
      {...props}
    >
      <div className="min-w-0 flex-1">
        <div className="font-mono text-sm font-medium">{name}</div>
        {description && <div className="truncate text-xs text-muted-foreground">{description}</div>}
      </div>
      <div className="flex items-center gap-2">
        {(Object.entries(environments) as [Environment, boolean][]).map(([env, enabled]) => (
          <button
            key={env}
            onClick={() => onToggle?.(env, !enabled)}
            aria-label={`${env}: ${enabled ? "enabled" : "disabled"}`}
            className={cn(
              "flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[10px] font-medium transition-colors",
              enabled ? "bg-card shadow-sm" : "text-muted-foreground/50"
            )}
            style={enabled ? { color: envColors[env] } : undefined}
          >
            <div
              className={cn("size-1.5 rounded-full", enabled ? "" : "bg-muted-foreground/30")}
              style={enabled ? { backgroundColor: envColors[env] } : undefined}
            />
            {env.charAt(0).toUpperCase() + env.slice(1, 3)}
          </button>
        ))}
      </div>
      {rolloutPct !== undefined && onRolloutChange && (
        <div className="flex items-center gap-1.5 border-l border-border pl-3">
          <input
            type="range"
            min={0}
            max={100}
            value={rolloutPct}
            onChange={(e) => onRolloutChange(parseInt(e.target.value))}
            className="h-1 w-16 accent-[var(--color-malachite,#64FFDA)]"
            aria-label="Rollout percentage"
          />
          <span className="w-8 text-right font-mono text-[10px] tabular-nums">{rolloutPct}%</span>
        </div>
      )}
    </div>
  )
}

export { FeatureFlagToggle }
export type { FeatureFlagToggleProps }
