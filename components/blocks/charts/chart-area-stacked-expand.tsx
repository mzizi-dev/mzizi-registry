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
  { month: "Jan", harare: 186, nairobi: 80, lagos: 120 },
  { month: "Feb", harare: 305, nairobi: 200, lagos: 150 },
  { month: "Mar", harare: 237, nairobi: 120, lagos: 180 },
  { month: "Apr", harare: 173, nairobi: 190, lagos: 95 },
  { month: "May", harare: 409, nairobi: 130, lagos: 210 },
  { month: "Jun", harare: 214, nairobi: 140, lagos: 170 },
]

const config = {
  harare: { label: "Harare", color: "hsl(var(--chart-1))" },
  nairobi: { label: "Nairobi", color: "hsl(var(--chart-2))" },
  lagos: { label: "Lagos", color: "hsl(var(--chart-3))" },
} satisfies ChartConfig

export function ChartAreaStackedExpand() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Area Chart - Expanded</CardTitle>
        <CardDescription>100% stacked area showing proportions</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config}>
          <AreaChart data={data} stackOffset="expand" margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              type="natural"
              dataKey="harare"
              stackId="a"
              fill="var(--color-harare)"
              fillOpacity={0.4}
              stroke="var(--color-harare)"
            />
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
              dataKey="lagos"
              stackId="a"
              fill="var(--color-lagos)"
              fillOpacity={0.4}
              stroke="var(--color-lagos)"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
