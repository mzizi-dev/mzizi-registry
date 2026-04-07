"use client"

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
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
  { month: "Apr", harare: 73, nairobi: 190, lagos: 95 },
  { month: "May", harare: 209, nairobi: 130, lagos: 210 },
  { month: "Jun", harare: 214, nairobi: 140, lagos: 170 },
]

const config = {
  harare: { label: "Harare", color: "hsl(var(--chart-1))" },
  nairobi: { label: "Nairobi", color: "hsl(var(--chart-2))" },
  lagos: { label: "Lagos", color: "hsl(var(--chart-3))" },
} satisfies ChartConfig

export function ChartBarMultiple() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Bar Chart - Multiple</CardTitle>
        <CardDescription>Three city comparison</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config}>
          <BarChart data={data}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="harare" fill="var(--color-harare)" radius={4} />
            <Bar dataKey="nairobi" fill="var(--color-nairobi)" radius={4} />
            <Bar dataKey="lagos" fill="var(--color-lagos)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
