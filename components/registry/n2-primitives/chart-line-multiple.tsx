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

const MINERAL_COLORS = [
  "var(--color-cobalt, #00B0FF)",
  "var(--color-tanzanite, #B388FF)",
  "var(--color-malachite, #64FFDA)",
  "var(--color-gold, #FFD740)",
  "var(--color-terracotta, #D4A574)",
]

const DEFAULT_DATA = [
  { month: "Jan", harare: 186, lagos: 305 },
  { month: "Feb", harare: 305, lagos: 200 },
  { month: "Mar", harare: 237, lagos: 120 },
  { month: "Apr", harare: 73, lagos: 190 },
  { month: "May", harare: 209, lagos: 130 },
  { month: "Jun", harare: 214, lagos: 140 },
]

interface SeriesConfig {
  key: string
  label: string
  color?: string
}

interface ChartLineMultipleProps {
  data?: Record<string, string | number>[]
  title?: string
  description?: string
  xAxisKey?: string
  series?: SeriesConfig[]
  loading?: boolean
  ariaLabel?: string
  className?: string
}

export function ChartLineMultiple({
  title = "Line Chart — Multiple",
  description = "Multi-series comparison",
  xAxisKey = "month",
  series = [
    { key: "harare", label: "Harare" },
    { key: "lagos", label: "Lagos" },
  ],
  loading = false,
  ariaLabel = "Multi-series line chart",
  className,
}: ChartLineMultipleProps) {
  const config = React.useMemo(() => {
    const cfg: ChartConfig = {}
    series.forEach((s, i) => {
      cfg[s.key] = { label: s.label, color: s.color || MINERAL_COLORS[i % MINERAL_COLORS.length] }
    })
    return cfg
  }, [series])

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
            {series.map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                stroke={`var(--color-${s.key})`}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
