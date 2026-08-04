"use client"

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const DEFAULT_DATA = [
  { sector: "Farming", output: 275, fill: "var(--color-farming)" },
  { sector: "Mining", output: 200, fill: "var(--color-mining)" },
  { sector: "Tourism", output: 187, fill: "var(--color-tourism)" },
  { sector: "Tech", output: 173, fill: "var(--color-tech)" },
  { sector: "Trade", output: 90, fill: "var(--color-trade)" },
]

const config = {
  output: { label: "Output" },
  farming: { label: "Farming", color: "var(--color-cobalt, #00B0FF)" },
  mining: { label: "Mining", color: "var(--color-tanzanite, #B388FF)" },
  tourism: { label: "Tourism", color: "var(--color-malachite, #64FFDA)" },
  tech: { label: "Tech", color: "var(--color-gold, #FFD740)" },
  trade: { label: "Trade", color: "var(--color-terracotta, #D4A574)" },
} satisfies ChartConfig

export function ChartBarMixed({ loading = false }: { loading?: boolean } = {}) {
  return (
    <Card
      role="figure"
      data-slot="chart-block"
      data-portal="https://mzizi.dev/components/chart-block"
      aria-label="Bar chart"
    >
      <CardHeader>
        <CardTitle>Bar Chart - Mixed</CardTitle>
        <CardDescription>Different colors per bar</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} loading={loading}>
          <BarChart data={DEFAULT_DATA}>
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
