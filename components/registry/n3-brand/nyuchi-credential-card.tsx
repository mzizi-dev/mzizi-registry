"use client"

// ── INFRASTRUCTURE HARNESS (auto-wired) ──
// Every brand component participates in observability, motion, a11y,
// and health monitoring via the harness. Zero manual config.
import { useNyuchiHarness } from "@/lib/harness"

import * as React from "react"
import { Award, Calendar, Building2, Shield, Check, X, Clock, AlertTriangle } from "@/lib/icons"
import { cn } from "@/lib/utils"

type CredentialStatus = "active" | "expired" | "revoked" | "suspended" | "pending"

const statusConfig: Record<
  CredentialStatus,
  { label: string; color: string; icon: React.ComponentType<React.SVGProps<SVGSVGElement>> }
> = {
  active: { label: "Active", color: "var(--status-success, #64FFDA)", icon: Check },
  expired: { label: "Expired", color: "var(--status-warning, #FFD740)", icon: Clock },
  revoked: { label: "Revoked", color: "var(--status-error, #FF5252)", icon: X },
  suspended: { label: "Suspended", color: "var(--status-error, #FF5252)", icon: AlertTriangle },
  pending: { label: "Pending", color: "var(--color-cobalt,#00B0FF)", icon: Clock },
}

interface NyuchiCredentialCardProps {
  loading?: boolean
  name: string
  issuingBody: string
  credentialType?: string
  status?: CredentialStatus
  issuedDate?: string
  expiryDate?: string
  licenseNumber?: string
  verifiedByPlatform?: boolean
  onClick?: () => void
  className?: string
}

function NyuchiCredentialCard({
  loading = false,
  name,
  issuingBody,
  credentialType,
  status = "active",
  issuedDate,
  expiryDate,
  licenseNumber,
  verifiedByPlatform,
  onClick,
  className,
}: NyuchiCredentialCardProps) {
  const { motion } = useNyuchiHarness("credential-card")
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
      <div
        data-slot="nyuchi-credential-card"
        data-portal="https://mzizi.dev/components/nyuchi-credential-card"
        data-loading
        role="article"
        className="animate-pulse space-y-3 rounded-[var(--radius-lg,14px)] bg-card p-4 ring-1 ring-foreground/10"
      >
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-full bg-muted" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 w-1/2 rounded bg-muted" />
            <div className="h-2.5 w-1/3 rounded bg-muted" />
          </div>
        </div>
        <div className="h-2 rounded-full bg-muted" />
      </div>
    )

  const sc = statusConfig[status]
  const StatusIcon = sc.icon

  return (
    <div
      data-slot="nyuchi-credential-card"
      style={animStyle}
      role="article"
      tabIndex={0}
      data-status={status}
      onClick={onClick}
      className={cn(
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary,#00B0FF)]",
        "rounded-[var(--radius-card,14px)] bg-card p-4 ring-1 ring-foreground/10 transition-shadow",
        onClick && "cursor-pointer hover:shadow-md",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-inner,7px)] bg-[var(--color-tanzanite)]/10">
          <Award className="size-6 text-[var(--color-tanzanite)]" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="text-sm font-semibold text-foreground">{name}</h4>
              {credentialType && (
                <span className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                  {credentialType}
                </span>
              )}
            </div>
            <span
              className="flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
              style={{
                backgroundColor: `color-mix(in srgb, ${sc.color} 15%, transparent)`,
                color: sc.color,
              }}
            >
              <StatusIcon className="size-3" strokeWidth={2.5} />
              {sc.label}
            </span>
          </div>
          <div className="mt-2 flex flex-col gap-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Building2 className="size-3" />
              {issuingBody}
            </span>
            {licenseNumber && (
              <span className="font-mono text-[10px]">License: {licenseNumber}</span>
            )}
            <div className="flex items-center gap-3">
              {issuedDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="size-3" />
                  Issued: {issuedDate}
                </span>
              )}
              {expiryDate && <span>Expires: {expiryDate}</span>}
            </div>
          </div>
          {verifiedByPlatform && (
            <div className="mt-2 flex items-center gap-1 text-[10px] font-medium text-[var(--color-tanzanite)]">
              <Shield className="size-3" />
              Platform Verified
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export { NyuchiCredentialCard }
export type { NyuchiCredentialCardProps, CredentialStatus }
