"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"

export function CopyCommand({
  command = "npx shadcn@latest add https://design.nyuchi.com/api/v1/ui/button",
}: {
  command?: string
} = {}) {
  const [copied, setCopied] = useState(false)

  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(command)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }}
      className="group flex w-full max-w-2xl items-center gap-2 rounded-2xl border border-border bg-card px-3 py-3 text-left transition-all hover:border-foreground/15 sm:gap-3 sm:px-5 sm:py-3.5"
    >
      <span className="hidden font-mono text-sm text-muted-foreground sm:inline">$</span>
      <code className="flex-1 truncate font-mono text-xs text-muted-foreground sm:text-sm">
        {command}
      </code>
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors group-hover:text-foreground">
        {copied ? (
          <Check className="size-4 text-[var(--color-malachite)]" />
        ) : (
          <Copy className="size-4" />
        )}
      </span>
    </button>
  )
}
