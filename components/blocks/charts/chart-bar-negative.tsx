"use client"

import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, XAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const data = [
  { month: "Jan", growth: 12 },
  { month: "Feb", growth: -8 },
  { month: "Mar", growth: 15 },
  { month: "Apr", growth: -3 },
  { month: "May", growth: 22 },
  { month: "Jun", growth: -5 },
]

const config = {
  growth: { label: "Growth %", color: "hsl(var(--chart-1))" },
} satisfies ChartConfig

export function ChartBarNegative() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Bar Chart - Negative</CardTitle>
        <CardDescription>Showing positive and negative values</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config}>
          <BarChart data={data}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
            <Bar dataKey="growth" radius={4}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.growth >= 0 ? "hsl(var(--chart-3))" : "hsl(var(--chart-1))"} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
