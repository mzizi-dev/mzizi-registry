"use client"

import * as React from "react"
import DOMPurify from "dompurify"
import {
  BoldIcon,
  ItalicIcon,
  Heading2Icon,
  ListIcon,
  ListOrderedIcon,
  LinkIcon,
} from "@/lib/icons"
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
      // `value` is a controlled HTML string. It round-trips through the editor,
      // so on a collaborative or draft-restoring surface it is whatever the
      // last author — not necessarily this user — put in it. Assigning it to
      // `innerHTML` raw made that a stored-XSS sink. The allow-list matches
      // what the toolbar can actually produce (bold/italic/underline, headings,
      // lists, links); anything the editor cannot create has no business
      // arriving through its value either.
      editorRef.current.innerHTML = DOMPurify.sanitize(value, {
        ALLOWED_TAGS: [
          "p",
          "br",
          "div",
          "span",
          "b",
          "strong",
          "i",
          "em",
          "u",
          "s",
          "h1",
          "h2",
          "h3",
          "h4",
          "h5",
          "h6",
          "ul",
          "ol",
          "li",
          "blockquote",
          "a",
        ],
        ALLOWED_ATTR: ["href", "title"],
        // Drop javascript:, data: and every other scheme that is not a document.
        ALLOWED_URI_REGEXP: /^(?:https?|mailto|tel|#|\/|\.)/i,
      })
    }
  }, [value])

  function execCommand(action: string) {
    if (action.startsWith("formatBlock:")) {
      document.execCommand("formatBlock", false, action.split(":")[1])
    } else if (action === "createLink") {
      const url = window.prompt("Enter URL:")
      // A typed `javascript:` URL becomes an anchor in the document, which then
      // rides out through `value` to every later reader of this content. The
      // sanitiser on the way back in would strip it, so accepting it here would
      // only produce a link that silently disappears on reload — refuse it at
      // the point the author can still fix it.
      if (url && /^(?:https?:|mailto:|tel:|#|\/|\.)/i.test(url.trim())) {
        document.execCommand("createLink", false, url.trim())
      }
    } else {
      document.execCommand(action, false)
    }
    editorRef.current?.focus()
  }

  return (
    <div
      data-slot="rich-text-editor"
      data-portal="https://mzizi.dev/components/rich-text-editor"
      className={cn(
        "rounded-[var(--radius-xl,17px)] border border-input bg-input/30 transition-colors focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50",
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
            size="icon-sm"
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
