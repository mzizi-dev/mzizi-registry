"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Moon, Sun } from "lucide-react"

interface ComponentPreviewProps {
  code: string
  children: React.ReactNode
  hasDemo?: boolean
}

export function ComponentPreview({
  code,
  children,
  hasDemo = true,
}: ComponentPreviewProps) {
  const [tab, setTab] = useState<"preview" | "code">(
    hasDemo ? "preview" : "code"
  )
  const [darkPreview, setDarkPreview] = useState(false)

  return (
    <div className="rounded-xl border border-border">
      <div className="flex items-center justify-between border-b border-border">
        <div className="flex">
          {hasDemo && (
            <button
              onClick={() => setTab("preview")}
              className={cn(
                "px-4 py-2.5 text-sm font-medium transition-colors",
                tab === "preview"
                  ? "border-b-2 border-foreground text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Preview
            </button>
          )}
          <button
            onClick={() => setTab("code")}
            className={cn(
              "px-4 py-2.5 text-sm font-medium transition-colors",
              tab === "code"
                ? "border-b-2 border-foreground text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Code
          </button>
        </div>
        {tab === "preview" && hasDemo && (
          <button
            onClick={() => setDarkPreview(!darkPreview)}
            className="mr-3 rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground"
            title={darkPreview ? "Switch to light preview" : "Switch to dark preview"}
          >
            {darkPreview ? (
              <Sun className="size-4" />
            ) : (
              <Moon className="size-4" />
            )}
          </button>
        )}
      </div>
      {tab === "preview" ? (
        <div
          className={cn(
            "flex min-h-[200px] items-center justify-center rounded-b-xl p-8 transition-colors",
            darkPreview ? "dark bg-[#0A0A0A] text-[#F5F5F4]" : "bg-background"
          )}
        >
          {children}
        </div>
      ) : (
        <div className="max-h-[600px] overflow-auto">
          <pre className="p-4 text-sm leading-relaxed">
            <code>{code}</code>
          </pre>
        </div>
      )}
    </div>
  )
}
