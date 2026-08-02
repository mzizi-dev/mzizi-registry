"use client"

import { Sprout, Pickaxe } from "@/lib/icons"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
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

export function ChartTooltipIcons({ loading = false }: { loading?: boolean } = {}) {
  return (
    <Card
      role="figure"
      data-slot="chart-block"
      data-portal="https://mzizi.dev/components/chart-block"
      aria-label="Chart with tooltip"
    >
      <CardHeader>
        <CardTitle>Tooltip - Icons</CardTitle>
        <CardDescription>Tooltip with category icons</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} loading={loading}>
          <BarChart data={DEFAULT_DATA}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="farming" fill="var(--color-farming)" radius={4} />
            <Bar dataKey="mining" fill="var(--color-mining)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
