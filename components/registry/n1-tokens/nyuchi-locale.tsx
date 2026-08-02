"use client"

import * as React from "react"

/* ═══════════════════════════════════════════════════════════════
   NYUCHI LOCALE SYSTEM
   
   Pan-African internationalization infrastructure.
   Zimbabwe alone has 16 official languages. The Nyuchi platform
   serves users across Africa — localization is existential.
   
   Exports:
   - NyuchiLocaleProvider: wraps app with locale context
   - useLocale: formatting functions
   - useDirection: RTL/LTR detection
   - formatDate, formatCurrency, formatRelativeTime
   - UI string token system
   ═══════════════════════════════════════════════════════════════ */

// ─── Supported Locales ─────────────────────────────────────
export const SUPPORTED_LOCALES = {
  en: { name: "English", dir: "ltr", region: "ZW" },
  sn: { name: "Shona", dir: "ltr", region: "ZW" },
  nd: { name: "Ndebele", dir: "ltr", region: "ZW" },
  sw: { name: "Swahili", dir: "ltr", region: "KE" },
  zu: { name: "Zulu", dir: "ltr", region: "ZA" },
  xh: { name: "Xhosa", dir: "ltr", region: "ZA" },
  af: { name: "Afrikaans", dir: "ltr", region: "ZA" },
  fr: { name: "French", dir: "ltr", region: "CD" },
  pt: { name: "Portuguese", dir: "ltr", region: "MZ" },
  ar: { name: "Arabic", dir: "rtl", region: "EG" },
  am: { name: "Amharic", dir: "ltr", region: "ET" },
  ha: { name: "Hausa", dir: "ltr", region: "NG" },
  yo: { name: "Yoruba", dir: "ltr", region: "NG" },
  ig: { name: "Igbo", dir: "ltr", region: "NG" },
  ny: { name: "Chichewa", dir: "ltr", region: "MW" },
  tn: { name: "Tswana", dir: "ltr", region: "BW" },
} as const

export type LocaleCode = keyof typeof SUPPORTED_LOCALES

// ─── African Currency Support ──────────────────────────────
export const AFRICAN_CURRENCIES = {
  ZWL: { symbol: "Z$", name: "Zimbabwe Dollar" },
  ZAR: { symbol: "R", name: "South African Rand" },
  USD: { symbol: "$", name: "US Dollar" },
  KES: { symbol: "KSh", name: "Kenyan Shilling" },
  NGN: { symbol: "₦", name: "Nigerian Naira" },
  GHS: { symbol: "GH₵", name: "Ghanaian Cedi" },
  BWP: { symbol: "P", name: "Botswana Pula" },
  MZN: { symbol: "MT", name: "Mozambican Metical" },
  ETB: { symbol: "Br", name: "Ethiopian Birr" },
  TZS: { symbol: "TSh", name: "Tanzanian Shilling" },
  RWF: { symbol: "FRw", name: "Rwandan Franc" },
  MWK: { symbol: "MK", name: "Malawian Kwacha" },
  ZMW: { symbol: "ZK", name: "Zambian Kwacha" },
} as const

// ─── UI String Tokens ──────────────────────────────────────
// System UI strings as tokens with locale variants.
// Apps use string keys, not hardcoded text.

export type StringKey = keyof typeof UI_STRINGS.en

export const UI_STRINGS: Record<string, Record<string, string>> = {
  en: {
    "action.rsvp": "RSVP",
    "action.see_all": "See all",
    "action.go_back": "Go Back",
    "action.verify_now": "Verify Now",
    "action.retry": "Try Again",
    "action.cancel": "Cancel",
    "action.publish": "Publish",
    "action.save": "Save",
    "action.send": "Send",
    "action.follow": "Follow",
    "action.unfollow": "Unfollow",
    "action.share": "Share",
    "action.inquire": "Inquire",
    "action.sign_in": "Sign In",
    "action.sign_out": "Sign Out",
    "status.active": "Active",
    "status.suspended": "Suspended",
    "status.memorial": "Memorial",
    "status.offline": "You are offline",
    "status.cached": "Showing cached data",
    "trust.score": "Trust Score",
    "trust.ubuntu_points": "Ubuntu Points",
    "error.not_found": "Page not found",
    "error.generic": "Something went wrong",
    "error.section_fail": "could not load",
    "error.permission": "Verification Required",
    "label.free": "Free",
    "label.open": "Open",
    "label.closed": "Closed",
    "label.verified": "Verified",
    "label.unverified": "Unverified",
    "time.just_now": "Just now",
    "time.ago": "ago",
    "empty.no_events": "No events yet",
    "empty.no_results": "No results found",
  },
  sn: {
    "action.rsvp": "Nyoresa",
    "action.see_all": "Ona zvose",
    "action.go_back": "Dzokera",
    "action.verify_now": "Simbisa Izvozvi",
    "action.retry": "Edza Zvakare",
    "action.cancel": "Dzima",
    "action.publish": "Budisa",
    "action.save": "Chengetedza",
    "action.send": "Tumira",
    "action.follow": "Tevera",
    "action.unfollow": "Rega kutevera",
    "action.share": "Govana",
    "action.inquire": "Bvunza",
    "action.sign_in": "Pinda",
    "action.sign_out": "Buda",
    "status.active": "Inoshanda",
    "status.suspended": "Yakamiswa",
    "status.memorial": "Chirangaridzo",
    "status.offline": "Hausi pa intaneti",
    "status.cached": "Zvinoratidzwa zvakachengetwa",
    "trust.score": "Chiyero Chevimbo",
    "trust.ubuntu_points": "Mapoinzi eUbuntu",
    "error.not_found": "Peji haina kuwanikwa",
    "error.generic": "Chimwe chinhu chakakanganisika",
    "error.section_fail": "haina kukwanisa kurodha",
    "error.permission": "Kusimbiswa Kunodiwa",
    "label.free": "Mahara",
    "label.open": "Yakavhurika",
    "label.closed": "Yakavharwa",
    "label.verified": "Yakasimbiswa",
    "label.unverified": "Isina kusimbiswa",
    "time.just_now": "Izvozvi",
    "time.ago": "yapfuura",
    "empty.no_events": "Hapana zviitiko zvechinguva",
    "empty.no_results": "Hapana zvawanikwa",
  },
}

// ─── Locale Context ────────────────────────────────────────
interface LocaleContextValue {
  locale: LocaleCode
  direction: "ltr" | "rtl"
  setLocale: (locale: LocaleCode) => void
  t: (key: string, fallback?: string) => string
  formatDate: (date: Date | string, style?: "short" | "medium" | "long" | "relative") => string
  formatCurrency: (amount: number, currency?: string) => string
  formatNumber: (n: number) => string
  formatRelativeTime: (date: Date | string) => string
}

const LocaleContext = React.createContext<LocaleContextValue | null>(null)

export function useLocale() {
  const ctx = React.useContext(LocaleContext)
  if (!ctx) throw new Error("useLocale must be used within NyuchiLocaleProvider")
  return ctx
}

export function useDirection() {
  const { direction } = useLocale()
  return direction
}

interface NyuchiLocaleProviderProps {
  children: React.ReactNode
  defaultLocale?: LocaleCode
  storageKey?: string
}

export function NyuchiLocaleProvider({
  children,
  defaultLocale = "en",
  storageKey = "nyuchi-locale",
}: NyuchiLocaleProviderProps) {
  const [locale, setLocaleState] = React.useState<LocaleCode>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(storageKey) as LocaleCode | null
      if (stored && stored in SUPPORTED_LOCALES) return stored
    }
    return defaultLocale
  })

  const direction = SUPPORTED_LOCALES[locale]?.dir || "ltr"

  const setLocale = React.useCallback(
    (l: LocaleCode) => {
      setLocaleState(l)
      if (typeof window !== "undefined") localStorage.setItem(storageKey, l)
      document.documentElement.setAttribute("dir", SUPPORTED_LOCALES[l]?.dir || "ltr")
      document.documentElement.setAttribute("lang", l)
    },
    [storageKey]
  )

  // Translation function
  const t = React.useCallback(
    (key: string, fallback?: string): string => {
      return UI_STRINGS[locale]?.[key] || UI_STRINGS.en?.[key] || fallback || key
    },
    [locale]
  )

  // Formatters
  const formatDate = React.useCallback(
    (date: Date | string, style: "short" | "medium" | "long" | "relative" = "medium"): string => {
      const d = typeof date === "string" ? new Date(date) : date
      if (style === "relative") return formatRelativeTimeImpl(d, locale)
      const options: Intl.DateTimeFormatOptions =
        style === "short"
          ? { month: "short", day: "numeric" }
          : style === "long"
            ? { weekday: "long", year: "numeric", month: "long", day: "numeric" }
            : { year: "numeric", month: "short", day: "numeric" }
      return new Intl.DateTimeFormat(locale, options).format(d)
    },
    [locale]
  )

  const formatCurrency = React.useCallback(
    (amount: number, currency = "USD"): string => {
      return new Intl.NumberFormat(locale, { style: "currency", currency }).format(amount)
    },
    [locale]
  )

  const formatNumber = React.useCallback(
    (n: number): string => {
      return new Intl.NumberFormat(locale).format(n)
    },
    [locale]
  )

  const formatRelativeTime = React.useCallback(
    (date: Date | string): string => {
      return formatRelativeTimeImpl(typeof date === "string" ? new Date(date) : date, locale)
    },
    [locale]
  )

  React.useEffect(() => {
    document.documentElement.setAttribute("dir", direction)
    document.documentElement.setAttribute("lang", locale)
  }, [locale, direction])

  const value: LocaleContextValue = {
    locale,
    direction,
    setLocale,
    t,
    formatDate,
    formatCurrency,
    formatNumber,
    formatRelativeTime,
  }

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

function formatRelativeTimeImpl(date: Date, locale: string): string {
  const now = Date.now()
  const diff = now - date.getTime()
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return UI_STRINGS[locale]?.["time.just_now"] || "Just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ${UI_STRINGS[locale]?.["time.ago"] || "ago"}`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ${UI_STRINGS[locale]?.["time.ago"] || "ago"}`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ${UI_STRINGS[locale]?.["time.ago"] || "ago"}`
  return new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }).format(date)
}

export type { LocaleContextValue, NyuchiLocaleProviderProps }
