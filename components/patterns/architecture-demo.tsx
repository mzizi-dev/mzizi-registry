"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { SectionErrorBoundary } from "@/components/section-error-boundary"

// Layer 1: Shared primitives (Button, Card, Badge, Progress) — imported above

// Layer 2: Domain composites — compose primitives into domain-specific UI

function WeatherCard() {
  return (
    <Card size="sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Harare</CardTitle>
          <Badge
            variant="outline"
            className="border-[var(--color-malachite)]/30 text-[var(--color-malachite)]"
          >
            Clear
          </Badge>
        </div>
        <CardDescription>Current conditions</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold text-foreground">28°C</p>
        <div className="mt-2 flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Confidence</span>
            <span>92%</span>
          </div>
          <Progress value={92} />
        </div>
      </CardContent>
    </Card>
  )
}

function ActivityItem({ label, mineral }: { label: string; mineral: string }) {
  const colors: Record<string, string> = {
    malachite: "bg-[var(--color-malachite)]",
    cobalt: "bg-[var(--color-cobalt)]",
    gold: "bg-[var(--color-gold)]",
  }
  return (
    <div className="flex items-center gap-2 rounded-lg bg-secondary/50 px-3 py-2">
      <div className={`size-2 rounded-full ${colors[mineral]}`} />
      <span className="text-sm text-foreground">{label}</span>
    </div>
  )
}

function CrashingComponent(): React.ReactNode {
  throw new Error("Intentional error for demonstration")
}

// Layer 3: Page orchestrator — composes domain components

function DemoOrchestrator({ showError }: { showError: boolean }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {/* Layer 4: Each section wrapped in SectionErrorBoundary */}
      <SectionErrorBoundary section="Weather Overview">
        <WeatherCard />
      </SectionErrorBoundary>

      <SectionErrorBoundary section="Activity Feed">
        <div className="flex flex-col gap-2">
          <ActivityItem label="Farming — Maize harvest" mineral="malachite" />
          <ActivityItem label="Travel — Victoria Falls" mineral="cobalt" />
          <ActivityItem label="Sports — Cricket match" mineral="gold" />
        </div>
      </SectionErrorBoundary>

      <SectionErrorBoundary section="Analytics Chart">
        {showError ? (
          <CrashingComponent />
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-secondary/30 p-8">
            <div className="flex items-end gap-1">
              {[40, 65, 45, 80, 55, 70, 90].map((h, i) => (
                <div
                  key={i}
                  className="w-4 rounded-t bg-[var(--color-cobalt)] transition-all"
                  style={{ height: `${h}px` }}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">Weekly temperature trend</span>
          </div>
        )}
      </SectionErrorBoundary>

      <SectionErrorBoundary section="Recent Reports">
        <Card size="sm">
          <CardContent className="pt-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Flood warning</span>
                <Badge variant="destructive">Alert</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Crop report</span>
                <Badge variant="outline">New</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Road conditions</span>
                <Badge variant="secondary">Updated</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </SectionErrorBoundary>
    </div>
  )
}

// Layer 5: This would be page.tsx in a real app — here it's the demo wrapper

export function ArchitectureDemo() {
  const [showError, setShowError] = useState(false)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
        <Button
          variant={showError ? "destructive" : "outline"}
          size="sm"
          onClick={() => setShowError(!showError)}
          className="w-full sm:w-auto"
        >
          {showError ? "Error triggered" : "Trigger error in Analytics Chart"}
        </Button>
        <span className="text-xs text-muted-foreground">
          {showError
            ? "Notice: only the chart section shows an error — everything else works"
            : "Click to crash the Analytics Chart section"}
        </span>
      </div>
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
        <DemoOrchestrator showError={showError} />
      </div>
      <div className="flex flex-wrap gap-2">
        {[
          { label: "L1 Primitives", color: "bg-[var(--color-cobalt)]" },
          { label: "L2 Composites", color: "bg-[var(--color-tanzanite)]" },
          { label: "L3 Orchestrator", color: "bg-[var(--color-malachite)]" },
          { label: "L4 Error Boundary", color: "bg-[var(--color-gold)]" },
          { label: "L5 Page Wrapper", color: "bg-[var(--color-terracotta)]" },
        ].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className={`size-2 rounded-full ${color}`} />
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
