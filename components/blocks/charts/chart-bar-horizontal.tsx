"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const data = [
  { city: "Harare", visitors: 275 },
  { city: "Nairobi", visitors: 200 },
  { city: "Lagos", visitors: 187 },
  { city: "Accra", visitors: 173 },
  { city: "Kigali", visitors: 90 },
]

const config = {
  visitors: { label: "Visitors", color: "hsl(var(--chart-1))" },
} satisfies ChartConfig

export function ChartBarHorizontal() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Bar Chart - Horizontal</CardTitle>
        <CardDescription>Horizontal orientation</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config}>
          <BarChart data={data} layout="vertical" margin={{ left: 0 }}>
            <CartesianGrid horizontal={false} />
            <YAxis dataKey="city" type="category" tickLine={false} axisLine={false} tickMargin={8} width={60} />
            <XAxis type="number" hide />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="visitors" fill="var(--color-visitors)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
