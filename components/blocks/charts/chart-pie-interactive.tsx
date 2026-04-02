"use client"

import * as React from "react"
import { Pie, PieChart, Sector } from "recharts"
import type { PieSectorDataItem } from "recharts/types/polar/Pie"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const data = [
  { sector: "farming", value: 275, fill: "var(--color-farming)" },
  { sector: "mining", value: 200, fill: "var(--color-mining)" },
  { sector: "tourism", value: 187, fill: "var(--color-tourism)" },
  { sector: "tech", value: 173, fill: "var(--color-tech)" },
  { sector: "trade", value: 90, fill: "var(--color-trade)" },
]

const config = {
  value: { label: "Output" },
  farming: { label: "Farming", color: "hsl(var(--chart-1))" },
  mining: { label: "Mining", color: "hsl(var(--chart-2))" },
  tourism: { label: "Tourism", color: "hsl(var(--chart-3))" },
  tech: { label: "Tech", color: "hsl(var(--chart-4))" },
  trade: { label: "Trade", color: "hsl(var(--chart-5))" },
} satisfies ChartConfig

export function ChartPieInteractive() {
  const [activeIndex, setActiveIndex] = React.useState(0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pie Chart - Interactive</CardTitle>
        <CardDescription>Click segments to expand</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="mx-auto aspect-square max-h-[250px]">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent nameKey="sector" hideLabel />} />
            <Pie data={data} dataKey="value" nameKey="sector" innerRadius={60} activeIndex={activeIndex} activeShape={({ outerRadius = 0, ...props }: PieSectorDataItem) => (<Sector {...props} outerRadius={outerRadius + 10} />)} onMouseEnter={(_, index) => setActiveIndex(index)} />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
