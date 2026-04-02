"use client"

import * as React from "react"
import { XIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  className?: string
}

function BottomSheet({ open, onClose, title, children, className }: BottomSheetProps) {
  const sheetRef = React.useRef<HTMLDivElement>(null)
  const startY = React.useRef(0)

  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  function handleTouchStart(e: React.TouchEvent) {
    startY.current = e.touches[0].clientY
  }

  function handleTouchEnd(e: React.TouchEvent) {
    const deltaY = e.changedTouches[0].clientY - startY.current
    if (deltaY > 80) onClose()
  }

  if (!open) return null

  return (
    <div data-slot="bottom-sheet" className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/50 animate-in fade-in-0 duration-200"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal
        aria-label={title ?? "Bottom sheet"}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={cn(
          "absolute inset-x-0 bottom-0 flex max-h-[85vh] flex-col rounded-t-2xl bg-card shadow-2xl ring-1 ring-foreground/5 animate-in slide-in-from-bottom duration-300",
          className
        )}
      >
        <div className="flex items-center justify-center py-3">
          <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
        </div>
        {title && (
          <div className="flex items-center justify-between border-b border-border px-4 pb-3">
            <h2 className="font-serif text-base font-medium">{title}</h2>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onClose}
              aria-label="Close"
            >
              <XIcon />
            </Button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  )
}

export { BottomSheet }
export type { BottomSheetProps }
