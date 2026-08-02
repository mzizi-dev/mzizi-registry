"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface Language {
  code: string
  name: string
  nativeName: string
  flag?: string
}

interface LanguageSwitcherProps extends Omit<React.ComponentProps<"div">, "onChange"> {
  languages?: Language[]
  current?: string
  onChange?: (code: string) => void
  variant?: "dropdown" | "inline"
}

const defaultLanguages: Language[] = [
  { code: "sn", name: "Shona", nativeName: "ChiShona" },
  { code: "nd", name: "Ndebele", nativeName: "IsiNdebele" },
  { code: "en", name: "English", nativeName: "English" },
  { code: "sw", name: "Swahili", nativeName: "Kiswahili" },
  { code: "zu", name: "Zulu", nativeName: "IsiZulu" },
  { code: "xh", name: "Xhosa", nativeName: "IsiXhosa" },
  { code: "fr", name: "French", nativeName: "Français" },
  { code: "pt", name: "Portuguese", nativeName: "Português" },
]

function LanguageSwitcher({
  languages = defaultLanguages,
  current = "en",
  onChange,
  variant = "dropdown",
  className,
  ...props
}: LanguageSwitcherProps) {
  // A `currentLang = languages.find(...)` lookup stood here and was never read.
  // Unlike the other unused values in this sweep it is not a dropped feature:
  // the inline variant marks the active button from `current` directly, and the
  // dropdown is a native <select>, which renders its own selected option. There
  // was nothing for the lookup to feed.

  if (variant === "inline") {
    return (
      <div
        data-slot="language-switcher"
        data-portal="https://mzizi.dev/components/language-switcher"
        className={cn("flex flex-wrap gap-1", className)}
        role="radiogroup"
        aria-label="Language"
        {...props}
      >
        {languages.map((lang) => (
          <button
            key={lang.code}
            role="radio"
            aria-checked={current === lang.code}
            onClick={() => onChange?.(lang.code)}
            className={cn(
              "h-8 rounded-full px-3 text-xs font-medium transition-colors",
              current === lang.code
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            {lang.nativeName}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div data-slot="language-switcher" className={cn("relative", className)} {...props}>
      <select
        value={current}
        onChange={(e) => onChange?.(e.target.value)}
        className="h-12 w-full appearance-none rounded-full border border-input bg-input/30 px-4 pr-8 text-sm outline-none focus:border-ring focus:ring-[3px] focus:ring-ring/50"
        aria-label="Select language"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.nativeName} ({lang.name})
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground">
        ▾
      </div>
    </div>
  )
}

export { LanguageSwitcher }
export type { LanguageSwitcherProps }
