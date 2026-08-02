"use client"

import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const DEFAULT_DATA = [
  { month: "Jan", harare: 186, nairobi: 80 },
  { month: "Feb", harare: 305, nairobi: 200 },
  { month: "Mar", harare: 237, nairobi: 120 },
  { month: "Apr", harare: 173, nairobi: 190 },
  { month: "May", harare: 409, nairobi: 130 },
  { month: "Jun", harare: 214, nairobi: 140 },
]

const config = {
  harare: { label: "Harare", color: "var(--color-cobalt, #00B0FF)" },
  nairobi: { label: "Nairobi", color: "var(--color-tanzanite, #B388FF)" },
} satisfies ChartConfig

export function ChartAreaStacked({ loading = false }: { loading?: boolean } = {}) {
  return (
    <Card
      role="figure"
      data-slot="chart-block"
      data-portal="https://mzizi.dev/components/chart-block"
      aria-label="Area chart"
    >
      <CardHeader>
        <CardTitle>Area Chart - Stacked</CardTitle>
        <CardDescription>Showing visitors from two cities</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} loading={loading}>
          <AreaChart data={DEFAULT_DATA} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              type="natural"
              dataKey="nairobi"
              stackId="a"
              fill="var(--color-nairobi)"
              fillOpacity={0.4}
              stroke="var(--color-nairobi)"
            />
            <Area
              type="natural"
              dataKey="harare"
              stackId="a"
              fill="var(--color-harare)"
              fillOpacity={0.4}
              stroke="var(--color-harare)"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
