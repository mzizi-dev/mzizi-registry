"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const announcementBarVariants = cva(
  "relative flex w-full items-center justify-center gap-3 px-4 py-2.5 text-sm font-medium transition-all",
  {
    variants: {
      variant: {
        info: "bg-mineral-cobalt/10 text-mineral-cobalt dark:bg-mineral-cobalt/20",
        success: "bg-mineral-malachite/10 text-mineral-malachite dark:bg-mineral-malachite/20",
        warning: "bg-mineral-gold/10 text-mineral-gold dark:bg-mineral-gold/20",
      },
    },
    defaultVariants: {
      variant: "info",
    },
  }
)

interface AnnouncementBarProps
  extends React.ComponentProps<"div">, VariantProps<typeof announcementBarVariants> {
  message: string
  dismissible?: boolean
  action?: React.ReactNode
  onDismiss?: () => void
}

function AnnouncementBar({
  className,
  variant = "info",
  message,
  dismissible = true,
  action,
  onDismiss,
  ...props
}: AnnouncementBarProps) {
  const [dismissed, setDismissed] = React.useState(false)

  if (dismissed) return null

  return (
    <div
      data-slot="announcement-bar"
      data-variant={variant}
      role="status"
      className={cn(announcementBarVariants({ variant }), className)}
      {...props}
    >
      <span className="flex-1 text-center">{message}</span>
      {action && <div className="shrink-0">{action}</div>}
      {dismissible && (
        <button
          type="button"
          className="absolute right-2 rounded-md p-1 transition-colors hover:bg-foreground/10"
          aria-label="Dismiss announcement"
          onClick={() => {
            setDismissed(true)
            onDismiss?.()
          }}
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  )
}

export { AnnouncementBar, announcementBarVariants, type AnnouncementBarProps }
