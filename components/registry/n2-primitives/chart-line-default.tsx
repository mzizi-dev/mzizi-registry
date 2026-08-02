"use client"

import * as React from "react"
import { CartesianGrid, Line, LineChart, XAxis } from "recharts"
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

interface ChartLineDefaultProps {
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

export function ChartLineDefault({
  title = "Line Chart",
  description = "Monthly data",
  xAxisKey = "month",
  dataKey = "value",
  label = "Value",
  color = "var(--color-cobalt, #00B0FF)",
  loading = false,
  ariaLabel = "Line chart",
  className,
}: ChartLineDefaultProps) {
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
          <LineChart data={DEFAULT_DATA}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey={xAxisKey} tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line
              type="natural"
              dataKey={dataKey}
              stroke={`var(--color-${dataKey})`}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
