"use client"

import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const data = [
  { month: "Jan", signups: 186 },
  { month: "Feb", signups: 305 },
  { month: "Mar", signups: 237 },
  { month: "Apr", signups: 73 },
  { month: "May", signups: 409 },
  { month: "Jun", signups: 214 },
]

const config = {
  signups: { label: "Signups", color: "hsl(var(--chart-4))" },
} satisfies ChartConfig

export function ChartAreaStep() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Area Chart - Step</CardTitle>
        <CardDescription>Step interpolation</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config}>
          <AreaChart data={data} margin={{ left: 12, right: 12 }}>
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
