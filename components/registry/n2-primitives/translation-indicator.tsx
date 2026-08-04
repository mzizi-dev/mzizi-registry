import * as React from "react"
import { cn } from "@/lib/utils"

type TranslationStatus = "original" | "machine" | "community" | "verified"

interface TranslationIndicatorProps extends React.ComponentProps<"span"> {
  /** Current language code (e.g., "sn", "nd", "en") */
  language: string
  /** Translation status */
  status?: TranslationStatus
  /** Language display name */
  languageName?: string
}

const statusLabels: Record<TranslationStatus, string> = {
  original: "Original",
  machine: "Auto-translated",
  community: "Community translated",
  verified: "Verified translation",
}

const statusColors: Record<TranslationStatus, string> = {
  original: "text-muted-foreground",
  machine: "text-[var(--color-cobalt,#00B0FF)]",
  community: "text-[var(--color-gold,#FFD740)]",
  verified: "text-[var(--color-malachite,#64FFDA)]",
}

function TranslationIndicator({
  language,
  status = "original",
  languageName,
  className,
  ...props
}: TranslationIndicatorProps) {
  return (
    <span
      data-slot="translation-indicator"
      data-portal="https://mzizi.dev/components/translation-indicator"
      role="article"
      className={cn("inline-flex items-center gap-1 text-xs", statusColors[status], className)}
      title={`${languageName || language} · ${statusLabels[status]}`}
      {...props}
    >
      <span className="font-mono text-[10px] uppercase">{language}</span>
      {status !== "original" && <span className="text-[10px]">· {statusLabels[status]}</span>}
    </span>
  )
}

export { TranslationIndicator }
export type { TranslationIndicatorProps, TranslationStatus }
