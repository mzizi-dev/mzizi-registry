"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const variants = ["default", "secondary", "outline", "ghost", "destructive", "link"] as const
const sizes = ["xs", "sm", "default", "lg", "icon"] as const

type ButtonVariant = (typeof variants)[number]
type ButtonSize = (typeof sizes)[number]

export function ComponentPatternDemo() {
  const [selectedVariant, setSelectedVariant] = useState<ButtonVariant>("default")
  const [selectedSize, setSelectedSize] = useState<ButtonSize>("default")

  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-border bg-card p-4 sm:p-6">
      {/* Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:gap-8">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
            Variant
          </span>
          <div className="flex flex-wrap gap-1.5">
            {variants.map((v) => (
              <button
                key={v}
                onClick={() => setSelectedVariant(v)}
                className={cn(
                  "rounded-lg px-2.5 py-1 font-mono text-xs transition-colors",
                  selectedVariant === v
                    ? "bg-foreground text-background"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                )}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
            Size
          </span>
          <div className="flex flex-wrap gap-1.5">
            {sizes.map((s) => (
              <button
                key={s}
                onClick={() => setSelectedSize(s)}
                className={cn(
                  "rounded-lg px-2.5 py-1 font-mono text-xs transition-colors",
                  selectedSize === s
                    ? "bg-foreground text-background"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="flex min-h-[120px] items-center justify-center rounded-xl border border-border bg-secondary/30 p-6">
        <Button variant={selectedVariant} size={selectedSize}>
          {selectedSize === "icon" ? "M" : "mukoko button"}
        </Button>
      </div>

      {/* Rendered output */}
      <div className="flex flex-col gap-3">
        <span className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
          What gets rendered
        </span>
        <div className="overflow-x-auto rounded-xl border border-border bg-[#141413] p-4 dark:bg-[#0A0A0A]">
          <code className="font-mono text-[13px] leading-relaxed text-[#F5F5F4]">
            {`<button\n`}
            {`  data-slot="button"\n`}
            {`  data-variant="${selectedVariant}"\n`}
            {`  data-size="${selectedSize}"\n`}
            {`  className="...${selectedVariant === "default" ? "bg-primary text-primary-foreground" : selectedVariant === "outline" ? "border-border bg-input/30" : selectedVariant === "ghost" ? "hover:bg-muted" : selectedVariant === "destructive" ? "bg-destructive/10 text-destructive" : selectedVariant === "link" ? "text-primary underline-offset-4" : "bg-secondary text-secondary-foreground"}..."\n`}
            {`>\n`}
            {`  ${selectedSize === "icon" ? "M" : "mukoko button"}\n`}
            {`</button>`}
          </code>
        </div>
      </div>

      {/* Data attributes inspection */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
          Data attributes
        </span>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="font-mono text-xs">
            data-slot=&quot;button&quot;
          </Badge>
          <Badge variant="outline" className="font-mono text-xs">
            data-variant=&quot;{selectedVariant}&quot;
          </Badge>
          <Badge variant="outline" className="font-mono text-xs">
            data-size=&quot;{selectedSize}&quot;
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          These attributes are always present on the rendered element, enabling stable CSS targeting
          regardless of class name changes.
        </p>
      </div>
    </div>
  )
}
