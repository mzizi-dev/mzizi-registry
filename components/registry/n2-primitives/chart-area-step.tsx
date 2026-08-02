"use client"

import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const DEFAULT_DATA = [
  { month: "Jan", signups: 186 },
  { month: "Feb", signups: 305 },
  { month: "Mar", signups: 237 },
  { month: "Apr", signups: 73 },
  { month: "May", signups: 409 },
  { month: "Jun", signups: 214 },
]

const config = {
  signups: { label: "Signups", color: "var(--color-gold, #FFD740)" },
} satisfies ChartConfig

export function ChartAreaStep({ loading = false }: { loading?: boolean } = {}) {
  return (
    <Card
      role="figure"
      data-slot="chart-block"
      data-portal="https://mzizi.dev/components/chart-block"
      aria-label="Area chart"
    >
      <CardHeader>
        <CardTitle>Area Chart - Step</CardTitle>
        <CardDescription>Step interpolation</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} loading={loading}>
          <AreaChart data={DEFAULT_DATA} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              type="step"
              dataKey="signups"
              fill="var(--color-signups)"
              fillOpacity={0.4}
              stroke="var(--color-signups)"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
