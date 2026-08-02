"use client"

import { Sprout, Pickaxe } from "@/lib/icons"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"

const DEFAULT_DATA = [
  { month: "Jan", farming: 186, mining: 80 },
  { month: "Feb", farming: 305, mining: 200 },
  { month: "Mar", farming: 237, mining: 120 },
  { month: "Apr", farming: 173, mining: 190 },
  { month: "May", farming: 409, mining: 130 },
  { month: "Jun", farming: 214, mining: 140 },
]

const config = {
  farming: { label: "Farming", color: "var(--color-malachite, #64FFDA)", icon: Sprout },
  mining: { label: "Mining", color: "var(--color-terracotta, #D4A574)", icon: Pickaxe },
} satisfies ChartConfig

export function ChartAreaIcons({ loading = false }: { loading?: boolean } = {}) {
  return (
    <Card
      role="figure"
      data-slot="chart-block"
      data-portal="https://mzizi.dev/components/chart-block"
      aria-label="Area chart"
    >
      <CardHeader>
        <CardTitle>Area Chart - Icons</CardTitle>
        <CardDescription>Legend with category icons</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} loading={loading}>
          <AreaChart data={DEFAULT_DATA} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Area
              type="natural"
              dataKey="farming"
              fill="var(--color-farming)"
              fillOpacity={0.4}
              stroke="var(--color-farming)"
              stackId="a"
            />
            <Area
              type="natural"
              dataKey="mining"
              fill="var(--color-mining)"
              fillOpacity={0.4}
              stroke="var(--color-mining)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
