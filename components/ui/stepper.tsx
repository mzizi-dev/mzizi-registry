"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { CheckIcon } from "lucide-react"

import { cn } from "@/lib/utils"

interface StepItem {
  title: string
  description?: string
  icon?: React.ReactNode
}

const stepperVariants = cva("flex gap-2", {
  variants: {
    orientation: {
      horizontal: "flex-row items-start",
      vertical: "flex-col",
    },
  },
  defaultVariants: {
    orientation: "horizontal",
  },
})

function Stepper({
  className,
  steps,
  activeStep,
  onStepClick,
  orientation = "horizontal",
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof stepperVariants> & {
    steps: StepItem[]
    activeStep: number
    onStepClick?: (step: number) => void
  }) {
  return (
    <div
      data-slot="stepper"
      data-orientation={orientation}
      role="list"
      className={cn(stepperVariants({ orientation }), className)}
      {...props}
    >
      {steps.map((step, index) => {
        const status =
          index < activeStep
            ? "completed"
            : index === activeStep
              ? "active"
              : "upcoming"

        return (
          <div
            key={index}
            role="listitem"
            data-slot="stepper-item"
            data-status={status}
            className={cn(
              "group/step flex gap-3",
              orientation === "horizontal"
                ? "flex-1 flex-col items-center text-center"
                : "flex-row items-start"
            )}
          >
            <div
              className={cn(
                "flex items-center gap-2",
                orientation === "horizontal" ? "w-full flex-col" : "flex-col"
              )}
            >
              <div className="flex items-center gap-2">
                {orientation === "horizontal" && index > 0 && (
                  <div
                    data-slot="stepper-connector"
                    className={cn(
                      "hidden h-0.5 flex-1 sm:block",
                      index <= activeStep ? "bg-cobalt" : "bg-border"
                    )}
                  />
                )}
                <button
                  type="button"
                  onClick={() => onStepClick?.(index)}
                  disabled={!onStepClick}
                  aria-current={status === "active" ? "step" : undefined}
                  className={cn(
                    "inline-flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-medium transition-colors",
                    "focus-visible:ring-ring/50 focus-visible:outline-none focus-visible:ring-[3px]",
                    "disabled:cursor-default",
                    status === "completed" && "bg-malachite/20 text-malachite",
                    status === "active" && "bg-cobalt text-white",
                    status === "upcoming" && "bg-muted text-muted-foreground"
                  )}
                >
                  {status === "completed" ? (
                    <CheckIcon className="size-4" />
                  ) : step.icon ? (
                    step.icon
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </button>
                {orientation === "horizontal" && index < steps.length - 1 && (
                  <div
                    data-slot="stepper-connector"
                    className={cn(
                      "hidden h-0.5 flex-1 sm:block",
                      index < activeStep ? "bg-cobalt" : "bg-border"
                    )}
                  />
                )}
              </div>
            </div>
            {orientation === "vertical" && index < steps.length - 1 && (
              <div
                data-slot="stepper-connector"
                className={cn(
                  "ml-4 mt-1 w-0.5 self-stretch min-h-6",
                  index < activeStep ? "bg-cobalt" : "bg-border"
                )}
              />
            )}
            <div className="flex flex-col gap-0.5">
              <span
                className={cn(
                  "text-sm font-medium",
                  status === "upcoming" && "text-muted-foreground"
                )}
              >
                {step.title}
              </span>
              {step.description && (
                <span className="text-muted-foreground text-xs">
                  {step.description}
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export { Stepper, stepperVariants }
export type { StepItem }
