"use client"

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const DEFAULT_DATA = [
  { month: "Jan", rainfall: 45 },
  { month: "Feb", rainfall: 62 },
  { month: "Mar", rainfall: 78 },
  { month: "Apr", rainfall: 53 },
  { month: "May", rainfall: 28 },
  { month: "Jun", rainfall: 12 },
]

const config = {
  rainfall: { label: "Rainfall (mm)", color: "var(--color-tanzanite, #B388FF)" },
} satisfies ChartConfig

export function ChartAreaAxes({ loading = false }: { loading?: boolean } = {}) {
  return (
    <Card
      role="figure"
      data-slot="chart-block"
      data-portal="https://mzizi.dev/components/chart-block"
      aria-label="Area chart"
    >
      <CardHeader>
        <CardTitle>Area Chart - Axes</CardTitle>
        <CardDescription>Customized axis labels</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} loading={loading}>
          <AreaChart data={DEFAULT_DATA} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(v) => `${v}mm`}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              type="natural"
              dataKey="rainfall"
              fill="var(--color-rainfall)"
              fillOpacity={0.4}
              stroke="var(--color-rainfall)"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
