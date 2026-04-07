"use client"

import * as React from "react"
import { Plus } from "lucide-react"

import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface Reaction {
  emoji: string
  count: number
  active?: boolean
}

const DEFAULT_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🎉", "🔥", "👏"]

function ReactionPicker({
  className,
  reactions,
  onReact,
  emojis = DEFAULT_EMOJIS,
  ...props
}: React.ComponentProps<"div"> & {
  reactions: Reaction[]
  onReact?: (emoji: string) => void
  emojis?: string[]
}) {
  return (
    <div
      data-slot="reaction-picker"
      className={cn("flex flex-wrap items-center gap-1.5", className)}
      {...props}
    >
      {reactions.map((reaction) => (
        <button
          key={reaction.emoji}
          onClick={() => onReact?.(reaction.emoji)}
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium transition-colors",
            reaction.active
              ? "border-primary/30 bg-primary/10 text-foreground"
              : "border-border bg-input/30 text-muted-foreground hover:bg-input/50"
          )}
        >
          <span>{reaction.emoji}</span>
          <span>{reaction.count}</span>
        </button>
      ))}
      <Popover>
        <PopoverTrigger asChild>
          <button className="inline-flex size-7 items-center justify-center rounded-full border border-border bg-input/30 text-muted-foreground transition-colors hover:bg-input/50 hover:text-foreground">
            <Plus className="size-3.5" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2">
          <div className="flex gap-1">
            {emojis.map((emoji) => (
              <button
                key={emoji}
                onClick={() => onReact?.(emoji)}
                className="flex size-8 items-center justify-center rounded-lg text-base transition-colors hover:bg-muted"
              >
                {emoji}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

export { ReactionPicker, type Reaction }
