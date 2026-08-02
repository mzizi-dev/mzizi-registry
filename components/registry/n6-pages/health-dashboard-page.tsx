"use client"
import * as React from "react"
import { cn } from "@/lib/utils"
import { useNyuchiHarness } from "@/lib/harness"
interface HealthDashboardPageProps {
  vitals?: React.ReactNode
  activity?: React.ReactNode
  medications?: React.ReactNode
  appointments?: React.ReactNode
  children?: React.ReactNode
  loading?: boolean
  className?: string
}
export function HealthDashboardPage({
  vitals,
  activity,
  medications,
  appointments,
  children,
  loading = false,
  className,
}: HealthDashboardPageProps) {
  const { motion } = useNyuchiHarness("health-dashboard-page")
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
        data-slot="health-dashboard-page"
        data-portal="https://mzizi.dev/components/health-dashboard-page"
        data-loading
        role="main"
        className="animate-pulse space-y-4 p-4"
      >
        <div className="h-8 w-1/3 rounded bg-muted" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-[var(--radius-lg,14px)] bg-muted" />
          ))}
        </div>
        <div className="h-48 rounded-[var(--radius-lg,14px)] bg-muted" />
      </main>
    )
  return (
    <main
      data-slot="health-dashboard-page"
      role="main"
      aria-label="Health Dashboard"
      style={animStyle}
      className={cn("flex flex-col gap-4 p-4", className)}
    >
      <h1 className="text-xl font-bold">Health</h1>
      {vitals && <section aria-label="Vitals">{vitals}</section>}
      {activity && <section aria-label="Activity">{activity}</section>}
      {medications && <section aria-label="Medications">{medications}</section>}
      {appointments && <section aria-label="Appointments">{appointments}</section>}
      {children}
    </main>
  )
}
export type { HealthDashboardPageProps }
