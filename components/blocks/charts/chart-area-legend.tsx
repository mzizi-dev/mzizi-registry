"use client"

import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart"

const data = [
  { month: "Jan", farming: 186, mining: 80 },
  { month: "Feb", farming: 305, mining: 200 },
  { month: "Mar", farming: 237, mining: 120 },
  { month: "Apr", farming: 173, mining: 190 },
  { month: "May", farming: 409, mining: 130 },
  { month: "Jun", farming: 214, mining: 140 },
]

const config = {
  farming: { label: "Farming", color: "hsl(var(--chart-3))" },
  mining: { label: "Mining", color: "hsl(var(--chart-5))" },
} satisfies ChartConfig

export function ChartAreaLegend() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Area Chart - Legend</CardTitle>
        <CardDescription>Activity sectors over 6 months</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config}>
          <AreaChart data={data} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Area type="natural" dataKey="farming" fill="var(--color-farming)" fillOpacity={0.4} stroke="var(--color-farming)" />
            <Area type="natural" dataKey="mining" fill="var(--color-mining)" fillOpacity={0.4} stroke="var(--color-mining)" />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
