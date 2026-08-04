"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type StoryTool = "text" | "draw" | "sticker" | "filter"

interface StoryCreatorProps extends React.ComponentProps<"div"> {
  /** Background source — image/video URL or solid color */
  backgroundUrl?: string
  backgroundColor?: string
  /** Active tool */
  activeTool?: StoryTool
  onToolChange?: (tool: StoryTool) => void
  /** Called when user posts the story */
  onPost?: () => void
  /** Called when user discards */
  onDiscard?: () => void
}

const tools: { key: StoryTool; label: string; icon: string }[] = [
  { key: "text", label: "Text", icon: "Aa" },
  { key: "draw", label: "Draw", icon: "✎" },
  { key: "sticker", label: "Sticker", icon: "☺" },
  { key: "filter", label: "Filter", icon: "◐" },
]

function StoryCreator({
  backgroundUrl,
  backgroundColor = "#1A1A1A",
  activeTool,
  onToolChange,
  onPost,
  onDiscard,
  className,
  ...props
}: StoryCreatorProps) {
  return (
    <div
      data-slot="story-creator"
      data-portal="https://mzizi.dev/components/story-creator"
      className={cn(
        "relative flex flex-col overflow-hidden rounded-[var(--radius-xl,17px)]",
        className
      )}
      style={{ aspectRatio: "9/16", backgroundColor }}
      {...props}
    >
      {/* Background */}
      {backgroundUrl && (
        <div className="absolute inset-0">
          <img src={backgroundUrl} alt="" className="size-full object-cover" />
        </div>
      )}

      {/* Gradient overlays for controls visibility */}
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/50 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/60 to-transparent" />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between p-4">
        {onDiscard && (
          <button
            onClick={onDiscard}
            className="flex size-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm"
            aria-label="Discard"
          >
            ×
          </button>
        )}
        <div className="flex gap-2">
          {tools.map((tool) => (
            <button
              key={tool.key}
              onClick={() => onToolChange?.(tool.key)}
              aria-pressed={activeTool === tool.key}
              aria-label={tool.label}
              className={cn(
                "flex size-10 items-center justify-center rounded-full text-sm font-medium text-white transition-colors",
                activeTool === tool.key ? "bg-white/30" : "bg-white/10 hover:bg-white/20"
              )}
            >
              {tool.icon}
            </button>
          ))}
        </div>
      </div>

      {/* Canvas area — text/stickers render here via children */}
      <div className="relative z-10 flex-1" />

      {/* Bottom bar */}
      <div className="relative z-10 flex items-center justify-between p-4">
        <div className="text-xs text-white/60">24h story</div>
        {onPost && (
          <button
            onClick={onPost}
            className="h-12 rounded-full bg-[var(--color-malachite,#64FFDA)] px-6 text-sm font-bold text-[var(--primary-foreground,#0A0A0A)] shadow-lg"
          >
            Post Story →
          </button>
        )}
      </div>
    </div>
  )
}

export { StoryCreator }
export type { StoryCreatorProps }
