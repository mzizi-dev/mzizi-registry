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
  { month: "Apr", harare: 173, nairobi: 190 },
  { month: "May", harare: 409, nairobi: 130 },
  { month: "Jun", harare: 214, nairobi: 140 },
]

const config = {
  harare: { label: "Harare", color: "var(--color-cobalt, #00B0FF)" },
  nairobi: { label: "Nairobi", color: "var(--color-tanzanite, #B388FF)" },
} satisfies ChartConfig

export function ChartTooltipDefault({ loading = false }: { loading?: boolean } = {}) {
  return (
    <Card
      role="figure"
      data-slot="chart-block"
      data-portal="https://mzizi.dev/components/chart-block"
      aria-label="Chart with tooltip"
    >
      <CardHeader>
        <CardTitle>Tooltip - Default</CardTitle>
        <CardDescription>Default tooltip with dot indicator</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} loading={loading}>
          <BarChart data={DEFAULT_DATA}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="harare" fill="var(--color-harare)" radius={4} />
            <Bar dataKey="nairobi" fill="var(--color-nairobi)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
