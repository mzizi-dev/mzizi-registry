import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/*
 * The coloured roles read the verification-tier roles (#543), defined once in the N1 tokens:
 * editor → `--tier-otp` (cobalt), owner → `--tier-government` (gold). Text takes each tier's
 * `-text` role, which the token gate holds to APCA Lc 75 on the page in both themes.
 */
const permissionBadgeVariants = cva(
  "inline-flex h-5 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium capitalize",
  {
    variants: {
      variant: {
        admin: "bg-destructive/10 text-destructive",
        editor:
          "bg-tier-otp/15 text-tier-otp-text",
        viewer: "bg-muted text-muted-foreground",
        owner:
          "bg-tier-government/15 text-tier-government-text",
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
