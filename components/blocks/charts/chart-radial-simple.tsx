"use client"

import { RadialBar, RadialBarChart } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const data = [
  { name: "Harare", visitors: 1260, fill: "var(--color-harare)" },
  { name: "Nairobi", visitors: 970, fill: "var(--color-nairobi)" },
  { name: "Lagos", visitors: 1480, fill: "var(--color-lagos)" },
]

const config = {
  visitors: { label: "Visitors" },
  harare: { label: "Harare", color: "hsl(var(--chart-1))" },
  nairobi: { label: "Nairobi", color: "hsl(var(--chart-2))" },
  lagos: { label: "Lagos", color: "hsl(var(--chart-3))" },
} satisfies ChartConfig

export function ChartRadialSimple() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Radial Chart</CardTitle>
        <CardDescription>City visitor comparison</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="mx-auto aspect-square max-h-[250px]">
          <RadialBarChart data={data} innerRadius={30} outerRadius={100}>
            <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
            <RadialBar dataKey="visitors" background />
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
