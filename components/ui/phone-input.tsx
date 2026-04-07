"use client"

import * as React from "react"
import { ChevronDownIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface Country {
  code: string
  name: string
  dial: string
  flag: string
}

const AFRICAN_COUNTRIES: Country[] = [
  { code: "ZW", name: "Zimbabwe", dial: "+263", flag: "\u{1F1FF}\u{1F1FC}" },
  { code: "ZA", name: "South Africa", dial: "+27", flag: "\u{1F1FF}\u{1F1E6}" },
  { code: "KE", name: "Kenya", dial: "+254", flag: "\u{1F1F0}\u{1F1EA}" },
  { code: "NG", name: "Nigeria", dial: "+234", flag: "\u{1F1F3}\u{1F1EC}" },
  { code: "GH", name: "Ghana", dial: "+233", flag: "\u{1F1EC}\u{1F1ED}" },
  { code: "TZ", name: "Tanzania", dial: "+255", flag: "\u{1F1F9}\u{1F1FF}" },
  { code: "UG", name: "Uganda", dial: "+256", flag: "\u{1F1FA}\u{1F1EC}" },
  { code: "RW", name: "Rwanda", dial: "+250", flag: "\u{1F1F7}\u{1F1FC}" },
  { code: "BW", name: "Botswana", dial: "+267", flag: "\u{1F1E7}\u{1F1FC}" },
  { code: "MZ", name: "Mozambique", dial: "+258", flag: "\u{1F1F2}\u{1F1FF}" },
  { code: "MW", name: "Malawi", dial: "+265", flag: "\u{1F1F2}\u{1F1FC}" },
  { code: "ZM", name: "Zambia", dial: "+260", flag: "\u{1F1FF}\u{1F1F2}" },
  { code: "NA", name: "Namibia", dial: "+264", flag: "\u{1F1F3}\u{1F1E6}" },
]

const OTHER_COUNTRIES: Country[] = [
  { code: "US", name: "United States", dial: "+1", flag: "\u{1F1FA}\u{1F1F8}" },
  { code: "GB", name: "United Kingdom", dial: "+44", flag: "\u{1F1EC}\u{1F1E7}" },
  { code: "IN", name: "India", dial: "+91", flag: "\u{1F1EE}\u{1F1F3}" },
  { code: "CN", name: "China", dial: "+86", flag: "\u{1F1E8}\u{1F1F3}" },
  { code: "AE", name: "UAE", dial: "+971", flag: "\u{1F1E6}\u{1F1EA}" },
  { code: "AU", name: "Australia", dial: "+61", flag: "\u{1F1E6}\u{1F1FA}" },
  { code: "DE", name: "Germany", dial: "+49", flag: "\u{1F1E9}\u{1F1EA}" },
  { code: "PT", name: "Portugal", dial: "+351", flag: "\u{1F1F5}\u{1F1F9}" },
]

const ALL_COUNTRIES = [...AFRICAN_COUNTRIES, ...OTHER_COUNTRIES]

function PhoneInput({
  className,
  value,
  onChange,
  defaultCountry = "ZW",
  ...props
}: Omit<React.ComponentProps<"div">, "onChange"> & {
  value?: string
  onChange?: (value: string) => void
  defaultCountry?: string
}) {
  const [open, setOpen] = React.useState(false)
  const [selectedCountry, setSelectedCountry] = React.useState<Country>(
    () => ALL_COUNTRIES.find((c) => c.code === defaultCountry) ?? ALL_COUNTRIES[0]
  )
  const [number, setNumber] = React.useState(value ?? "")

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country)
    setOpen(false)
    onChange?.(`${country.dial}${number}`)
  }

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^\d]/g, "")
    setNumber(val)
    onChange?.(`${selectedCountry.dial}${val}`)
  }

  return (
    <div data-slot="phone-input" className={cn("flex gap-2", className)} {...props}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            role="combobox"
            aria-expanded={open}
            aria-label="Select country code"
            className={cn(
              "border-input bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50",
              "inline-flex h-9 shrink-0 items-center gap-1 rounded-4xl border px-2.5 text-sm transition-colors",
              "hover:bg-input/50 focus-visible:ring-[3px] focus-visible:outline-none"
            )}
          >
            <span>{selectedCountry.flag}</span>
            <span className="text-muted-foreground">{selectedCountry.dial}</span>
            <ChevronDownIcon className="size-3.5 text-muted-foreground" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="start">
          <div className="max-h-64 overflow-y-auto p-1">
            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Africa</div>
            {AFRICAN_COUNTRIES.map((country) => (
              <button
                key={country.code}
                type="button"
                onClick={() => handleCountrySelect(country)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors",
                  "hover:bg-muted",
                  selectedCountry.code === country.code && "bg-muted"
                )}
              >
                <span>{country.flag}</span>
                <span className="flex-1 text-left">{country.name}</span>
                <span className="text-muted-foreground">{country.dial}</span>
              </button>
            ))}
            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Other</div>
            {OTHER_COUNTRIES.map((country) => (
              <button
                key={country.code}
                type="button"
                onClick={() => handleCountrySelect(country)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors",
                  "hover:bg-muted",
                  selectedCountry.code === country.code && "bg-muted"
                )}
              >
                <span>{country.flag}</span>
                <span className="flex-1 text-left">{country.name}</span>
                <span className="text-muted-foreground">{country.dial}</span>
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
      <Input
        type="tel"
        inputMode="numeric"
        placeholder="Phone number"
        value={number}
        onChange={handleNumberChange}
        className="flex-1"
      />
    </div>
  )
}

export { PhoneInput, AFRICAN_COUNTRIES, ALL_COUNTRIES }
export type { Country }
