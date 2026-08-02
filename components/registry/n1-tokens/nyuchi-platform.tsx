"use client"

import * as React from "react"
import { Download, X, Copy, Check, Smartphone } from "@/lib/icons"
import { cn } from "@/lib/utils"

/* ═══════════════════════════════════════════════════════════════
   NYUCHI PLATFORM UTILITIES
   
   Makes every Nyuchi app feel native on every platform:
   - PWA install prompt with Nyuchi branding
   - Web Share API with branded fallback
   - Haptic feedback (degrade gracefully)
   - Platform detection (iOS/Android/web/PWA)
   ═══════════════════════════════════════════════════════════════ */

// ─── Platform Detection ────────────────────────────────────
export type Platform = "ios" | "android" | "web" | "pwa"

export function usePlatform(): Platform {
  const [platform, setPlatform] = React.useState<Platform>("web")
  React.useEffect(() => {
    const ua = navigator.userAgent.toLowerCase()
    // `navigator.standalone` is a non-standard iOS Safari flag and is absent
    // from lib.dom, so it needs a widened type rather than `any`.
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone
    if (standalone) setPlatform("pwa")
    else if (/iphone|ipad|ipod/.test(ua)) setPlatform("ios")
    else if (/android/.test(ua)) setPlatform("android")
    else setPlatform("web")
  }, [])
  return platform
}

// ─── Haptic Feedback ───────────────────────────────────────
export function useHaptics() {
  const vibrate = React.useCallback(
    (pattern: "light" | "medium" | "heavy" | "success" | "error") => {
      if (!("vibrate" in navigator)) return
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [40],
        success: [10, 50, 10],
        error: [30, 50, 30, 50, 30],
      }
      // Ignored deliberately: `vibrate` throws on some engines when called
      // without user activation, and haptics are an enhancement — never a reason
      // to fail the interaction that requested them.
      try {
        navigator.vibrate(patterns[pattern])
      } catch {
        /* haptics unavailable */
      }
    },
    []
  )
  return { vibrate, isSupported: typeof navigator !== "undefined" && "vibrate" in navigator }
}

// ─── PWA Install Prompt ────────────────────────────────────

/**
 * The `beforeinstallprompt` event, which is Chromium-only and therefore absent
 * from lib.dom — hence the local declaration rather than `any`. Only the two
 * members this component actually calls are declared; widening it further would
 * be inventing a spec that does not exist.
 */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
}
interface NyuchiInstallPromptProps {
  appName?: string
  description?: string
  onDismiss?: () => void
  className?: string
}

export function NyuchiInstallPrompt({
  appName = "Nyuchi",
  description = "Add to your home screen for the best experience",
  onDismiss,
  className,
}: NyuchiInstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = React.useState<BeforeInstallPromptEvent | null>(null)
  const [show, setShow] = React.useState(false)
  const platform = usePlatform()

  React.useEffect(() => {
    if (platform === "pwa") return
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShow(true)
    }
    window.addEventListener("beforeinstallprompt", handler)
    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [platform])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setDeferredPrompt(null)
    setShow(false)
  }

  const handleDismiss = () => {
    setShow(false)
    onDismiss?.()
  }

  if (!show) return null

  return (
    <div
      data-slot="nyuchi-install-prompt"
      data-portal="https://mzizi.dev/components/nyuchi-install-prompt"
      className={cn(
        "fixed inset-x-4 bottom-4 z-50 flex items-center gap-3 rounded-[var(--radius-card,14px)] bg-card p-4 shadow-lg ring-1 ring-foreground/10",
        className
      )}
    >
      <div className="flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-inner,7px)] bg-[var(--color-primary)]/10">
        <Smartphone className="size-6 text-[var(--color-primary)]" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-foreground">Install {appName}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
      <button
        onClick={handleInstall}
        className="flex h-9 items-center gap-1.5 rounded-full bg-[var(--color-primary)] px-4 text-xs font-semibold text-[var(--color-background)]"
      >
        <Download className="size-3.5" />
        Install
      </button>
      <button onClick={handleDismiss} className="p-1 text-muted-foreground">
        <X className="size-4" />
      </button>
    </div>
  )
}

// ─── Share Sheet ───────────────────────────────────────────
interface NyuchiShareSheetProps {
  title: string
  text?: string
  url: string
  onClose?: () => void
  className?: string
}

export function NyuchiShareSheet({ title, text, url, onClose, className }: NyuchiShareSheetProps) {
  const [copied, setCopied] = React.useState(false)
  const canNativeShare = typeof navigator !== "undefined" && !!navigator.share

  const handleNativeShare = async () => {
    // Ignored deliberately: dismissing the native share sheet rejects with
    // AbortError, which is a normal outcome, not a failure. `onClose` sits
    // after the await on purpose so a cancelled share does not close the sheet.
    try {
      await navigator.share({ title, text, url })
      onClose?.()
    } catch {
      /* share cancelled or unavailable */
    }
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (canNativeShare) {
    React.useEffect(() => {
      handleNativeShare()
    }, [])
    return null
  }

  return (
    <div
      data-slot="nyuchi-share-sheet"
      className={cn(
        "rounded-[var(--radius-card,14px)] bg-card p-5 ring-1 ring-foreground/10",
        className
      )}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-serif text-lg font-bold text-foreground">Share</h3>
        <button onClick={onClose} className="p-1 text-muted-foreground">
          <X className="size-5" />
        </button>
      </div>
      <div className="mb-4 rounded-[var(--radius-inner,7px)] bg-foreground/[0.04] px-3 py-2.5">
        <div className="text-sm font-medium text-foreground">{title}</div>
        <div className="mt-1 truncate text-xs text-muted-foreground">{url}</div>
      </div>
      <button
        onClick={handleCopy}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[var(--color-primary)] text-sm font-semibold text-[var(--color-background)]"
      >
        {copied ? (
          <>
            <Check className="size-4" />
            Copied!
          </>
        ) : (
          <>
            <Copy className="size-4" />
            Copy Link
          </>
        )}
      </button>
    </div>
  )
}

export type { NyuchiInstallPromptProps, NyuchiShareSheetProps }
