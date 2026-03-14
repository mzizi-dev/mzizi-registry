"use client"

import { COMPONENT_DEMOS } from "./demos"

interface DemoRendererProps {
  name: string
}

export function hasDemoFor(name: string): boolean {
  return name in COMPONENT_DEMOS
}

export function DemoRenderer({ name }: DemoRendererProps) {
  const demo = COMPONENT_DEMOS[name]

  if (!demo) {
    return (
      <div className="text-center text-sm text-muted-foreground">
        <p>No interactive preview available for this component.</p>
        <p className="mt-1">Switch to the Code tab to view the source.</p>
      </div>
    )
  }

  return <>{demo}</>
}
