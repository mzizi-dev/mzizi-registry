"use client"
import * as React from "react"
import { cn } from "@/lib/utils"
import { useNyuchiHarness } from "@/lib/harness"

interface NyuchiUpdatePromptProps {
  visible?: boolean
  version?: string
  isCritical?: boolean
  onUpdate?: () => void
  onDismiss?: () => void
  className?: string
}

export function NyuchiUpdatePrompt({
  visible = false,
  version,
  isCritical = false,
  onUpdate,
  onDismiss,
  className,
}: NyuchiUpdatePromptProps) {
  const { log, motion } = useNyuchiHarness("update-prompt")
  const animStyle = React.useMemo(
    () =>
      motion.prefersReduced
        ? {}
        : {
            animation: `nyuchi-fade-slide-up ${motion.enterDuration}ms ${motion.enterEasing} both`,
          },
    [motion]
  )

  React.useEffect(() => {
    if (visible) log.info(`update_prompt: v${version} critical=${isCritical}`)
  }, [visible, version, isCritical, log])

  if (!visible) return null

  return (
    <div
      data-slot="nyuchi-update-prompt"
      data-portal="https://mzizi.dev/components/nyuchi-update-prompt"
      role="alertdialog"
      aria-label="Update available"
      style={animStyle}
      className={cn(
        "fixed right-4 bottom-20 left-4 z-50 mx-auto max-w-sm rounded-[var(--radius-xl,17px)] border border-border bg-card p-4 shadow-2xl",
        className
      )}
    >
      <p className="text-sm font-semibold">
        {isCritical ? "Critical update required" : "Update available"}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        {version ? `Version ${version} is ready.` : "A new version is ready."}{" "}
        {isCritical
          ? "This update is required to continue."
          : "Refresh to get the latest improvements."}
      </p>
      <div className="mt-3 flex gap-2">
        <button
          onClick={onUpdate}
          className="min-h-[48px] flex-1 rounded-full bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Update
        </button>
        {!isCritical && onDismiss && (
          <button
            onClick={onDismiss}
            className="min-h-[48px] rounded-full bg-muted px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted/80"
          >
            Later
          </button>
        )}
      </div>
    </div>
  )
}

export type { NyuchiUpdatePromptProps }
