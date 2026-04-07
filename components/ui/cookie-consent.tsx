"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

interface CookieConsentProps extends React.ComponentProps<"div"> {
  onAccept: () => void
  onDecline: () => void
  onManage?: () => void
  message?: string
}

function CookieConsent({
  className,
  onAccept,
  onDecline,
  onManage,
  message = "We use cookies to improve your experience. By continuing to use this site, you agree to our use of cookies in accordance with our privacy policy.",
  ...props
}: CookieConsentProps) {
  const [visible, setVisible] = React.useState(true)

  if (!visible) return null

  return (
    <div
      data-slot="cookie-consent"
      role="dialog"
      aria-label="Cookie consent"
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 bg-card p-4 shadow-lg ring-1 ring-foreground/10 md:p-6",
        className
      )}
      {...props}
    >
      <div className="mx-auto flex max-w-5xl flex-col items-start gap-4 sm:flex-row sm:items-center">
        <p className="flex-1 text-sm text-muted-foreground">{message}</p>
        <div className="flex shrink-0 items-center gap-2">
          {onManage && (
            <button
              type="button"
              className="rounded-4xl px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              onClick={onManage}
            >
              Manage
            </button>
          )}
          <button
            type="button"
            className="rounded-4xl border border-border bg-input/30 px-4 py-1.5 text-sm font-medium transition-colors hover:bg-input/50"
            onClick={() => {
              setVisible(false)
              onDecline()
            }}
          >
            Decline
          </button>
          <button
            type="button"
            className="rounded-4xl bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
            onClick={() => {
              setVisible(false)
              onAccept()
            }}
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  )
}

export { CookieConsent, type CookieConsentProps }
