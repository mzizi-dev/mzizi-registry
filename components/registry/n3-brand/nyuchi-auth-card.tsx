"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { useNyuchiHarness } from "@/lib/harness"

/* ═══════════════════════════════════════════════════════════════
   NYUCHI AUTH CARD — Agentic Component (Inline, No Browser)

   Renders sign-in AND registration inline inside an AI surface
   (Claude, Claude Code, any MCP client) — never a browser tab.
   Drives the MCP inline-auth handoff (OAuth 2.1 / DCR / elicitation).
   Dynamic mineral accent via --brand-accent.

   ✅ HARNESS  ✅ TOKENS  ✅ A11Y  ✅ TOUCH 48px+  ✅ LOGIN + REGISTER
   ═══════════════════════════════════════════════════════════════ */

export type AuthMode = "login" | "register"

export interface AuthProvider {
  id: string
  label: string
  icon?: React.ReactNode
}

export interface NyuchiAuthCardProps {
  /** Which flow to show first; user can toggle. */
  mode?: AuthMode
  /** Product / surface the auth is for. */
  surface?: string
  /** SSO / passwordless providers to offer. */
  providers?: AuthProvider[]
  /** Submit handler — the card manages pending state. */
  onSubmit: (input: { mode: AuthMode; email: string; name?: string }) => Promise<void>
  /** Provider click handler. */
  onProvider?: (providerId: string) => void
  /** Error to surface (e.g. from the MCP auth handoff). */
  error?: string | null
  className?: string
}

export function NyuchiAuthCard({
  mode: initialMode = "login",
  surface = "Nyuchi",
  providers = [],
  onSubmit,
  onProvider,
  error,
  className,
}: NyuchiAuthCardProps) {
  const { log, motion } = useNyuchiHarness("auth-card")
  const [mode, setMode] = React.useState<AuthMode>(initialMode)
  const [email, setEmail] = React.useState("")
  const [name, setName] = React.useState("")
  const [pending, setPending] = React.useState(false)

  const isRegister = mode === "register"

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (pending) return
    setPending(true)
    log.info("auth_submit", { mode })
    try {
      await onSubmit({ mode, email, name: isRegister ? name : undefined })
    } finally {
      setPending(false)
    }
  }

  const animStyle = motion.prefersReduced
    ? undefined
    : { animation: `nyuchi-fade-slide-up ${motion.enterDuration}ms ${motion.enterEasing} both` }

  const field = cn(
    "min-h-[48px] rounded-[var(--radius,10px)] border border-border bg-[var(--background)]",
    "px-3 text-sm focus-visible:outline-none focus-visible:ring-2",
    "focus-visible:ring-[var(--brand-accent,var(--ring))]"
  )

  return (
    <div
      data-slot="nyuchi-auth-card"
      data-portal="https://mzizi.dev/components/nyuchi-auth-card"
      role="dialog"
      aria-label={isRegister ? "Create your account" : "Sign in"}
      aria-modal="true"
      style={animStyle}
      className={cn(
        "w-full max-w-sm rounded-[var(--radius-xl,17px)] border border-border",
        "bg-[var(--card)] p-6 text-[var(--card-foreground)] shadow-[var(--shadow-lg)]",
        className
      )}
    >
      <header className="mb-5 space-y-1">
        <h2 className="text-lg font-semibold tracking-tight">
          {isRegister ? `Join ${surface}` : `Sign in to ${surface}`}
        </h2>
        <p className="text-sm text-[var(--muted-foreground)]">
          {isRegister
            ? "Create your account — no browser, it happens right here."
            : "Authenticate inline — no browser tab needed."}
        </p>
      </header>

      {providers.length > 0 && (
        <div className="mb-4 grid gap-2">
          {providers.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onProvider?.(p.id)}
              className={cn(
                "inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[var(--radius,10px)]",
                "border border-border bg-[var(--background)] px-4 text-sm font-medium",
                "transition-colors hover:bg-[var(--muted)]",
                "focus-visible:ring-2 focus-visible:ring-[var(--brand-accent,var(--ring))] focus-visible:outline-none"
              )}
            >
              {p.icon}
              <span>Continue with {p.label}</span>
            </button>
          ))}
          <div className="my-1 flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
            <span className="h-px flex-1 bg-border" />
            or
            <span className="h-px flex-1 bg-border" />
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid gap-3">
        {isRegister && (
          <label className="grid gap-1.5 text-sm">
            <span className="font-medium">Name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              required
              className={field}
            />
          </label>
        )}
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            inputMode="email"
            required
            className={field}
          />
        </label>

        {error && (
          <p role="alert" className="text-sm text-[var(--destructive)]">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className={cn(
            "mt-1 inline-flex min-h-[48px] items-center justify-center rounded-[var(--radius,10px)]",
            "bg-[var(--brand-accent,var(--primary))] px-4 text-sm font-semibold text-[var(--primary-foreground)]",
            "transition-opacity hover:opacity-90 disabled:opacity-60",
            "focus-visible:ring-2 focus-visible:ring-[var(--brand-accent,var(--ring))] focus-visible:outline-none"
          )}
        >
          {pending ? "…" : isRegister ? "Create account" : "Sign in"}
        </button>
      </form>

      <footer className="mt-4 text-center text-sm text-[var(--muted-foreground)]">
        {isRegister ? "Already have an account? " : "New here? "}
        <button
          type="button"
          onClick={() => setMode(isRegister ? "login" : "register")}
          className={cn(
            "rounded font-medium text-[var(--brand-accent,var(--primary))] underline-offset-4 hover:underline",
            "focus-visible:ring-2 focus-visible:ring-[var(--brand-accent,var(--ring))] focus-visible:outline-none"
          )}
        >
          {isRegister ? "Sign in" : "Create one"}
        </button>
      </footer>
    </div>
  )
}
