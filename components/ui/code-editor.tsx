"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface CodeEditorProps {
  value?: string
  onChange?: (value: string) => void
  language?: string
  placeholder?: string
  className?: string
}

function CodeEditor({
  value = "",
  onChange,
  language,
  placeholder = "// Enter code here...",
  className,
}: CodeEditorProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const lines = value ? value.split("\n") : [""]

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Tab") {
      e.preventDefault()
      const target = e.currentTarget
      const start = target.selectionStart
      const end = target.selectionEnd
      const newValue = value.slice(0, start) + "  " + value.slice(end)
      onChange?.(newValue)
      requestAnimationFrame(() => {
        target.selectionStart = target.selectionEnd = start + 2
      })
    }
  }

  return (
    <div
      data-slot="code-editor"
      data-language={language}
      className={cn(
        "overflow-hidden rounded-xl border border-input bg-input/30 font-mono text-sm transition-colors focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50",
        className
      )}
    >
      {language && (
        <div className="border-b border-border px-3 py-1 text-xs text-muted-foreground">
          {language}
        </div>
      )}
      <div className="flex">
        <div
          aria-hidden
          className="border-r border-border bg-muted/50 px-3 py-3 text-right text-xs leading-6 text-muted-foreground select-none"
        >
          {lines.map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          spellCheck={false}
          className="min-h-40 flex-1 resize-none bg-transparent px-3 py-3 leading-6 outline-none placeholder:text-muted-foreground"
        />
      </div>
    </div>
  )
}

export { CodeEditor }
export type { CodeEditorProps }
