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
  { month: "Jan", users: 186 },
  { month: "Feb", users: 305 },
  { month: "Mar", users: 237 },
  { month: "Apr", users: 173 },
  { month: "May", users: 409 },
  { month: "Jun", users: 214 },
]

const config = {
  users: { label: "Users", color: "var(--color-tanzanite, #B388FF)" },
} satisfies ChartConfig

function CustomDot(props: Record<string, unknown>) {
  const { cx, cy } = props as { cx: number; cy: number }
  return (
    <svg
      x={(cx || 0) - 6}
      y={(cy || 0) - 6}
      width={12}
      height={12}
      fill="var(--color-users)"
      viewBox="0 0 12 12"
    >
      <rect width="10" height="10" x="1" y="1" rx="2" />
    </svg>
  )
}

export function ChartLineDotsCustom({ loading = false }: { loading?: boolean } = {}) {
  return (
    <Card
      role="figure"
      data-slot="chart-block"
      data-portal="https://mzizi.dev/components/chart-block"
      aria-label="Line chart"
    >
      <CardHeader>
        <CardTitle>Line Chart - Custom Dots</CardTitle>
        <CardDescription>Square dot markers</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} loading={loading}>
          <LineChart data={DEFAULT_DATA} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line
              type="natural"
              dataKey="users"
              stroke="var(--color-users)"
              strokeWidth={2}
              dot={<CustomDot />}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
