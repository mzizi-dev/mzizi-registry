"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface NoteEditorProps extends Omit<React.ComponentProps<"div">, "autoSave"> {
  title?: string
  onTitleChange?: (title: string) => void
  content?: string
  onContentChange?: (content: string) => void
  tags?: string[]
  onTagsChange?: (tags: string[]) => void
  autoSave?: boolean
  lastSaved?: string
  placeholder?: string
}

function NoteEditor({
  title = "",
  onTitleChange,
  content = "",
  onContentChange,
  tags = [],
  onTagsChange,
  autoSave = true,
  lastSaved,
  placeholder = "Start writing…",
  className,
  ...props
}: NoteEditorProps) {
  const [tagInput, setTagInput] = React.useState("")

  const addTag = () => {
    const trimmed = tagInput.trim()
    if (trimmed && !tags.includes(trimmed)) {
      onTagsChange?.([...tags, trimmed])
    }
    setTagInput("")
  }

  const removeTag = (tag: string) => {
    onTagsChange?.(tags.filter((t) => t !== tag))
  }

  return (
    <div
      data-slot="note-editor"
      data-portal="https://mzizi.dev/components/note-editor"
      className={cn(
        "flex flex-col rounded-[var(--radius-xl,17px)] border border-border bg-card",
        className
      )}
      {...props}
    >
      {/* Title */}
      <input
        type="text"
        value={title}
        onChange={(e) => onTitleChange?.(e.target.value)}
        placeholder="Note title"
        className="border-b border-border bg-transparent px-5 py-4 text-lg font-semibold outline-none placeholder:text-muted-foreground"
        style={{ fontFamily: "var(--font-serif, serif)" }}
      />

      {/* Content */}
      <textarea
        value={content}
        onChange={(e) => onContentChange?.(e.target.value)}
        placeholder={placeholder}
        className="min-h-[200px] flex-1 resize-none bg-transparent px-5 py-4 text-sm leading-relaxed outline-none placeholder:text-muted-foreground"
      />

      {/* Tags + status bar */}
      <div className="flex items-center gap-2 border-t border-border px-4 py-2">
        <div className="flex flex-1 flex-wrap items-center gap-1">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium"
            >
              {tag}
              <button
                onClick={() => removeTag(tag)}
                className="text-muted-foreground transition-colors hover:text-foreground"
                aria-label={`Remove tag ${tag}`}
              >
                ×
              </button>
            </span>
          ))}
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                addTag()
              }
            }}
            placeholder={tags.length === 0 ? "Add tags…" : "+"}
            className="h-6 w-16 bg-transparent text-[10px] outline-none placeholder:text-muted-foreground"
          />
        </div>
        {autoSave && (
          <span className="text-[9px] text-muted-foreground">
            {lastSaved ? `Saved ${lastSaved}` : "Auto-save on"}
          </span>
        )}
      </div>
    </div>
  )
}

export { NoteEditor }
export type { NoteEditorProps }
