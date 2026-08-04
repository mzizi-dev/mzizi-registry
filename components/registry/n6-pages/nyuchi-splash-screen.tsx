"use client"
import * as React from "react"
import { cn } from "@/lib/utils"

interface NyuchiSplashScreenProps {
  progress?: number
  message?: string
  showLogo?: boolean
  className?: string
}

export function NyuchiSplashScreen({
  progress,
  message,
  showLogo = true,
  className,
}: NyuchiSplashScreenProps) {
  return (
    <div
      data-slot="nyuchi-splash-screen"
      data-portal="https://mzizi.dev/components/nyuchi-splash-screen"
      role="status"
      aria-label={message || "Loading Mukoko"}
      className={cn(
        "flex min-h-screen flex-col items-center justify-center gap-6 bg-background",
        className
      )}
    >
      {showLogo && (
        <div className="animate-pulse">
          <p className="text-3xl font-bold tracking-tight text-foreground">mukoko</p>
        </div>
      )}
      <div className="flex flex-col items-center gap-3">
        {progress != null && (
          <div className="h-1 w-48 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
        {message && <p className="text-xs text-muted-foreground">{message}</p>}
      </div>
    </div>
  )
}

export type { NyuchiSplashScreenProps }
