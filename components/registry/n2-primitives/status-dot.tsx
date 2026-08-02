"use client"
import * as React from "react"
import { cn } from "@/lib/utils"

type StatusDotVariant = "success" | "warning" | "error" | "info" | "neutral" | "custom"

const VARIANT_COLORS: Record<Exclude<StatusDotVariant, "custom">, string> = {
  success: "var(--status-success, #64FFDA)",
  warning: "var(--status-warning, #FFD740)",
  error: "var(--status-error, #FF5252)",
  info: "var(--status-info, #00B0FF)",
  neutral: "var(--status-neutral, currentColor)",
}

interface StatusDotProps {
  variant?: StatusDotVariant
  color?: string
  label?: string
  pulse?: boolean
  size?: "sm" | "md" | "lg"
  className?: string
}

const SIZE_MAP = { sm: "size-1.5", md: "size-2", lg: "size-2.5" }

export function StatusDot({
  variant = "neutral",
  color,
  label,
  pulse = false,
  size = "md",
  className,
}: StatusDotProps) {
  const dotColor =
    variant === "custom" && color
      ? color
      : VARIANT_COLORS[variant as Exclude<StatusDotVariant, "custom">]
  return (
    <span
      data-slot="status-dot"
      data-portal="https://mzizi.dev/components/status-dot"
      className={cn("inline-flex items-center gap-1.5", className)}
    >
      <span
        className={cn("shrink-0 rounded-full", SIZE_MAP[size], pulse && "animate-pulse")}
        style={{ backgroundColor: dotColor }}
      />
      {label && <span className="text-xs text-muted-foreground">{label}</span>}
    </span>
  )
}
export type { StatusDotVariant, StatusDotProps }
