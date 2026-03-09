import { cn } from "@/lib/utils"
import { SPACING_SCALE } from "@/lib/brand"

interface SpacingScaleProps {
  className?: string
}

export function SpacingScale({ className }: SpacingScaleProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {SPACING_SCALE.map((token) => (
        <div key={token.name} className="flex items-center gap-4">
          <span className="w-12 shrink-0 font-mono text-xs text-muted-foreground">
            {token.name}
          </span>
          <div
            className="h-6 rounded-md bg-[var(--color-tanzanite)]"
            style={{ width: `${token.px}px`, minWidth: "4px" }}
          />
          <span className="shrink-0 font-mono text-xs text-muted-foreground">
            {token.px}px
          </span>
          <span className="hidden text-xs text-muted-foreground sm:inline">
            {token.usage}
          </span>
        </div>
      ))}
    </div>
  )
}
