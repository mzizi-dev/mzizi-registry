"use client"

import { CartesianGrid, Line, LineChart, XAxis } from "recharts"
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

export function ChartLineStep({ loading = false }: { loading?: boolean } = {}) {
  return (
    <Card
      role="figure"
      data-slot="chart-block"
      data-portal="https://mzizi.dev/components/chart-block"
      aria-label="Line chart"
    >
      <CardHeader>
        <CardTitle>Line Chart - Step</CardTitle>
        <CardDescription>Step interpolation</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} loading={loading}>
          <LineChart data={DEFAULT_DATA} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line
              type="step"
              dataKey="signups"
              stroke="var(--color-signups)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
