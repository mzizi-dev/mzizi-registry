import * as React from "react"

import { cn } from "@/lib/utils"

function StickyBar({
  children,
  position = "top",
  className,
  ...props
}: {
  children: React.ReactNode
  position?: "top" | "bottom"
} & React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sticky-bar"
      data-position={position}
      className={cn(
        "sticky z-40 border-border bg-background/80 backdrop-blur-lg",
        position === "top" ? "top-0 border-b" : "bottom-0 border-t",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export { StickyBar }
