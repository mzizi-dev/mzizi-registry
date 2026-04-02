"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

function SuggestedPrompts({
  className,
  prompts,
  onSelect,
  ...props
}: React.ComponentProps<"div"> & {
  prompts: string[]
  onSelect?: (prompt: string) => void
}) {
  return (
    <div
      data-slot="suggested-prompts"
      className={cn(
        "flex gap-2 overflow-x-auto pb-1 scrollbar-none",
        className
      )}
      {...props}
    >
      {prompts.map((prompt) => (
        <button
          key={prompt}
          onClick={() => onSelect?.(prompt)}
          className="inline-flex shrink-0 items-center rounded-full border border-border bg-input/30 px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-input/50 hover:text-foreground"
        >
          {prompt}
        </button>
      ))}
    </div>
  )
}

export { SuggestedPrompts }
