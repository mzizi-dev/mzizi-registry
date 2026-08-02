"use client"

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
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
  { month: "Apr", harare: 73, nairobi: 190 },
  { month: "May", harare: 209, nairobi: 130 },
  { month: "Jun", harare: 214, nairobi: 140 },
]

const config = {
  harare: { label: "Harare", color: "var(--color-cobalt, #00B0FF)" },
  nairobi: { label: "Nairobi", color: "var(--color-tanzanite, #B388FF)" },
} satisfies ChartConfig

export function ChartBarStacked({ loading = false }: { loading?: boolean } = {}) {
  return (
    <Card
      role="figure"
      data-slot="chart-block"
      data-portal="https://mzizi.dev/components/chart-block"
      aria-label="Bar chart"
    >
      <CardHeader>
        <CardTitle>Bar Chart - Stacked</CardTitle>
        <CardDescription>Stacked city comparison</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} loading={loading}>
          <BarChart data={DEFAULT_DATA}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="harare" stackId="a" fill="var(--color-harare)" radius={[0, 0, 4, 4]} />
            <Bar dataKey="nairobi" stackId="a" fill="var(--color-nairobi)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
