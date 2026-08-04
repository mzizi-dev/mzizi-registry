"use client"
import * as React from "react"
import { cn } from "@/lib/utils"
import { useNyuchiHarness } from "@/lib/harness"
type BookingStep = "select" | "schedule" | "provider" | "confirm" | "booked"
interface BookingPageProps {
  step?: BookingStep
  serviceName?: string
  children?: React.ReactNode
  loading?: boolean
  className?: string
}
export function BookingPage({
  step = "select",
  serviceName,
  children,
  loading = false,
  className,
}: BookingPageProps) {
  const { motion } = useNyuchiHarness("booking-page")
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
        data-slot="booking-page"
        data-portal="https://mzizi.dev/components/booking-page"
        data-loading
        role="main"
        className="mx-auto max-w-md animate-pulse space-y-4 p-4"
      >
        <div className="h-8 w-1/2 rounded bg-muted" />
        <div className="h-48 rounded-[var(--radius-lg,14px)] bg-muted" />
      </main>
    )
  return (
    <main
      data-slot="booking-page"
      data-step={step}
      role="main"
      aria-label={serviceName ? `Book ${serviceName}` : "Booking"}
      style={animStyle}
      className={cn("mx-auto flex max-w-md flex-col gap-6 p-4", className)}
    >
      {step === "booked" ? (
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
          <p className="text-xl font-bold">Booking Confirmed</p>
          {serviceName && <p className="text-sm text-muted-foreground">{serviceName}</p>}
        </div>
      ) : (
        <>
          {serviceName && <h1 className="text-xl font-bold">{serviceName}</h1>}
          {children}
        </>
      )}
    </main>
  )
}
export type { BookingStep, BookingPageProps }
