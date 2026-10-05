"use client"

import * as React from "react"

/**
 * Toaster — the registry primitive (`contracts/ui/toaster`): a polite live region, and
 * `toast(message, kind?)` to show a message in it for `duration` ms. The same markup and
 * behaviour as `toaster.astro`, whose inline script defines `window.toast`; this build also
 * sets `window.toast` once mounted, so code written for either build works in both. Astro is
 * the default web UI; this is the build for React apps.
 *
 * A toast is text, never HTML. `kind === "error"` gives it a `--destructive` border. Each
 * leaves after the region's `data-duration` (5000ms if unset). For a message a reader must
 * not miss, use `app-toast`, which never times out.
 */

type ToastKind = "error" | (string & {})

declare global {
  interface Window {
    toast?: (message: string, kind?: ToastKind) => void
  }
}

const TOAST =
  "pointer-events-auto max-w-sm rounded-[14px] border bg-card px-4 py-3 text-body-sm text-foreground shadow-lg "

/** Show `message` in the page's Toaster. Does nothing when no Toaster is rendered. */
function toast(message: string, kind?: ToastKind) {
  const host = document.getElementById("toaster")
  if (!host) return
  const el = document.createElement("div")
  el.setAttribute("data-slot", "toast")
  el.className = TOAST + (kind === "error" ? "border-destructive" : "border-border")
  el.textContent = message
  host.appendChild(el)
  setTimeout(() => el.remove(), Number(host.getAttribute("data-duration")) || 5000)
}

interface ToasterProps {
  /** How long each toast stays, in milliseconds. */
  duration?: number
}

function Toaster({ duration = 5000 }: ToasterProps) {
  React.useEffect(() => {
    window.toast = toast
  }, [])
  return (
    <div
      id="toaster"
      data-slot="toaster"
      data-duration={duration}
      className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-center gap-2 sm:inset-x-auto sm:right-6 sm:items-end"
      role="status"
      aria-live="polite"
    />
  )
}

export { Toaster, toast }
export type { ToasterProps, ToastKind }
