"use client"

import * as React from "react"
import { XIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

function TagInput({
  className,
  tags,
  onTagsChange,
  placeholder = "Add a tag...",
  maxTags,
  ...props
}: Omit<React.ComponentProps<"div">, "onChange"> & {
  tags: string[]
  onTagsChange: (tags: string[]) => void
  placeholder?: string
  maxTags?: number
}) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [inputValue, setInputValue] = React.useState("")

  const addTag = (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) return
    if (tags.includes(trimmed)) return
    if (maxTags && tags.length >= maxTags) return
    onTagsChange([...tags, trimmed])
    setInputValue("")
  }

  const removeTag = (index: number) => {
    onTagsChange(tags.filter((_, i) => i !== index))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      addTag(inputValue)
    }
    if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      removeTag(tags.length - 1)
    }
  }

  const handleContainerClick = () => {
    inputRef.current?.focus()
  }

  return (
    <div
      data-slot="tag-input"
      onClick={handleContainerClick}
      className={cn(
        "border-input bg-input/30 focus-within:border-ring focus-within:ring-ring/50",
        "flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded-4xl border px-3 py-1.5 transition-colors",
        "focus-within:ring-[3px]",
        className
      )}
      {...props}
    >
      {tags.map((tag, index) => (
        <Badge key={`${tag}-${index}`} variant="secondary" className="gap-1 pr-1">
          {tag}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              removeTag(index)
            }}
            className="inline-flex size-4 items-center justify-center rounded-full transition-colors hover:bg-foreground/10"
            aria-label={`Remove ${tag}`}
          >
            <XIcon className="size-3" />
          </button>
        </Badge>
      ))}
      <input
        ref={inputRef}
        data-slot="tag-input-field"
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => addTag(inputValue)}
        placeholder={tags.length === 0 ? placeholder : ""}
        disabled={maxTags ? tags.length >= maxTags : false}
        className={cn(
          "min-w-20 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground",
          "disabled:cursor-not-allowed disabled:opacity-50"
        )}
      />
    </div>
  )
}

export { TagInput }
