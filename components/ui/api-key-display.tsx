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
    <div
      data-slot="api-key-display"
      className={cn("flex flex-col gap-1.5", className)}
      {...props}
    >
      {label && (
        <span className="text-muted-foreground text-sm font-medium">{label}</span>
      )}
      <div className="bg-muted flex items-center gap-2 rounded-lg border border-border px-3 py-2">
        <code className="font-mono text-sm flex-1 select-all truncate">
          {revealed ? apiKey : masked}
        </code>
        <button
          type="button"
          onClick={() => setRevealed((r) => !r)}
          className="text-muted-foreground hover:text-foreground shrink-0 p-1 rounded-md transition-colors"
          aria-label={revealed ? "Hide API key" : "Reveal API key"}
        >
          {revealed ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
        <button
          type="button"
          onClick={handleCopy}
          className="text-muted-foreground hover:text-foreground shrink-0 p-1 rounded-md transition-colors"
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
