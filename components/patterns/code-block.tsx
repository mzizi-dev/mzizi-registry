"use client"

import { useState } from "react"
import { Copy, Check } from "lucide-react"
import { cn } from "@/lib/utils"

export function CodeBlock({
  code,
  filename,
  className,
}: {
  code: string
  filename?: string
  className?: string
}) {
  const [copied, setCopied] = useState(false)

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-[#141413] dark:bg-[#0A0A0A]",
        className
      )}
    >
      {filename && (
        <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2">
          <span className="font-mono text-xs text-[#9A9A95]">{filename}</span>
          <button
            onClick={() => {
              navigator.clipboard.writeText(code)
              setCopied(true)
              setTimeout(() => setCopied(false), 2000)
            }}
            className="flex size-6 items-center justify-center rounded-md text-[#9A9A95] transition-colors hover:text-[#F5F5F4]"
            aria-label="Copy code"
          >
            {copied ? (
              <Check className="size-3.5 text-[var(--color-malachite)]" />
            ) : (
              <Copy className="size-3.5" />
            )}
          </button>
        </div>
      )}
      <pre className="overflow-x-auto p-4">
        <code className="font-mono text-[13px] leading-relaxed text-[#F5F5F4]">{code}</code>
      </pre>
    </div>
  )
}
