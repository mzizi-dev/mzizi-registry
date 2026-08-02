"use client"

import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, XAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const DEFAULT_DATA = [
  { month: "Jan", growth: 12 },
  { month: "Feb", growth: -8 },
  { month: "Mar", growth: 15 },
  { month: "Apr", growth: -3 },
  { month: "May", growth: 22 },
  { month: "Jun", growth: -5 },
]

const config = {
  growth: { label: "Growth %", color: "var(--color-cobalt, #00B0FF)" },
} satisfies ChartConfig

export function ChartBarNegative({ loading = false }: { loading?: boolean } = {}) {
  return (
    <Card
      role="figure"
      data-slot="chart-block"
      data-portal="https://mzizi.dev/components/chart-block"
      aria-label="Bar chart"
    >
      <CardHeader>
        <CardTitle>Bar Chart - Negative</CardTitle>
        <CardDescription>Showing positive and negative values</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} loading={loading}>
          <BarChart data={DEFAULT_DATA}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
            <Bar dataKey="growth" radius={4}>
              {DEFAULT_DATA.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    entry.growth >= 0
                      ? "var(--color-malachite, #64FFDA)"
                      : "var(--color-cobalt, #00B0FF)"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
