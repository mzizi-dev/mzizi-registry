"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

/* ═══════════════════════════════════════════════════════════════
   BAR CHART — Default
   Layer 2 Primitive Block
   
   ✅ TOKENS — Five African Minerals chart colors
   ✅ ARIA — role="figure", aria-label
   ✅ LOADING — via ChartContainer loading prop
   ✅ I18N — accepts pre-formatted labels
   ═══════════════════════════════════════════════════════════════ */

const DEFAULT_DATA = [
  { month: "Jan", value: 186 },
  { month: "Feb", value: 305 },
  { month: "Mar", value: 237 },
  { month: "Apr", value: 173 },
  { month: "May", value: 409 },
  { month: "Jun", value: 214 },
]

interface ChartBarDefaultProps {
  /** Chart data — array of objects with label + value keys */
  data?: Record<string, string | number>[]
  /** Title shown above the chart */
  title?: string
  /** Description shown below title */
  description?: string
  /** Key in data objects for X axis labels */
  xAxisKey?: string
  /** Key in data objects for bar values */
  dataKey?: string
  /** Series label shown in tooltip */
  label?: string
  /** Bar color — defaults to cobalt mineral */
  color?: string
  /** Loading state — shows skeleton */
  loading?: boolean
  /** Accessible description */
  ariaLabel?: string
  className?: string
}

export function ChartBarDefault({
  title = "Bar Chart",
  description = "Monthly data",
  xAxisKey = "month",
  dataKey = "value",
  label = "Value",
  color = "var(--color-cobalt, #00B0FF)",
  loading = false,
  ariaLabel = "Bar chart",
  className,
}: ChartBarDefaultProps) {
  const config = React.useMemo(
    () =>
      ({
        [dataKey]: { label, color },
      }) satisfies ChartConfig,
    [dataKey, label, color]
  )

  return (
    <Card
      role="figure"
      data-slot="chart-block"
      data-portal="https://mzizi.dev/components/chart-block"
      aria-label={ariaLabel}
      className={className}
    >
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} loading={loading}>
          <BarChart data={DEFAULT_DATA}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey={xAxisKey} tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey={dataKey} fill={`var(--color-${dataKey})`} radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
