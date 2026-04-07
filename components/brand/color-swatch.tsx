"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Mineral } from "@/lib/brand"

interface ColorSwatchProps {
  mineral: Mineral
  className?: string
}

export function ColorSwatch({ mineral, className }: ColorSwatchProps) {
  const [copied, setCopied] = useState<string | null>(null)

  function copyValue(value: string) {
    navigator.clipboard.writeText(value)
    setCopied(value)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className={cn("group flex flex-col gap-3", className)}>
      <button
        onClick={() => copyValue(mineral.hex)}
        className="relative aspect-[4/3] w-full overflow-hidden rounded-xl transition-transform hover:scale-[1.02]"
        style={{ backgroundColor: `var(${mineral.cssVar})` }}
      >
        <span className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
          {copied === mineral.hex ? (
            <Check className="size-5 text-white drop-shadow-md" />
          ) : (
            <Copy className="size-5 text-white drop-shadow-md" />
          )}
        </span>
      </button>

      <div className="space-y-1">
        <p className="font-medium text-foreground capitalize">{mineral.name}</p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => copyValue(mineral.hex)}
            className="rounded-md px-1.5 py-0.5 font-mono text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {copied === mineral.hex ? "Copied!" : mineral.hex}
          </button>
          <button
            onClick={() => copyValue(`var(${mineral.cssVar})`)}
            className="rounded-md px-1.5 py-0.5 font-mono text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {copied === `var(${mineral.cssVar})` ? "Copied!" : mineral.cssVar}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">{mineral.usage}</p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => copyValue(mineral.lightHex)}
          className="flex flex-1 flex-col items-center gap-1 rounded-lg border border-border p-2 transition-colors hover:bg-muted"
        >
          <span className="size-6 rounded-md" style={{ backgroundColor: mineral.lightHex }} />
          <span className="font-mono text-[10px] text-muted-foreground">
            {copied === mineral.lightHex ? "Copied!" : "Light"}
          </span>
        </button>
        <button
          onClick={() => copyValue(mineral.darkHex)}
          className="flex flex-1 flex-col items-center gap-1 rounded-lg border border-border p-2 transition-colors hover:bg-muted"
        >
          <span className="size-6 rounded-md" style={{ backgroundColor: mineral.darkHex }} />
          <span className="font-mono text-[10px] text-muted-foreground">
            {copied === mineral.darkHex ? "Copied!" : "Dark"}
          </span>
        </button>
      </div>
    </div>
  )
}
