"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

interface CodeTab {
  language: string
  code: string
}

function CodeTabs({
  tabs,
  className,
  ...props
}: {
  tabs: CodeTab[]
} & React.ComponentProps<"div">) {
  const [activeIndex, setActiveIndex] = React.useState(0)

  const activeTab = tabs[activeIndex]

  return (
    <div
      data-slot="code-tabs"
      className={cn("overflow-hidden rounded-xl border border-border bg-muted", className)}
      {...props}
    >
      <div className="flex border-b border-border bg-card" role="tablist">
        {tabs.map((tab, index) => (
          <button
            key={tab.language}
            type="button"
            role="tab"
            aria-selected={index === activeIndex}
            onClick={() => setActiveIndex(index)}
            className={cn(
              "px-4 py-2 text-xs font-medium transition-colors",
              index === activeIndex
                ? "border-b-2 border-[var(--color-cobalt)] text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.language}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="overflow-x-auto p-4">
        <pre className="font-mono text-sm leading-relaxed text-foreground">
          <code>{activeTab?.code}</code>
        </pre>
      </div>
    </div>
  )
}

export { CodeTabs, type CodeTab }
