"use client"

import { Bar, BarChart, CartesianGrid, LabelList, XAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const data = [
  { city: "Harare", users: 186 },
  { city: "Nairobi", users: 305 },
  { city: "Lagos", users: 237 },
  { city: "Accra", users: 173 },
  { city: "Kigali", users: 209 },
]

const config = {
  users: { label: "Users", color: "hsl(var(--chart-2))" },
  label: { color: "hsl(var(--background))" },
} satisfies ChartConfig

export function ChartBarLabelCustom() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Bar Chart - Custom Labels</CardTitle>
        <CardDescription>Labels rendered inside bars</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config}>
          <BarChart data={data} layout="vertical" margin={{ left: 0, right: 16 }}>
            <CartesianGrid horizontal={false} />
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Bar dataKey="users" fill="var(--color-users)" radius={4} layout="vertical">
              <LabelList dataKey="city" position="insideLeft" offset={8} className="fill-[--color-label]" fontSize={12} />
              <LabelList dataKey="users" position="right" offset={8} className="fill-foreground" fontSize={12} />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
