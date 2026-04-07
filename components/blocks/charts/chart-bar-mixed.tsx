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
  { sector: "Farming", output: 275, fill: "var(--color-farming)" },
  { sector: "Mining", output: 200, fill: "var(--color-mining)" },
  { sector: "Tourism", output: 187, fill: "var(--color-tourism)" },
  { sector: "Tech", output: 173, fill: "var(--color-tech)" },
  { sector: "Trade", output: 90, fill: "var(--color-trade)" },
]

const config = {
  output: { label: "Output" },
  farming: { label: "Farming", color: "hsl(var(--chart-1))" },
  mining: { label: "Mining", color: "hsl(var(--chart-2))" },
  tourism: { label: "Tourism", color: "hsl(var(--chart-3))" },
  tech: { label: "Tech", color: "hsl(var(--chart-4))" },
  trade: { label: "Trade", color: "hsl(var(--chart-5))" },
} satisfies ChartConfig

export function ChartBarMixed() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Bar Chart - Mixed</CardTitle>
        <CardDescription>Different colors per bar</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config}>
          <BarChart data={data}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="sector" tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="output" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
