"use client"

import * as React from "react"
import {
  BoldIcon,
  ItalicIcon,
  Heading2Icon,
  ListIcon,
  ListOrderedIcon,
  LinkIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface RichTextEditorProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
}

const TOOLBAR_ACTIONS = [
  { command: "bold", icon: BoldIcon, label: "Bold" },
  { command: "italic", icon: ItalicIcon, label: "Italic" },
  { command: "formatBlock:h2", icon: Heading2Icon, label: "Heading" },
  { command: "insertUnorderedList", icon: ListIcon, label: "Bullet list" },
  { command: "insertOrderedList", icon: ListOrderedIcon, label: "Numbered list" },
  { command: "createLink", icon: LinkIcon, label: "Link" },
] as const

function RichTextEditor({
  value,
  onChange,
  placeholder = "Start typing...",
  className,
}: RichTextEditorProps) {
  const editorRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (editorRef.current && value !== undefined && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value
    }
  }, [value])

  function execCommand(action: string) {
    if (action.startsWith("formatBlock:")) {
      document.execCommand("formatBlock", false, action.split(":")[1])
    } else if (action === "createLink") {
      const url = window.prompt("Enter URL:")
      if (url) document.execCommand("createLink", false, url)
    } else {
      document.execCommand(action, false)
    }
    editorRef.current?.focus()
  }

  return (
    <div
      data-slot="rich-text-editor"
      className={cn(
        "border-input bg-input/30 rounded-xl border transition-colors focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]",
        className
      )}
    >
      <div
        data-slot="rich-text-editor-toolbar"
        className="flex flex-wrap gap-0.5 border-b border-border px-2 py-1.5"
      >
        {TOOLBAR_ACTIONS.map(({ command, icon: Icon, label }) => (
          <Button
            key={command}
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label={label}
            onMouseDown={(e) => {
              e.preventDefault()
              execCommand(command)
            }}
          >
            <Icon />
          </Button>
        ))}
      </div>
      <div
        ref={editorRef}
        contentEditable
        role="textbox"
        aria-multiline
        aria-placeholder={placeholder}
        data-placeholder={placeholder}
        className="min-h-32 px-3 py-2 text-sm outline-none empty:before:pointer-events-none empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)]"
        onInput={() => {
          onChange?.(editorRef.current?.innerHTML ?? "")
        }}
      />
    </div>
  )
}

export { RichTextEditor }
export type { RichTextEditorProps }
