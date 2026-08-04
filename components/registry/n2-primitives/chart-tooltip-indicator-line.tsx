"use client"

import { CartesianGrid, Line, LineChart, XAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const DEFAULT_DATA = [
  { month: "Jan", harare: 186, nairobi: 130 },
  { month: "Feb", harare: 305, nairobi: 240 },
  { month: "Mar", harare: 237, nairobi: 180 },
  { month: "Apr", harare: 173, nairobi: 220 },
  { month: "May", harare: 409, nairobi: 310 },
  { month: "Jun", harare: 214, nairobi: 170 },
]

const config = {
  harare: { label: "Harare", color: "var(--color-cobalt, #00B0FF)" },
  nairobi: { label: "Nairobi", color: "var(--color-tanzanite, #B388FF)" },
} satisfies ChartConfig

export function ChartTooltipIndicatorLine({ loading = false }: { loading?: boolean } = {}) {
  return (
    <Card
      role="figure"
      data-slot="chart-block"
      data-portal="https://mzizi.dev/components/chart-block"
      aria-label="Chart with tooltip"
    >
      <CardHeader>
        <CardTitle>Tooltip - Line Indicator</CardTitle>
        <CardDescription>Tooltip with line-style indicator</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} loading={loading}>
          <LineChart data={DEFAULT_DATA} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
            <Line
              type="natural"
              dataKey="harare"
              stroke="var(--color-harare)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="natural"
              dataKey="nairobi"
              stroke="var(--color-nairobi)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
