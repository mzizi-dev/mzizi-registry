"use client"

import { CartesianGrid, LabelList, Line, LineChart, XAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const data = [
  { month: "Jan", users: 186 },
  { month: "Feb", users: 305 },
  { month: "Mar", users: 237 },
  { month: "Apr", users: 173 },
  { month: "May", users: 409 },
  { month: "Jun", users: 214 },
]

const config = {
  users: { label: "Users", color: "hsl(var(--chart-1))" },
} satisfies ChartConfig

export function ChartLineLabel() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Line Chart - Labels</CardTitle>
        <CardDescription>Line with data point labels</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config}>
          <LineChart data={data} margin={{ left: 12, right: 12, top: 20 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line type="natural" dataKey="users" stroke="var(--color-users)" strokeWidth={2} dot={{ fill: "var(--color-users)" }} activeDot={{ r: 6 }}>
              <LabelList position="top" offset={12} className="fill-foreground" fontSize={12} />
            </Line>
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
