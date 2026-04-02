"use client"

import { Bar, BarChart, CartesianGrid, XAxis, Cell } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const data = [
  { month: "Jan", revenue: 186 },
  { month: "Feb", revenue: 305 },
  { month: "Mar", revenue: 237 },
  { month: "Apr", revenue: 173 },
  { month: "May", revenue: 409 },
  { month: "Jun", revenue: 214 },
]

const config = {
  revenue: { label: "Revenue", color: "hsl(var(--chart-1))" },
} satisfies ChartConfig

export function ChartBarActive() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Bar Chart - Active</CardTitle>
        <CardDescription>Highlights the highest bar</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config}>
          <BarChart data={data}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="revenue" radius={4}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.revenue === Math.max(...data.map(d => d.revenue)) ? "var(--color-revenue)" : "var(--color-revenue)"} fillOpacity={entry.revenue === Math.max(...data.map(d => d.revenue)) ? 1 : 0.4} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
