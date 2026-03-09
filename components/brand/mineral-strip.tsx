import { cn } from "@/lib/utils"
import { MINERALS } from "@/lib/brand"

interface MineralStripProps {
  orientation?: "vertical" | "horizontal"
  thickness?: number
  className?: string
}

export function MineralStrip({
  orientation = "vertical",
  thickness = 4,
  className,
}: MineralStripProps) {
  const isVertical = orientation === "vertical"

  return (
    <div
      data-slot="mineral-strip"
      className={cn(
        "flex overflow-hidden rounded-full",
        isVertical ? "flex-col" : "flex-row",
        className
      )}
      style={{
        [isVertical ? "width" : "height"]: `${thickness}px`,
      }}
      aria-hidden="true"
    >
      {MINERALS.map((mineral) => (
        <div
          key={mineral.name}
          className="flex-1"
          style={{ backgroundColor: `var(${mineral.cssVar})` }}
        />
      ))}
    </div>
  )
}
