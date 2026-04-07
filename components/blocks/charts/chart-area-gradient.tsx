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
  { month: "Jan", temperature: 28 },
  { month: "Feb", temperature: 30 },
  { month: "Mar", temperature: 27 },
  { month: "Apr", temperature: 24 },
  { month: "May", temperature: 20 },
  { month: "Jun", temperature: 18 },
]

const config = {
  temperature: { label: "Temperature", color: "hsl(var(--chart-1))" },
} satisfies ChartConfig

export function ChartAreaGradient() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Area Chart - Gradient</CardTitle>
        <CardDescription>Area with gradient fill</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config}>
          <AreaChart data={data} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <defs>
              <linearGradient id="fillTemp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-temperature)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-temperature)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <Area
              type="natural"
              dataKey="temperature"
              fill="url(#fillTemp)"
              stroke="var(--color-temperature)"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
