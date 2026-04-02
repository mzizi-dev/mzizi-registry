"use client"

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const data = [
  { month: "Jan", visitors: 186 },
  { month: "Feb", visitors: 305 },
  { month: "Mar", visitors: 237 },
  { month: "Apr", visitors: 173 },
  { month: "May", visitors: 409 },
  { month: "Jun", visitors: 214 },
]

const config = {
  visitors: { label: "Visitors", color: "hsl(var(--chart-1))" },
} satisfies ChartConfig

export function ChartTooltipLabelCustom() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tooltip - Custom Label</CardTitle>
        <CardDescription>Custom tooltip label content</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config}>
          <BarChart data={data}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip content={<ChartTooltipContent labelClassName="text-foreground font-bold" />} />
            <Bar dataKey="visitors" fill="var(--color-visitors)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
