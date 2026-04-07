import * as React from "react"
import { GripVertical } from "lucide-react"

import { cn } from "@/lib/utils"

function DragHandle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drag-handle"
      aria-hidden="true"
      className={cn(
        "flex cursor-grab items-center justify-center text-muted-foreground transition-colors hover:text-foreground active:cursor-grabbing",
        className
      )}
      {...props}
    >
      <GripVertical className="size-4" />
    </div>
  )
}

export { DragHandle }
