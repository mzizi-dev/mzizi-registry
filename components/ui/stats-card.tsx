import * as React from "react"
import { cn } from "@/lib/utils"
import { TrendingDown, TrendingUp, Minus } from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface StatsCardProps {
  /** Metric label (e.g., "Total Revenue") */
  title: string
  /** Current value (e.g., "$45,231.89") */
  value: string | number
  /** Description text (e.g., "+20.1% from last month") */
  description?: string
  /** Trend direction — renders an arrow icon */
  trend?: "up" | "down" | "neutral"
  /** Trend percentage (e.g., 20.1) */
  trendValue?: number
  /** Icon rendered in the top-right corner */
  icon?: React.ComponentType<{ className?: string }>
  className?: string
}

function StatsCard({
  title,
  value,
  description,
  trend,
  trendValue,
  icon: Icon,
  className,
}: StatsCardProps) {
  return (
    <Card data-slot="stats-card" className={cn(className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon && <Icon className="size-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {(description || trend) && (
          <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            {trend && (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5",
                  trend === "up" && "text-[var(--color-malachite)]",
                  trend === "down" && "text-destructive"
                )}
              >
                {trend === "up" && <TrendingUp className="size-3" />}
                {trend === "down" && <TrendingDown className="size-3" />}
                {trend === "neutral" && <Minus className="size-3" />}
                {trendValue !== undefined && (
                  <span>
                    {trend === "up" ? "+" : trend === "down" ? "-" : ""}
                    {Math.abs(trendValue)}%
                  </span>
                )}
              </span>
            )}
            {description && <span>{description}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export { StatsCard }
export type { StatsCardProps }
