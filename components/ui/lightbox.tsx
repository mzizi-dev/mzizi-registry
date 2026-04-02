"use client"

import * as React from "react"
import { X, ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"

interface LightboxImage {
  src: string
  alt: string
}

function Lightbox({
  className,
  images,
  initialIndex = 0,
  open,
  onClose,
  ...props
}: React.ComponentProps<"div"> & {
  images: LightboxImage[]
  initialIndex?: number
  open: boolean
  onClose: () => void
}) {
  const [index, setIndex] = React.useState(initialIndex)

  React.useEffect(() => {
    if (open) setIndex(initialIndex)
  }, [open, initialIndex])

  React.useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowLeft") setIndex((i) => (i > 0 ? i - 1 : i))
      if (e.key === "ArrowRight") setIndex((i) => (i < images.length - 1 ? i + 1 : i))
    }
    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [open, images.length, onClose])

  if (!open || images.length === 0) return null

  const current = images[index]

  return (
    <div
      data-slot="lightbox"
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm",
        className
      )}
      onClick={onClose}
      {...props}
    >
      <div
        className="relative flex max-h-[90vh] max-w-[90vw] items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={current.src}
          alt={current.alt}
          className="max-h-[85vh] max-w-full rounded-lg object-contain"
        />
      </div>
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-4 inline-flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
      >
        <X className="size-5" />
      </button>
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); setIndex((i) => (i > 0 ? i - 1 : i)) }}
            disabled={index === 0}
            aria-label="Previous"
            className="absolute left-4 top-1/2 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 disabled:opacity-30"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setIndex((i) => (i < images.length - 1 ? i + 1 : i)) }}
            disabled={index === images.length - 1}
            aria-label="Next"
            className="absolute right-4 top-1/2 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 disabled:opacity-30"
          >
            <ChevronRight className="size-5" />
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-sm text-white">
            {index + 1} / {images.length}
          </div>
        </>
      )}
    </div>
  )
}

export { Lightbox, type LightboxImage }
