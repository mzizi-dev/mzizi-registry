"use client"

import * as React from "react"
import { generateCSSVariables, type ThemeMode, type BrandId } from "@/lib/tokens"

/* ═══════════════════════════════════════════════════════════════
   MUKOKO THEME PROVIDER
   
   Wraps the application root and provides:
   1. CSS custom properties generated from the token system
   2. React context for runtime theme/brand switching
   3. System preference detection (prefers-color-scheme, prefers-contrast)
   4. Persistence via localStorage
   5. Class-based theme application for Tailwind dark: prefix
   ═══════════════════════════════════════════════════════════════ */

interface ThemeContextValue {
  theme: ThemeMode
  brand: BrandId
  setTheme: (theme: ThemeMode) => void
  setBrand: (brand: BrandId) => void
  systemPreference: ThemeMode
  /** Whether reduced motion is preferred */
  prefersReducedMotion: boolean
  /** Whether high contrast is preferred */
  prefersHighContrast: boolean
}

const ThemeContext = React.createContext<ThemeContextValue | null>(null)

export function useTheme() {
  const ctx = React.useContext(ThemeContext)
  if (!ctx) throw new Error("useTheme must be used within NyuchiThemeProvider")
  return ctx
}

interface NyuchiThemeProviderProps {
  children: React.ReactNode
  /** Default theme mode */
  defaultTheme?: ThemeMode
  /** Brand identity (changes primary accent color) */
  brand?: BrandId
  /** Use system preference for initial theme */
  useSystemPreference?: boolean
  /** Storage key for persisting theme choice */
  storageKey?: string
}

export function NyuchiThemeProvider({
  children,
  defaultTheme = "dark",
  brand: initialBrand = "mukoko",
  useSystemPreference = true,
  storageKey = "nyuchi-theme",
}: NyuchiThemeProviderProps) {
  /* Detect system preferences */
  const [systemPreference, setSystemPreference] = React.useState<ThemeMode>("dark")
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false)
  const [prefersHighContrast, setPrefersHighContrast] = React.useState(false)

  React.useEffect(() => {
    const darkMq = window.matchMedia("(prefers-color-scheme: dark)")
    const contrastMq = window.matchMedia("(prefers-contrast: more)")
    const motionMq = window.matchMedia("(prefers-reduced-motion: reduce)")

    setSystemPreference(contrastMq.matches ? "high-contrast" : darkMq.matches ? "dark" : "light")
    setPrefersHighContrast(contrastMq.matches)
    setPrefersReducedMotion(motionMq.matches)

    const onDark = (e: MediaQueryListEvent) => setSystemPreference(e.matches ? "dark" : "light")
    const onContrast = (e: MediaQueryListEvent) => {
      setPrefersHighContrast(e.matches)
      if (e.matches) setSystemPreference("high-contrast")
    }
    const onMotion = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)

    darkMq.addEventListener("change", onDark)
    contrastMq.addEventListener("change", onContrast)
    motionMq.addEventListener("change", onMotion)
    return () => {
      darkMq.removeEventListener("change", onDark)
      contrastMq.removeEventListener("change", onContrast)
      motionMq.removeEventListener("change", onMotion)
    }
  }, [])

  /* Theme state with persistence */
  const [theme, setThemeState] = React.useState<ThemeMode>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(storageKey) as ThemeMode | null
      if (stored) return stored
    }
    return useSystemPreference ? systemPreference : defaultTheme
  })
  const [brand, setBrand] = React.useState<BrandId>(initialBrand)

  const setTheme = React.useCallback(
    (t: ThemeMode) => {
      setThemeState(t)
      if (typeof window !== "undefined") localStorage.setItem(storageKey, t)
    },
    [storageKey]
  )

  /* Generate and inject CSS variables */
  const cssVars = React.useMemo(() => generateCSSVariables(theme, brand), [theme, brand])

  /* Apply dark/light class for Tailwind */
  React.useEffect(() => {
    const root = document.documentElement
    root.classList.remove("light", "dark")
    root.classList.add(theme === "light" ? "light" : "dark")
    root.setAttribute("data-theme", theme)
    root.setAttribute("data-brand", brand)
    if (prefersReducedMotion) root.setAttribute("data-reduced-motion", "true")
    else root.removeAttribute("data-reduced-motion")
  }, [theme, brand, prefersReducedMotion])

  const value: ThemeContextValue = {
    theme,
    brand,
    setTheme,
    setBrand,
    systemPreference,
    prefersReducedMotion,
    prefersHighContrast,
  }

  return (
    <ThemeContext.Provider value={value}>
      <style dangerouslySetInnerHTML={{ __html: cssVars }} />
      {children}
    </ThemeContext.Provider>
  )
}
