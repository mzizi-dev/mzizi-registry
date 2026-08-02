"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const DEFAULT_DATA = [
  { city: "Harare", visitors: 275 },
  { city: "Nairobi", visitors: 200 },
  { city: "Lagos", visitors: 187 },
  { city: "Accra", visitors: 173 },
  { city: "Kigali", visitors: 90 },
]

const config = {
  visitors: { label: "Visitors", color: "var(--color-cobalt, #00B0FF)" },
} satisfies ChartConfig

export function ChartBarHorizontal({ loading = false }: { loading?: boolean } = {}) {
  return (
    <Card
      role="figure"
      data-slot="chart-block"
      data-portal="https://mzizi.dev/components/chart-block"
      aria-label="Bar chart"
    >
      <CardHeader>
        <CardTitle>Bar Chart - Horizontal</CardTitle>
        <CardDescription>Horizontal orientation</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} loading={loading}>
          <BarChart data={DEFAULT_DATA} layout="vertical" margin={{ left: 0 }}>
            <CartesianGrid horizontal={false} />
            <YAxis
              dataKey="city"
              type="category"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={60}
            />
            <XAxis type="number" hide />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="visitors" fill="var(--color-visitors)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
