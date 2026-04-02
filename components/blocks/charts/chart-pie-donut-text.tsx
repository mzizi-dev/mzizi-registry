"use client"

import * as React from "react"
import { Pie, PieChart, Label } from "recharts"
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

export function ChartPieDonutText() {
  const total = React.useMemo(() => data.reduce((acc, curr) => acc + curr.value, 0), [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Donut - Center Text</CardTitle>
        <CardDescription>Total value in center</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="mx-auto aspect-square max-h-[250px]">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent nameKey="sector" hideLabel />} />
            <Pie data={data} dataKey="value" nameKey="sector" innerRadius={60} strokeWidth={5}>
              <Label content={({ viewBox }) => {
                if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                  return (
                    <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                      <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-3xl font-bold">{total.toLocaleString()}</tspan>
                      <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 24} className="fill-muted-foreground">Total Output</tspan>
                    </text>
                  )
                }
              }} />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
