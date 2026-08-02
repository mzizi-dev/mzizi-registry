"use client"
import * as React from "react"
import { cn } from "@/lib/utils"
import { useNyuchiHarness } from "@/lib/harness"

type PaymentStep = "amount" | "recipient" | "method" | "confirm" | "processing" | "complete"

interface PaymentPageProps {
  step?: PaymentStep
  recipient?: { name: string; avatar?: string; address?: string }
  amount?: number
  currency?: string
  children?: React.ReactNode
  loading?: boolean
  className?: string
}

const STEPS: PaymentStep[] = ["amount", "recipient", "method", "confirm"]

export function PaymentPage({
  step = "amount",
  recipient,
  amount,
  currency = "USD",
  children,
  loading = false,
  className,
}: PaymentPageProps) {
  const { motion } = useNyuchiHarness("payment-page")
  const animStyle = React.useMemo(
    () =>
      motion.prefersReduced
        ? {}
        : {
            animation: `nyuchi-fade-slide-up ${motion.enterDuration}ms ${motion.enterEasing} both`,
          },
    [motion]
  )
  const currentIdx = STEPS.indexOf(step)

  if (loading)
    return (
      <main
        data-slot="payment-page"
        data-portal="https://mzizi.dev/components/payment-page"
        data-loading
        role="main"
        className="animate-pulse space-y-4 p-4"
      >
        <div className="h-8 w-1/2 rounded bg-muted" />
        <div className="h-48 rounded-[var(--radius-lg,14px)] bg-muted" />
        <div className="h-14 rounded-full bg-muted" />
      </main>
    )

  return (
    <main
      data-slot="payment-page"
      data-step={step}
      role="main"
      aria-label="Payment"
      style={animStyle}
      className={cn("mx-auto flex max-w-md flex-col gap-6 p-4", className)}
    >
      {/* Progress */}
      {step !== "processing" && step !== "complete" && (
        <nav aria-label="Payment steps" className="flex gap-1">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                i <= currentIdx ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </nav>
      )}
      {/* Processing state */}
      {step === "processing" && (
        <div className="flex flex-col items-center gap-4 py-16" role="status">
          <div className="size-16 animate-spin rounded-full border-4 border-muted border-t-[var(--status-info,var(--color-cobalt,#00B0FF))]" />
          <p className="text-sm text-muted-foreground">Processing payment...</p>
        </div>
      )}
      {/* Complete state */}
      {step === "complete" && (
        <div className="flex flex-col items-center gap-4 py-16">
          <div className="flex size-16 items-center justify-center rounded-full bg-[var(--status-success,var(--color-malachite,#64FFDA))]/15">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--status-success, var(--color-malachite, #64FFDA))"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M5 12l5 5L20 7" />
            </svg>
          </div>
          <p className="text-lg font-semibold">Payment Sent</p>
          {amount && (
            <p className="text-2xl font-bold">
              {new Intl.NumberFormat(undefined, { style: "currency", currency }).format(amount)}
            </p>
          )}
          {recipient && <p className="text-sm text-muted-foreground">to {recipient.name}</p>}
        </div>
      )}
      {children}
    </main>
  )
}
export type { PaymentStep, PaymentPageProps }
