"use client"

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const data = [
  { month: "Jan", harare: 186, nairobi: 80 },
  { month: "Feb", harare: 305, nairobi: 200 },
  { month: "Mar", harare: 237, nairobi: 120 },
  { month: "Apr", harare: 73, nairobi: 190 },
  { month: "May", harare: 209, nairobi: 130 },
  { month: "Jun", harare: 214, nairobi: 140 },
]

const config = {
  harare: { label: "Harare", color: "hsl(var(--chart-1))" },
  nairobi: { label: "Nairobi", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig

export function ChartBarStacked() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Bar Chart - Stacked</CardTitle>
        <CardDescription>Stacked city comparison</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config}>
          <BarChart data={data}>
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
