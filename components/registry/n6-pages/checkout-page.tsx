"use client"
import * as React from "react"
import { cn } from "@/lib/utils"
import { useNyuchiHarness } from "@/lib/harness"
type CheckoutStep = "cart" | "shipping" | "payment" | "review" | "processing" | "confirmed"
interface CheckoutPageProps {
  step?: CheckoutStep
  orderSummary?: React.ReactNode
  children?: React.ReactNode
  loading?: boolean
  className?: string
}
const STEPS: CheckoutStep[] = ["cart", "shipping", "payment", "review"]
export function CheckoutPage({
  step = "cart",
  orderSummary,
  children,
  loading = false,
  className,
}: CheckoutPageProps) {
  const { motion } = useNyuchiHarness("checkout-page")
  const animStyle = React.useMemo(
    () =>
      motion.prefersReduced
        ? {}
        : {
            animation: `nyuchi-fade-slide-up ${motion.enterDuration}ms ${motion.enterEasing} both`,
          },
    [motion]
  )
  const idx = STEPS.indexOf(step)
  if (loading)
    return (
      <main
        data-slot="checkout-page"
        data-portal="https://mzizi.dev/components/checkout-page"
        data-loading
        role="main"
        className="mx-auto max-w-lg animate-pulse space-y-4 p-4"
      >
        <div className="h-4 rounded bg-muted" />
        <div className="h-48 rounded-[var(--radius-lg,14px)] bg-muted" />
        <div className="h-14 rounded-full bg-muted" />
      </main>
    )
  return (
    <main
      data-slot="checkout-page"
      data-step={step}
      role="main"
      aria-label="Checkout"
      style={animStyle}
      className={cn("mx-auto flex max-w-lg flex-col gap-6 p-4", className)}
    >
      {step !== "processing" && step !== "confirmed" && (
        <nav aria-label="Checkout steps" className="flex gap-1">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                i <= idx ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </nav>
      )}
      {step === "confirmed" && (
        <div className="flex flex-col items-center gap-4 py-12">
          <div className="flex size-16 items-center justify-center rounded-full bg-[var(--status-success,var(--color-malachite,#64FFDA))]/15">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M5 12l5 5L20 7" />
            </svg>
          </div>
          <p className="text-xl font-bold">Order Confirmed</p>
        </div>
      )}
      {children}
      {orderSummary && <aside aria-label="Order summary">{orderSummary}</aside>}
    </main>
  )
}
export type { CheckoutStep, CheckoutPageProps }
