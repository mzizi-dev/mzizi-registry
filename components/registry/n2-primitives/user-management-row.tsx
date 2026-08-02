import * as React from "react"
import { cn } from "@/lib/utils"

interface UserManagementRowProps extends React.ComponentProps<"div"> {
  name: string
  email: string
  avatar?: string
  role: string
  verificationTier?: 0 | 1 | 2 | 3 | 4
  lastActive?: string
  status?: "active" | "suspended" | "pending"
  onEditRole?: () => void
  onSuspend?: () => void
  onDelete?: () => void
}

const statusDots = {
  active: "bg-[var(--color-malachite,#64FFDA)]",
  suspended: "bg-destructive",
  pending: "bg-[var(--color-gold,#FFD740)]",
}

function UserManagementRow({
  name,
  email,
  avatar,
  role,
  verificationTier,
  lastActive,
  status = "active",
  onEditRole,
  onSuspend,
  onDelete,
  className,
  ...props
}: UserManagementRowProps) {
  return (
    <div
      data-slot="user-management-row"
      data-portal="https://mzizi.dev/components/user-management-row"
      role="listitem"
      className={cn(
        "flex items-center gap-3 rounded-[var(--radius-md,12px)] px-3 py-2.5 transition-colors hover:bg-muted/30",
        className
      )}
      {...props}
    >
      <div className="relative shrink-0">
        <div className="flex size-9 items-center justify-center rounded-full bg-muted text-xs font-medium">
          {avatar ? (
            <img src={avatar} alt="" className="size-full rounded-full object-cover" />
          ) : (
            name.charAt(0)
          )}
        </div>
        <div
          className={cn(
            "absolute -right-0.5 -bottom-0.5 size-2 rounded-full border border-background",
            statusDots[status]
          )}
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-medium">{name}</span>
          {verificationTier !== undefined && verificationTier > 0 && (
            <span className="text-[10px] text-[var(--color-gold,#FFD740)]">✓</span>
          )}
        </div>
        <div className="truncate text-xs text-muted-foreground">{email}</div>
      </div>
      <span className="hidden rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground capitalize sm:inline">
        {role}
      </span>
      {lastActive && (
        <span className="hidden text-[10px] text-muted-foreground lg:inline">{lastActive}</span>
      )}
      <div className="flex gap-1">
        {onEditRole && (
          <button
            onClick={onEditRole}
            className="h-7 rounded-full bg-muted px-2 text-[10px] font-medium transition-colors hover:bg-border"
          >
            Role
          </button>
        )}
        {onSuspend && (
          <button
            onClick={onSuspend}
            className="h-7 rounded-full px-2 text-[10px] font-medium text-[var(--color-gold,#FFD740)] transition-colors hover:bg-[var(--color-gold,#FFD740)]/10"
          >
            {status === "suspended" ? "Unsuspend" : "Suspend"}
          </button>
        )}
        {/* `onDelete` was destructured and then never rendered, so a consumer
            passing it got no control at all. Same pattern as its two siblings. */}
        {onDelete && (
          <button
            onClick={onDelete}
            className="h-7 rounded-full px-2 text-[10px] font-medium text-destructive transition-colors hover:bg-destructive/10"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  )
}

export { UserManagementRow }
export type { UserManagementRowProps }
