"use client"
import * as React from "react"
import { cn } from "@/lib/utils"
import { useNyuchiHarness } from "@/lib/harness"

/* ═══════════════════════════════════════════════════════════════
   NYUCHI AUTH LAYOUT — Layer 6 Page Composition
   Default screen that wraps all auth flows.
   ═══════════════════════════════════════════════════════════════ */

interface NyuchiAuthLayoutProps {
  children: React.ReactNode
  /** Which auth step is being displayed */
  variant?: "login" | "signup" | "onboarding" | "reset" | "verify"
  /** Show the mineral gradient background */
  showBackground?: boolean
  /** Show the logo */
  showLogo?: boolean
  /** Show language selector */
  showLanguage?: boolean
  /** Show legal links (terms, privacy) */
  showLegal?: boolean
  /** Available languages */
  languages?: { code: string; label: string }[]
  onLanguageChange?: (code: string) => void
  loading?: boolean
  className?: string
}

const DEFAULT_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "sn", label: "chiShona" },
  { code: "nd", label: "isiNdebele" },
  { code: "sw", label: "Kiswahili" },
  { code: "fr", label: "Français" },
  { code: "pt", label: "Português" },
]

export function NyuchiAuthLayout({
  children,
  variant = "login",
  showBackground = true,
  showLogo = true,
  showLanguage = true,
  showLegal = true,
  languages = DEFAULT_LANGUAGES,
  onLanguageChange,
  loading = false,
  className,
}: NyuchiAuthLayoutProps) {
  const { motion } = useNyuchiHarness("auth-layout")
  const animStyle = React.useMemo(
    () =>
      motion.prefersReduced
        ? {}
        : {
            animation: `nyuchi-fade-slide-up ${motion.enterDuration}ms ${motion.enterEasing} both`,
          },
    [motion]
  )

  return (
    <div
      data-slot="nyuchi-auth-layout"
      data-portal="https://mzizi.dev/components/nyuchi-auth-layout"
      data-variant={variant}
      role="main"
      aria-label={
        variant === "login" ? "Sign in" : variant === "signup" ? "Create account" : variant
      }
      className={cn(
        "flex min-h-screen flex-col items-center justify-center p-4",
        showBackground && "bg-gradient-to-br from-background via-background to-primary/5",
        className
      )}
    >
      {/* Logo */}
      {showLogo && (
        <div className="mb-8" style={animStyle}>
          <p className="text-2xl font-bold tracking-tight">
            <span className="text-foreground">mukoko</span>
          </p>
        </div>
      )}

      {/* Auth card container */}
      <div className="w-full max-w-md" style={animStyle}>
        <div className="rounded-[var(--radius-xl,17px)] border border-border bg-card p-6 shadow-lg sm:p-8">
          {loading ? (
            <div className="animate-pulse space-y-4" role="status" aria-label="Loading">
              <div className="h-8 w-2/3 rounded bg-muted" />
              <div className="h-10 rounded bg-muted" />
              <div className="h-10 rounded bg-muted" />
              <div className="h-12 rounded-full bg-muted" />
            </div>
          ) : (
            children
          )}
        </div>
      </div>

      {/* Language selector */}
      {showLanguage && (
        <div className="mt-6 flex flex-wrap justify-center gap-2" style={animStyle}>
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => onLanguageChange?.(lang.code)}
              className="min-h-[44px] rounded-full px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary,#00B0FF)]"
            >
              {lang.label}
            </button>
          ))}
        </div>
      )}

      {/* Legal links */}
      {showLegal && (
        <div className="mt-4 flex gap-4 text-xs text-muted-foreground/60">
          <a href="/legal/terms" className="transition-colors hover:text-muted-foreground">
            Terms
          </a>
          <a href="/legal/privacy" className="transition-colors hover:text-muted-foreground">
            Privacy
          </a>
          <a href="/legal/cookies" className="transition-colors hover:text-muted-foreground">
            Cookies
          </a>
        </div>
      )}
    </div>
  )
}

export type { NyuchiAuthLayoutProps }
