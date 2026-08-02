"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface InviteLinkProps extends React.ComponentProps<"div"> {
  url: string
  expiresAt?: Date | string
  usageCount?: number
  maxUses?: number
  onCopy?: () => void
  onRegenerate?: () => void
}

function InviteLink({
  url,
  expiresAt,
  usageCount,
  maxUses,
  onCopy,
  onRegenerate,
  className,
  ...props
}: InviteLinkProps) {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      /* fallback */
    }
    setCopied(true)
    onCopy?.()
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      data-slot="invite-link"
      data-portal="https://mzizi.dev/components/invite-link"
      role="group"
      aria-label="Invite link"
      className={cn("rounded-[var(--radius-lg,14px)] border border-border bg-card p-4", className)}
      {...props}
    >
      <div className="text-xs font-medium text-muted-foreground">Invite Link</div>
      <div className="mt-2 flex items-center gap-2">
        <div className="flex-1 truncate rounded-[var(--radius-md,12px)] bg-muted/50 px-3 py-2 font-mono text-xs">
          {url}
        </div>
        <button
          onClick={handleCopy}
          className="h-10 shrink-0 rounded-full bg-primary px-4 text-xs font-medium text-primary-foreground"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <div className="mt-2 flex items-center gap-3 text-[10px] text-muted-foreground">
        {expiresAt && <span>Expires {new Date(expiresAt).toLocaleDateString()}</span>}
        {usageCount !== undefined && (
          <span>
            {usageCount}
            {maxUses ? `/${maxUses}` : ""} uses
          </span>
        )}
        {onRegenerate && (
          <button
            onClick={onRegenerate}
            className="text-[var(--color-cobalt,#00B0FF)] transition-all hover:underline"
          >
            Regenerate
          </button>
        )}
      </div>
    </div>
  )
}

export { InviteLink }
export type { InviteLinkProps }
