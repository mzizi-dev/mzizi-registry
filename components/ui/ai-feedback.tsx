"use client"

import * as React from "react"
import { ThumbsUp, ThumbsDown } from "lucide-react"

import { cn } from "@/lib/utils"

type FeedbackValue = "positive" | "negative" | null

function AiFeedback({
  className,
  value,
  onFeedback,
  showTextInput = false,
  onTextFeedback,
  ...props
}: React.ComponentProps<"div"> & {
  value?: FeedbackValue
  onFeedback?: (value: FeedbackValue) => void
  showTextInput?: boolean
  onTextFeedback?: (text: string) => void
}) {
  const [text, setText] = React.useState("")

  const handleFeedback = (type: "positive" | "negative") => {
    onFeedback?.(value === type ? null : type)
  }

  return (
    <div
      data-slot="ai-feedback"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    >
      <div className="flex items-center gap-1">
        <button
          onClick={() => handleFeedback("positive")}
          aria-label="Helpful"
          aria-pressed={value === "positive"}
          className={cn(
            "inline-flex size-8 items-center justify-center rounded-lg transition-colors",
            value === "positive"
              ? "bg-mineral-malachite/15 text-mineral-malachite"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <ThumbsUp className="size-4" />
        </button>
        <button
          onClick={() => handleFeedback("negative")}
          aria-label="Not helpful"
          aria-pressed={value === "negative"}
          className={cn(
            "inline-flex size-8 items-center justify-center rounded-lg transition-colors",
            value === "negative"
              ? "bg-destructive/10 text-destructive"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <ThumbsDown className="size-4" />
        </button>
      </div>
      {showTextInput && value && (
        <div className="flex gap-2">
          <textarea
            data-slot="ai-feedback-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Tell us more..."
            className="border-input bg-input/30 placeholder:text-muted-foreground min-h-16 w-full resize-none rounded-xl border px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
          />
          <button
            onClick={() => { onTextFeedback?.(text); setText("") }}
            className="self-end rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/80 transition-colors"
          >
            Send
          </button>
        </div>
      )}
    </div>
  )
}

export { AiFeedback, type FeedbackValue }
