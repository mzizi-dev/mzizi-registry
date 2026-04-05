import { cn } from "@/lib/utils"
import { SEED_MINERALS } from "@/lib/brand"

interface MineralStripProps {
  thickness?: number
  className?: string
}

export function MineralStrip({
  thickness = 4,
  className,
}: MineralStripProps) {
  return (
    <div
      data-slot="mineral-strip"
      className={cn(
        "flex flex-col overflow-hidden rounded-full",
        className
      )}
      style={{ width: `${thickness}px` }}
      aria-hidden="true"
    >
      {SEED_MINERALS.map((mineral) => (
        <div
          key={mineral.name}
          className="flex-1"
          style={{ backgroundColor: `var(${mineral.cssVar})` }}
        />
      ))}
    </div>
  )
}
