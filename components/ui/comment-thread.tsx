"use client"

import * as React from "react"
import { MessageSquare } from "lucide-react"

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
  comment,
  depth = 0,
  onReply,
}: {
  comment: Comment
  depth?: number
  onReply?: (parentId: string) => void
}) {
  return (
    <div data-slot="comment-node" className="flex flex-col">
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
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">{comment.author}</span>
            <span className="text-xs text-muted-foreground">{comment.timestamp}</span>
          </div>
          <p className="text-sm text-foreground/90">{comment.content}</p>
          {onReply && (
            <button
              type="button"
              onClick={() => onReply(comment.id)}
              className="inline-flex items-center gap-1 self-start text-xs text-muted-foreground hover:text-foreground transition-colors mt-0.5"
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
  comments,
  onReply,
  className,
  ...props
}: {
  comments: Comment[]
  onReply?: (parentId: string) => void
} & React.ComponentProps<"div">) {
  return (
    <div
      data-slot="comment-thread"
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
