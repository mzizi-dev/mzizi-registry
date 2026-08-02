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
  { date: "2024-01-01", harare: 222, lagos: 150 },
  { date: "2024-01-15", harare: 97, lagos: 180 },
  { date: "2024-02-01", harare: 167, lagos: 120 },
  { date: "2024-02-15", harare: 242, lagos: 260 },
  { date: "2024-03-01", harare: 373, lagos: 290 },
  { date: "2024-03-15", harare: 301, lagos: 340 },
  { date: "2024-04-01", harare: 245, lagos: 180 },
  { date: "2024-04-15", harare: 409, lagos: 320 },
  { date: "2024-05-01", harare: 259, lagos: 110 },
  { date: "2024-05-15", harare: 354, lagos: 190 },
]

const config = {
  harare: { label: "Harare", color: "var(--color-cobalt, #00B0FF)" },
  lagos: { label: "Lagos", color: "var(--color-tanzanite, #B388FF)" },
} satisfies ChartConfig

export function ChartLineInteractive({ loading = false }: { loading?: boolean } = {}) {
  const [activeCity, setActiveCity] = React.useState<"harare" | "lagos">("harare")

  return (
    <Card
      role="figure"
      data-slot="chart-block"
      data-portal="https://mzizi.dev/components/chart-block"
      aria-label="Interactive line chart"
    >
      <CardHeader>
        <CardTitle>Line Chart - Interactive</CardTitle>
        <CardDescription>
          <span className="flex gap-2">
            {(["harare", "lagos"] as const).map((city) => (
              <button
                key={city}
                onClick={() => setActiveCity(city)}
                className={`rounded-[var(--radius-md,12px)] px-2 py-1 text-xs ${activeCity === city ? "bg-muted font-medium" : ""}`}
              >
                {config[city].label}
              </button>
            ))}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} loading={loading}>
          <LineChart data={DEFAULT_DATA} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(v) =>
                new Date(v).toLocaleDateString("en", { month: "short", day: "numeric" })
              }
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line
              type="natural"
              dataKey={activeCity}
              stroke={`var(--color-${activeCity})`}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
