"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface ParagraphComment {
  id: string
  authorName: string
  authorAvatar?: string
  text: string
  createdAt: string
}

interface CommentOnParagraphProps extends Omit<React.ComponentProps<"div">, "onSubmit"> {
  /** The highlighted text this comment is anchored to */
  highlightedText: string
  /** Existing comments on this paragraph */
  comments?: ParagraphComment[]
  /** Called when a new comment is submitted */
  onSubmit?: (text: string) => void
  /** Whether the popover is open */
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

function CommentOnParagraph({
  highlightedText,
  comments = [],
  onSubmit,
  open = false,
  onOpenChange,
  className,
  ...props
}: CommentOnParagraphProps) {
  const [draft, setDraft] = React.useState("")

  const handleSubmit = () => {
    if (!draft.trim()) return
    onSubmit?.(draft.trim())
    setDraft("")
  }

  if (!open) {
    return (
      <button
        data-slot="comment-on-paragraph"
        data-portal="https://mzizi.dev/components/comment-on-paragraph"
        onClick={() => onOpenChange?.(true)}
        className={cn(
          "inline-flex size-6 items-center justify-center rounded-full bg-[var(--color-cobalt,#00B0FF)]/15 text-[10px] font-bold text-[var(--color-cobalt,#00B0FF)] transition-colors hover:bg-[var(--color-cobalt,#00B0FF)]/25",
          className
        )}
        aria-label={`${comments.length} comment${comments.length !== 1 ? "s" : ""} on this passage`}
      >
        {comments.length || "+"}
      </button>
    )
  }

  return (
    <div
      data-slot="comment-on-paragraph"
      className={cn(
        "w-72 rounded-[var(--radius-lg,14px)] border border-border bg-card p-3 shadow-lg",
        className
      )}
      {...props}
    >
      {/* Highlighted text reference */}
      <div className="mb-2 line-clamp-2 border-l-2 border-[var(--color-cobalt,#00B0FF)] pl-2 text-xs text-muted-foreground italic">
        "{highlightedText}"
      </div>

      {/* Existing comments */}
      {comments.length > 0 && (
        <div className="mb-3 max-h-40 space-y-2 overflow-y-auto">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-2">
              <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-[8px] font-medium">
                {c.authorAvatar ? (
                  <img
                    src={c.authorAvatar}
                    alt=""
                    className="size-full rounded-full object-cover"
                  />
                ) : (
                  c.authorName.charAt(0)
                )}
              </div>
              <div>
                <div className="text-[10px]">
                  <span className="font-medium">{c.authorName}</span>{" "}
                  <span className="text-muted-foreground">· {c.createdAt}</span>
                </div>
                <div className="text-xs">{c.text}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New comment input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="Add a comment…"
          className="h-8 flex-1 rounded-full border border-input bg-input/30 px-3 text-xs outline-none focus:border-ring"
        />
        <button
          onClick={handleSubmit}
          disabled={!draft.trim()}
          className="h-8 shrink-0 rounded-full bg-primary px-3 text-[10px] font-medium text-primary-foreground disabled:opacity-50"
        >
          Post
        </button>
      </div>

      {/* Close */}
      <button
        onClick={() => onOpenChange?.(false)}
        className="absolute -top-2 -right-2 flex size-5 items-center justify-center rounded-full bg-muted text-[10px] text-muted-foreground shadow hover:text-foreground"
      >
        ×
      </button>
    </div>
  )
}

export { CommentOnParagraph }
export type { CommentOnParagraphProps }
