"use client"

import * as React from "react"
import { Eye, EyeOff, Copy, Check } from "lucide-react"

import { cn } from "@/lib/utils"

function ApiKeyDisplay({
  apiKey,
  label,
  className,
  ...props
}: {
  apiKey: string
  label?: string
} & React.ComponentProps<"div">) {
  const [revealed, setRevealed] = React.useState(false)
  const [copied, setCopied] = React.useState(false)

  const masked = `${"•".repeat(Math.max(0, apiKey.length - 4))}${apiKey.slice(-4)}`

  function handleCopy() {
    navigator.clipboard.writeText(apiKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div data-slot="api-key-display" className={cn("flex flex-col gap-1.5", className)} {...props}>
      {label && <span className="text-sm font-medium text-muted-foreground">{label}</span>}
      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2">
        <code className="flex-1 truncate font-mono text-sm select-all">
          {revealed ? apiKey : masked}
        </code>
        <button
          type="button"
          onClick={() => setRevealed((r) => !r)}
          className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
          aria-label={revealed ? "Hide API key" : "Reveal API key"}
        >
          {revealed ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
        <button
          type="button"
          onClick={handleCopy}
          className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Copy API key"
        >
          {copied ? (
            <Check className="size-4 text-[var(--color-malachite)]" />
          ) : (
            <Copy className="size-4" />
          )}
        </button>
      </div>
    </div>
  )
}

export { ApiKeyDisplay }
