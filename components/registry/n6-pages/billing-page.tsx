"use client"
import * as React from "react"
import { cn } from "@/lib/utils"
import { useNyuchiHarness } from "@/lib/harness"
interface BillingPlan {
  name: string
  price: string
  period: string
  features: string[]
  isCurrent?: boolean
}
interface BillingPageProps {
  currentPlan?: BillingPlan
  plans?: BillingPlan[]
  usage?: React.ReactNode
  invoices?: React.ReactNode
  paymentMethods?: React.ReactNode
  onUpgrade?: (plan: string) => void
  children?: React.ReactNode
  loading?: boolean
  className?: string
}
export function BillingPage({
  currentPlan,
  plans,
  usage,
  invoices,
  paymentMethods,
  onUpgrade,
  children,
  loading = false,
  className,
}: BillingPageProps) {
  const { motion } = useNyuchiHarness("billing-page")
  const animStyle = React.useMemo(
    () =>
      motion.prefersReduced
        ? {}
        : {
            animation: `nyuchi-fade-slide-up ${motion.enterDuration}ms ${motion.enterEasing} both`,
          },
    [motion]
  )
  if (loading)
    return (
      <main
        data-slot="billing-page"
        data-portal="https://mzizi.dev/components/billing-page"
        data-loading
        role="main"
        className="mx-auto max-w-4xl animate-pulse space-y-4 p-6"
      >
        <div className="h-8 w-1/3 rounded bg-muted" />
        <div className="h-32 rounded-[var(--radius-lg,14px)] bg-muted" />
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 rounded-[var(--radius-lg,14px)] bg-muted" />
          ))}
        </div>
      </main>
    )
  return (
    <main
      data-slot="billing-page"
      role="main"
      aria-label="Billing"
      style={animStyle}
      className={cn("mx-auto flex max-w-4xl flex-col gap-6 p-6", className)}
    >
      <h1 className="text-xl font-bold">Billing & Plans</h1>
      {currentPlan && (
        <section
          aria-label="Current plan"
          className="rounded-[var(--radius-xl,17px)] border border-border bg-gradient-to-r from-[var(--status-info,var(--color-cobalt,#00B0FF))]/10 to-[var(--color-tanzanite,#B388FF)]/10 p-6"
        >
          <p className="text-sm text-muted-foreground">Current Plan</p>
          <p className="mt-1 text-2xl font-bold">{currentPlan.name}</p>
          <p className="text-sm text-muted-foreground">
            {currentPlan.price} / {currentPlan.period}
          </p>
        </section>
      )}
      {usage && <section aria-label="Usage">{usage}</section>}
      {plans && plans.length > 0 && (
        <section aria-label="Available plans" className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                "rounded-[var(--radius-lg,14px)] bg-card p-5 ring-1",
                plan.isCurrent
                  ? "ring-2 ring-[var(--status-info,var(--color-cobalt,#00B0FF))]"
                  : "ring-foreground/10"
              )}
            >
              <p className="font-semibold">{plan.name}</p>
              <p className="mt-1 text-2xl font-bold">
                {plan.price}
                <span className="text-sm font-normal text-muted-foreground"> / {plan.period}</span>
              </p>
              <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-1.5">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="var(--status-success,var(--color-malachite,#64FFDA))"
                      strokeWidth="2"
                    >
                      <path d="M5 12l5 5L20 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              {!plan.isCurrent && onUpgrade && (
                <button
                  onClick={() => onUpgrade(plan.name)}
                  className="mt-4 min-h-[48px] w-full rounded-full bg-primary text-sm font-medium text-white transition-colors hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary,#00B0FF)]"
                >
                  Upgrade
                </button>
              )}
            </div>
          ))}
        </section>
      )}
      {paymentMethods && <section aria-label="Payment methods">{paymentMethods}</section>}
      {invoices && <section aria-label="Invoices">{invoices}</section>}
      {children}
    </main>
  )
}
export type { BillingPlan, BillingPageProps }
