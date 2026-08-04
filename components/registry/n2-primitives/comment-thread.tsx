"use client"

import * as React from "react"
import { MessageSquare } from "@/lib/icons"

import { cn } from "@/lib/utils"

interface Comment {
  id: string
  author: string
  avatar?: string
  content: string
  timestamp: string
  replies?: Comment[]
}

function CommentNode({
  loading = false,
  comment,
  depth = 0,
  onReply,
}: {
  /** Render the skeleton instead of the content. */
  loading?: boolean
  comment: Comment
  depth?: number
  onReply?: (parentId: string) => void
}) {
  if (loading)
    return (
      <div data-loading className="animate-pulse space-y-3 p-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={`flex ${i % 2 === 0 ? "" : "justify-end"}`}>
            <div className={`rounded-2xl bg-muted ${i % 2 === 0 ? "w-2/3" : "w-1/2"} h-10`} />
          </div>
        ))}
      </div>
    )

  return (
    <div
      data-slot="comment-node"
      data-portal="https://mzizi.dev/components/comment-node"
      className="flex flex-col"
    >
      <div className={cn("flex gap-3 py-3", depth > 0 && "ml-8 border-l-2 border-border pl-4")}>
        <div className="size-8 shrink-0 overflow-hidden rounded-full bg-muted">
          {comment.avatar ? (
            <img src={comment.avatar} alt={comment.author} className="size-full object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center text-xs font-medium text-muted-foreground">
              {comment.author[0]?.toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">{comment.author}</span>
            <span className="text-xs text-muted-foreground">{comment.timestamp}</span>
          </div>
          <p className="text-sm text-foreground/90">{comment.content}</p>
          {onReply && (
            <button
              type="button"
              onClick={() => onReply(comment.id)}
              className="mt-0.5 inline-flex items-center gap-1 self-start text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <MessageSquare className="size-3" />
              Reply
            </button>
          )}
        </div>
      </div>
      {comment.replies?.map((reply) => (
        <CommentNode key={reply.id} comment={reply} depth={depth + 1} onReply={onReply} />
      ))}
    </div>
  )
}

function CommentThread({
  loading = false,
  comments,
  onReply,
  className,
  ...props
}: {
  /** Render the skeleton instead of the thread. */
  loading?: boolean
  comments: Comment[]
  onReply?: (parentId: string) => void
} & React.ComponentProps<"div">) {
  if (loading)
    return (
      <div data-loading className="animate-pulse space-y-3 p-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={`flex ${i % 2 === 0 ? "" : "justify-end"}`}>
            <div className={`rounded-2xl bg-muted ${i % 2 === 0 ? "w-2/3" : "w-1/2"} h-10`} />
          </div>
        ))}
      </div>
    )

  return (
    <div
      data-slot="comment-thread"
      role="feed"
      aria-label="Comments"
      className={cn("flex flex-col divide-y divide-border", className)}
      {...props}
    >
      {comments.map((comment) => (
        <CommentNode key={comment.id} comment={comment} onReply={onReply} />
      ))}
    </div>
  )
}

export { CommentThread, type Comment }
