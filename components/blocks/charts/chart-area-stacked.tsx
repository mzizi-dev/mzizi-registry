"use client"

import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const data = [
  { month: "Jan", harare: 186, nairobi: 80 },
  { month: "Feb", harare: 305, nairobi: 200 },
  { month: "Mar", harare: 237, nairobi: 120 },
  { month: "Apr", harare: 173, nairobi: 190 },
  { month: "May", harare: 409, nairobi: 130 },
  { month: "Jun", harare: 214, nairobi: 140 },
]

const config = {
  harare: { label: "Harare", color: "hsl(var(--chart-1))" },
  nairobi: { label: "Nairobi", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig

export function ChartAreaStacked() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Area Chart - Stacked</CardTitle>
        <CardDescription>Showing visitors from two cities</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config}>
          <AreaChart data={data} margin={{ left: 12, right: 12 }}>
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
