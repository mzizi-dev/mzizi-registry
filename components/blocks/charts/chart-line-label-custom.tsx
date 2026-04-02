"use client"

import { CartesianGrid, LabelList, Line, LineChart, XAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const data = [
  { month: "Jan", temperature: 28, city: "Harare" },
  { month: "Feb", temperature: 30, city: "Harare" },
  { month: "Mar", temperature: 27, city: "Harare" },
  { month: "Apr", temperature: 24, city: "Harare" },
  { month: "May", temperature: 20, city: "Harare" },
  { month: "Jun", temperature: 18, city: "Harare" },
]

const config = {
  temperature: { label: "Temperature", color: "hsl(var(--chart-3))" },
} satisfies ChartConfig

export function ChartLineLabelCustom() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Line Chart - Custom Labels</CardTitle>
        <CardDescription>Labels with custom formatting</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config}>
          <LineChart data={data} margin={{ left: 12, right: 12, top: 24 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line type="natural" dataKey="temperature" stroke="var(--color-temperature)" strokeWidth={2} dot={{ fill: "var(--color-temperature)" }} activeDot={{ r: 6 }}>
              <LabelList position="top" offset={12} className="fill-foreground" fontSize={11} formatter={(value) => `${value}\u00B0C`} />
            </Line>
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
