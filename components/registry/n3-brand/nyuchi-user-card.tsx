import { useNyuchiHarness } from "@/lib/harness"
import * as React from "react"

import { cn } from "@/lib/utils"

interface UserCardProps extends React.ComponentProps<"div"> {
  /** Renders the skeleton branch this component already implements. */
  loading?: boolean
  name: string
  email?: string
  avatar?: string
  role?: string
  actions?: React.ReactNode
}

function UserCard({
  loading = false,
  className,
  name,
  email,
  avatar,
  role,
  actions,
  ...props
}: UserCardProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  const { motion } = useNyuchiHarness("user-card")
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
        data-slot="user-card"
        data-portal="https://mzizi.dev/components/user-card"
        data-loading
        role="article"
        className="flex animate-pulse items-center gap-3 rounded-[var(--radius-lg,14px)] bg-card p-3 ring-1 ring-foreground/10"
      >
        <div className="size-10 shrink-0 rounded-full bg-muted" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3.5 w-1/3 rounded bg-muted" />
          <div className="h-2.5 w-1/4 rounded bg-muted" />
        </div>
      </div>
    )
  if (loading)
    return (
      <div
        data-slot="user-card"
        data-loading
        role="article"
        className="flex animate-pulse items-center gap-3 rounded-[var(--radius-lg,14px)] p-3"
      >
        <div className="size-10 shrink-0 rounded-full bg-muted" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3.5 w-1/3 rounded bg-muted" />
          <div className="h-2.5 w-1/4 rounded bg-muted" />
        </div>
      </div>
    )

  return (
    <div
      data-slot="user-card"
      style={animStyle}
      role="article"
      className={cn(
        "flex items-center gap-4 rounded-2xl bg-card p-4 text-sm ring-1 ring-foreground/10",
        className
      )}
      {...props}
    >
      <div className="size-12 shrink-0 overflow-hidden rounded-full">
        {avatar ? (
          <img src={avatar} alt={name} className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center bg-muted text-base font-medium text-muted-foreground">
            {initials}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-medium">{name}</p>
          {role && (
            <span className="shrink-0 rounded-4xl bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {role}
            </span>
          )}
        </div>
        {email && <p className="mt-0.5 truncate text-xs text-muted-foreground">{email}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
    </div>
  )
}

export { UserCard, type UserCardProps }
