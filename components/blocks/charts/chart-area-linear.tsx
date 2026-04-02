"use client"

import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
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
  revenue: { label: "Revenue", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig

export function ChartAreaLinear() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Area Chart - Linear</CardTitle>
        <CardDescription>Linear interpolation</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config}>
          <AreaChart data={data} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area type="linear" dataKey="revenue" fill="var(--color-revenue)" fillOpacity={0.4} stroke="var(--color-revenue)" />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
