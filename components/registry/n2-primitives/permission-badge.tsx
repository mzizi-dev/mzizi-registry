import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const permissionBadgeVariants = cva(
  "inline-flex h-5 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium capitalize",
  {
    variants: {
      variant: {
        admin: "bg-destructive/10 text-destructive",
        editor:
          "bg-[var(--tier-otp,var(--color-cobalt,#00B0FF))]/15 text-[var(--tier-otp,var(--color-cobalt,#00B0FF))]",
        viewer: "bg-muted text-muted-foreground",
        owner:
          "bg-[var(--tier-licensed,var(--color-gold,#FFD740))]/15 text-[var(--tier-licensed,var(--color-gold,#FFD740))]",
      },
    },
    defaultVariants: { variant: "viewer" },
  }
)

function PermissionBadge({
  role,
  variant,
  className,
  ...props
}: {
  role: string
} & VariantProps<typeof permissionBadgeVariants> &
  React.ComponentProps<"span">) {
  return (
    <span
      data-slot="permission-badge"
      data-portal="https://mzizi.dev/components/permission-badge"
      data-variant={variant}
      className={cn(permissionBadgeVariants({ variant }), className)}
      {...props}
    >
      {role}
    </span>
  )
}

export { PermissionBadge, permissionBadgeVariants }
