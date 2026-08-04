"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const DEFAULT_DATA = [
  { month: "Jan", value: 186 },
  { month: "Feb", value: 305 },
  { month: "Mar", value: 237 },
  { month: "Apr", value: 173 },
  { month: "May", value: 409 },
  { month: "Jun", value: 214 },
]

interface ChartAreaDefaultProps {
  data?: Record<string, string | number>[]
  title?: string
  description?: string
  xAxisKey?: string
  dataKey?: string
  label?: string
  color?: string
  loading?: boolean
  ariaLabel?: string
  className?: string
}

export function ChartAreaDefault({
  title = "Area Chart",
  description = "Monthly data",
  xAxisKey = "month",
  dataKey = "value",
  label = "Value",
  color = "var(--color-cobalt, #00B0FF)",
  loading = false,
  ariaLabel = "Area chart",
  className,
}: ChartAreaDefaultProps) {
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
          <AreaChart data={DEFAULT_DATA}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey={xAxisKey} tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <defs>
              <linearGradient id={`fill-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={`var(--color-${dataKey})`} stopOpacity={0.8} />
                <stop offset="95%" stopColor={`var(--color-${dataKey})`} stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <Area
              type="natural"
              dataKey={dataKey}
              stroke={`var(--color-${dataKey})`}
              fill={`url(#fill-${dataKey})`}
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
