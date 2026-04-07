"use client"

import { CartesianGrid, Line, LineChart, XAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const data = [
  { month: "Jan", harare: 186, nairobi: 130 },
  { month: "Feb", harare: 305, nairobi: 240 },
  { month: "Mar", harare: 237, nairobi: 180 },
  { month: "Apr", harare: 173, nairobi: 220 },
  { month: "May", harare: 409, nairobi: 310 },
  { month: "Jun", harare: 214, nairobi: 170 },
]

const config = {
  harare: { label: "Harare", color: "hsl(var(--chart-1))" },
  nairobi: { label: "Nairobi", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig

export function ChartTooltipIndicatorLine() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tooltip - Line Indicator</CardTitle>
        <CardDescription>Tooltip with line-style indicator</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config}>
          <LineChart data={data} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
            <Line
              type="natural"
              dataKey="harare"
              stroke="var(--color-harare)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="natural"
              dataKey="nairobi"
              stroke="var(--color-nairobi)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
