"use client"
import * as React from "react"
import { cn } from "@/lib/utils"
import { useNyuchiHarness } from "@/lib/harness"

interface ToastItem {
  id: string
  type?: "default" | "success" | "error" | "warning" | "info"
  title: string
  message?: string
  duration?: number
  action?: { label: string; onClick: () => void }
  dismissible?: boolean
}

interface NyuchiToastProviderProps {
  position?: "top-right" | "top-center" | "bottom-right" | "bottom-center"
  maxVisible?: number
  defaultDuration?: number
  children: React.ReactNode
}

const ToastContext = React.createContext<{
  addToast: (toast: Omit<ToastItem, "id">) => void
  removeToast: (id: string) => void
} | null>(null)

export function useToast() {
  const ctx = React.useContext(ToastContext)
  if (!ctx) throw new Error("useToast must be used within NyuchiToastProvider")
  return ctx
}

const POSITION_CLASSES = {
  "top-right": "top-4 right-4",
  "top-center": "top-4 left-1/2 -translate-x-1/2",
  "bottom-right": "bottom-20 right-4",
  "bottom-center": "bottom-20 left-1/2 -translate-x-1/2",
}

const TYPE_STYLES: Record<string, string> = {
  default: "border-border",
  success: "border-l-4 border-l-[var(--status-success,#64FFDA)]",
  error: "border-l-4 border-l-[var(--status-error,#FF5252)]",
  warning: "border-l-4 border-l-[var(--status-warning,#FFD740)]",
  info: "border-l-4 border-l-[var(--status-info,#00B0FF)]",
}

export function NyuchiToastProvider({
  position = "bottom-right",
  maxVisible = 3,
  defaultDuration = 5000,
  children,
}: NyuchiToastProviderProps) {
  const { log } = useNyuchiHarness("toast-provider")
  const [toasts, setToasts] = React.useState<ToastItem[]>([])

  const addToast = React.useCallback(
    (toast: Omit<ToastItem, "id">) => {
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2)
      const item: ToastItem = {
        id,
        duration: defaultDuration,
        dismissible: true,
        type: "default",
        ...toast,
      }
      setToasts((prev) => [...prev.slice(-(maxVisible - 1)), item])
      log.info(`toast: ${item.type} — ${item.title}`)
      if (item.duration && item.duration > 0) {
        setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), item.duration)
      }
    },
    [defaultDuration, maxVisible, log]
  )

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div
        data-slot="nyuchi-toast-provider"
        data-portal="https://mzizi.dev/components/nyuchi-toast-provider"
        aria-live="polite"
        aria-atomic="false"
        className={cn(
          "pointer-events-none fixed z-50 flex w-full max-w-sm flex-col gap-2",
          POSITION_CLASSES[position]
        )}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="alert"
            className={cn(
              "pointer-events-auto rounded-[var(--radius-lg,14px)] border bg-card p-4 shadow-lg",
              TYPE_STYLES[toast.type || "default"]
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium">{toast.title}</p>
                {toast.message && (
                  <p className="mt-0.5 text-xs text-muted-foreground">{toast.message}</p>
                )}
              </div>
              {toast.dismissible && (
                <button
                  onClick={() => removeToast(toast.id)}
                  aria-label="Dismiss"
                  className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            {toast.action && (
              <button
                onClick={toast.action.onClick}
                className="mt-2 text-xs font-medium text-primary hover:underline"
              >
                {toast.action.label}
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export type { ToastItem, NyuchiToastProviderProps }
