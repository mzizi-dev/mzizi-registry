"use client"

import { Pie, PieChart } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const outerData = [
  { sector: "farming", value: 275, fill: "var(--color-farming)" },
  { sector: "mining", value: 200, fill: "var(--color-mining)" },
  { sector: "tourism", value: 187, fill: "var(--color-tourism)" },
]

const innerData = [
  { region: "east", value: 340, fill: "var(--color-east)" },
  { region: "west", value: 200, fill: "var(--color-west)" },
  { region: "south", value: 122, fill: "var(--color-south)" },
]

const config = {
  value: { label: "Output" },
  farming: { label: "Farming", color: "hsl(var(--chart-1))" },
  mining: { label: "Mining", color: "hsl(var(--chart-2))" },
  tourism: { label: "Tourism", color: "hsl(var(--chart-3))" },
  east: { label: "East Africa", color: "hsl(var(--chart-4))" },
  west: { label: "West Africa", color: "hsl(var(--chart-5))" },
  south: { label: "Southern Africa", color: "hsl(var(--chart-1))" },
} satisfies ChartConfig

export function ChartPieStacked() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pie Chart - Stacked</CardTitle>
        <CardDescription>Nested pie with inner/outer rings</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="mx-auto aspect-square max-h-[250px]">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Pie
              data={innerData}
              dataKey="value"
              nameKey="region"
              innerRadius={0}
              outerRadius={60}
            />
            <Pie
              data={outerData}
              dataKey="value"
              nameKey="sector"
              innerRadius={70}
              outerRadius={90}
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
