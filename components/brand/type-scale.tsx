import { cn } from "@/lib/utils"
import { TYPE_SCALE } from "@/lib/brand"

interface TypeScaleProps {
  className?: string
}

const fontClassMap: Record<string, string> = {
  sans: "font-sans",
  serif: "font-serif",
  mono: "font-mono",
}

export function TypeScale({ className }: TypeScaleProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {TYPE_SCALE.map((entry) => (
        <div key={entry.name} className="group flex flex-col gap-1 border-b border-border pb-6 last:border-0">
          <div className="flex items-baseline justify-between gap-4">
            <p
              className={cn(
                "truncate text-foreground",
                fontClassMap[entry.font]
              )}
              style={{
                fontSize: entry.sizeRem,
                lineHeight: entry.lineHeight,
                fontWeight: entry.weight,
              }}
            >
              {entry.name}
            </p>
            <span className="shrink-0 font-mono text-xs text-muted-foreground">
              {entry.sizePx}px / {entry.sizeRem}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="rounded-md bg-muted px-1.5 py-0.5 font-mono">
              {entry.font === "sans" ? "Noto Sans" : entry.font === "serif" ? "Noto Serif" : "JetBrains Mono"}
            </span>
            <span>Weight {entry.weight}</span>
            <span className="hidden sm:inline">·</span>
            <span className="hidden sm:inline">{entry.usage}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
