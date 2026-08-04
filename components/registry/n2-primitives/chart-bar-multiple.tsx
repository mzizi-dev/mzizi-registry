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
   BAR CHART — Multiple Series
   Each series auto-assigned a mineral color in order:
   cobalt → tanzanite → malachite → gold → terracotta
   ═══════════════════════════════════════════════════════════════ */

const MINERAL_COLORS = [
  "var(--color-cobalt, #00B0FF)",
  "var(--color-tanzanite, #B388FF)",
  "var(--color-malachite, #64FFDA)",
  "var(--color-gold, #FFD740)",
  "var(--color-terracotta, #D4A574)",
]

const DEFAULT_DATA = [
  { month: "Jan", harare: 186, nairobi: 80, lagos: 120 },
  { month: "Feb", harare: 305, nairobi: 200, lagos: 150 },
  { month: "Mar", harare: 237, nairobi: 120, lagos: 180 },
  { month: "Apr", harare: 73, nairobi: 190, lagos: 95 },
  { month: "May", harare: 209, nairobi: 130, lagos: 210 },
  { month: "Jun", harare: 214, nairobi: 140, lagos: 170 },
]

interface SeriesConfig {
  key: string
  label: string
  color?: string
}

interface ChartBarMultipleProps {
  data?: Record<string, string | number>[]
  title?: string
  description?: string
  xAxisKey?: string
  /** Series definitions — auto-assigned mineral colors if color not specified */
  series?: SeriesConfig[]
  loading?: boolean
  ariaLabel?: string
  className?: string
}

export function ChartBarMultiple({
  title = "Bar Chart — Multiple",
  description = "Multi-series comparison",
  xAxisKey = "month",
  series = [
    { key: "harare", label: "Harare" },
    { key: "nairobi", label: "Nairobi" },
    { key: "lagos", label: "Lagos" },
  ],
  loading = false,
  ariaLabel = "Multi-series bar chart",
  className,
}: ChartBarMultipleProps) {
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
          <BarChart data={DEFAULT_DATA}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey={xAxisKey} tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip content={<ChartTooltipContent />} />
            {series.map((s) => (
              <Bar key={s.key} dataKey={s.key} fill={`var(--color-${s.key})`} radius={4} />
            ))}
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
