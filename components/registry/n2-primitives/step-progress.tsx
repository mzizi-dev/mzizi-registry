"use client"
import * as React from "react"
import { cn } from "@/lib/utils"

interface StepProgressProps {
  steps: string[]
  currentStep: number
  className?: string
}

export function StepProgress({ steps, currentStep, className }: StepProgressProps) {
  return (
    <nav
      data-slot="step-progress"
      data-portal="https://mzizi.dev/components/step-progress"
      aria-label="Progress"
      className={cn("flex gap-1", className)}
    >
      {steps.map((step, i) => (
        <div
          key={step}
          className={cn(
            "h-1 flex-1 rounded-full transition-colors",
            i <= currentStep ? "bg-primary" : "bg-muted"
          )}
          role="progressbar"
          aria-valuenow={i <= currentStep ? 100 : 0}
          aria-label={step}
        />
      ))}
    </nav>
  )
}
export type { StepProgressProps }
