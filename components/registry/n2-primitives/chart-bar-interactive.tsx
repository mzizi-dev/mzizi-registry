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

const MINERAL_COLORS = [
  "var(--color-cobalt, #00B0FF)",
  "var(--color-tanzanite, #B388FF)",
  "var(--color-malachite, #64FFDA)",
  "var(--color-gold, #FFD740)",
  "var(--color-terracotta, #D4A574)",
]

const DEFAULT_DATA = [
  { date: "2024-04-01", downloads: 222, installs: 150 },
  { date: "2024-04-02", downloads: 97, installs: 180 },
  { date: "2024-04-03", downloads: 167, installs: 120 },
  { date: "2024-04-04", downloads: 242, installs: 260 },
  { date: "2024-04-05", downloads: 373, installs: 290 },
  { date: "2024-04-06", downloads: 301, installs: 340 },
  { date: "2024-04-07", downloads: 245, installs: 180 },
  { date: "2024-04-08", downloads: 409, installs: 320 },
  { date: "2024-04-09", downloads: 59, installs: 110 },
  { date: "2024-04-10", downloads: 261, installs: 190 },
]

interface SeriesConfig {
  key: string
  label: string
  color?: string
}

interface ChartBarInteractiveProps {
  data?: Record<string, string | number>[]
  title?: string
  description?: string
  xAxisKey?: string
  series?: SeriesConfig[]
  /** Default active series key */
  defaultActive?: string
  loading?: boolean
  ariaLabel?: string
  className?: string
}

export function ChartBarInteractive({
  data = DEFAULT_DATA,
  title = "Bar Chart — Interactive",
  description = "Toggle between series",
  xAxisKey = "date",
  series = [
    { key: "downloads", label: "Downloads" },
    { key: "installs", label: "Installs" },
  ],
  defaultActive,
  loading = false,
  ariaLabel = "Interactive bar chart",
  className,
}: ChartBarInteractiveProps) {
  const [activeKey, setActiveKey] = React.useState(defaultActive || series[0]?.key)

  const config = React.useMemo(() => {
    const cfg: ChartConfig = {}
    series.forEach((s, i) => {
      cfg[s.key] = { label: s.label, color: s.color || MINERAL_COLORS[i % MINERAL_COLORS.length] }
    })
    return cfg
  }, [series])

  const total = React.useMemo(() => {
    const totals: Record<string, number> = {}
    series.forEach((s) => {
      totals[s.key] = data.reduce((sum, d) => sum + (Number(d[s.key]) || 0), 0)
    })
    return totals
  }, [data, series])

  return (
    <Card
      role="figure"
      data-slot="chart-block"
      data-portal="https://mzizi.dev/components/chart-block"
      aria-label={ariaLabel}
      className={className}
    >
      <CardHeader className="flex flex-col items-stretch border-b border-border p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <div className="flex">
          {series.map((s) => (
            <button
              key={s.key}
              onClick={() => setActiveKey(s.key)}
              className={`relative flex flex-1 flex-col justify-center gap-1 border-t border-border px-6 py-4 text-left transition-colors sm:border-t-0 sm:border-l sm:px-8 sm:py-6 ${activeKey === s.key ? "bg-muted/50" : ""}`}
              aria-pressed={activeKey === s.key}
              aria-label={`Show ${s.label}`}
            >
              <span className="text-xs text-muted-foreground">{s.label}</span>
              <span className="text-lg leading-none font-bold sm:text-3xl">
                {total[s.key]?.toLocaleString()}
              </span>
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <ChartContainer config={config} loading={loading} className="aspect-auto h-[250px] w-full">
          <BarChart data={DEFAULT_DATA}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey={xAxisKey}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(v) => {
                try {
                  return new Date(v).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })
                } catch {
                  return v
                }
              }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[150px]"
                  nameKey={activeKey}
                  labelFormatter={(v) => {
                    try {
                      return new Date(String(v)).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    } catch {
                      return v
                    }
                  }}
                />
              }
            />
            <Bar dataKey={activeKey} fill={`var(--color-${activeKey})`} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
