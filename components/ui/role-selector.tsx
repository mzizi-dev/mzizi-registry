"use client"

import * as React from "react"
import { Shield } from "lucide-react"

import { cn } from "@/lib/utils"

interface Role {
  id: string
  name: string
  description: string
  permissions: string[]
}

function RoleSelector({
  roles,
  value,
  onChange,
  className,
  ...props
}: {
  roles: Role[]
  value?: string
  onChange: (roleId: string) => void
} & Omit<React.ComponentProps<"div">, "onChange">) {
  return (
    <div
      data-slot="role-selector"
      className={cn("flex flex-col gap-2", className)}
      role="radiogroup"
      aria-label="Select a role"
      {...props}
    >
      {roles.map((role) => {
        const isSelected = role.id === value
        return (
          <button
            key={role.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(role.id)}
            className={cn(
              "flex items-start gap-3 rounded-xl p-4 text-left ring-1 transition-all",
              isSelected
                ? "bg-[var(--color-cobalt)]/5 ring-2 ring-[var(--color-cobalt)]"
                : "bg-card ring-foreground/10 hover:bg-muted/50"
            )}
          >
            <div
              className={cn(
                "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                isSelected ? "border-[var(--color-cobalt)]" : "border-border"
              )}
            >
              {isSelected && <div className="size-2 rounded-full bg-[var(--color-cobalt)]" />}
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">{role.name}</span>
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Shield className="size-3" />
                  {role.permissions.length} permissions
                </span>
              </div>
              <span className="text-sm text-muted-foreground">{role.description}</span>
            </div>
          </button>
        )
      })}
    </div>
  )
}

export { RoleSelector, type Role }
