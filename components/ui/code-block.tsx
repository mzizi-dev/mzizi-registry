"use client"

import * as React from "react"
import { FileCode } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { CopyButton } from "@/components/ui/copy-button"

interface CodeBlockProps extends React.ComponentProps<"div"> {
  code: string
  language?: string
  filename?: string
  showLineNumbers?: boolean
}

function CodeBlock({
  className,
  code,
  language = "text",
  filename,
  showLineNumbers = true,
  ...props
}: CodeBlockProps) {
  const lines = code.replace(/\n$/, "").split("\n")
  const lineNumberWidth = String(lines.length).length

  return (
    <div
      data-slot="code-block"
      className={cn("overflow-hidden rounded-xl border border-border bg-muted/50", className)}
      {...props}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-muted/80 px-4 py-2">
        <div className="flex items-center gap-2">
          {filename && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <FileCode className="size-3.5" />
              <span className="font-mono text-xs">{filename}</span>
            </div>
          )}
          {!filename && (
            <Badge variant="secondary" className="font-mono text-[10px] uppercase">
              {language}
            </Badge>
          )}
          {filename && (
            <Badge variant="secondary" className="font-mono text-[10px] uppercase">
              {language}
            </Badge>
          )}
        </div>
        <CopyButton value={code} variant="ghost" size="icon" iconOnly className="size-6" />
      </div>

      {/* Code content */}
      <div className="overflow-x-auto">
        <pre className="p-4 font-mono text-sm leading-6">
          <code>
            {lines.map((line, index) => (
              <div key={index} className="flex">
                {showLineNumbers && (
                  <span
                    className="mr-4 inline-block shrink-0 text-right text-muted-foreground/50 select-none"
                    style={{ width: `${lineNumberWidth}ch` }}
                  >
                    {index + 1}
                  </span>
                )}
                <span className="flex-1 break-all whitespace-pre-wrap">{line || "\n"}</span>
              </div>
            ))}
          </code>
        </pre>
      </div>
    </div>
  )
}

export { CodeBlock }
export type { CodeBlockProps }
