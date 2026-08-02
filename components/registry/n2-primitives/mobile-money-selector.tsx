"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface MobileMoneyProvider {
  id: string
  name: string
  shortName: string
  color: string
  countries: string[]
  ussdCode?: string
}

interface MobileMoneySelectorsProps extends Omit<React.ComponentProps<"div">, "onSelect"> {
  providers?: MobileMoneyProvider[]
  selected?: string
  onSelect?: (providerId: string) => void
  phoneNumber?: string
  onPhoneChange?: (phone: string) => void
}

const defaultProviders: MobileMoneyProvider[] = [
  {
    id: "ecocash",
    name: "EcoCash",
    shortName: "EC",
    color: "#00A651",
    countries: ["ZW"],
    ussdCode: "*151#",
  },
  {
    id: "mtn-momo",
    name: "MTN MoMo",
    shortName: "MM",
    color: "#FFCC00",
    countries: ["GH", "UG", "CM", "RW"],
    ussdCode: "*170#",
  },
  { id: "mpesa", name: "M-Pesa", shortName: "MP", color: "#4CAF50", countries: ["KE", "TZ", "MZ"] },
  {
    id: "airtel",
    name: "Airtel Money",
    shortName: "AM",
    color: "#ED1C24",
    countries: ["KE", "UG", "TZ", "NG"],
  },
  { id: "innbucks", name: "InnBucks", shortName: "IB", color: "#0066CC", countries: ["ZW"] },
]

function MobileMoneySelector({
  providers = defaultProviders,
  selected,
  onSelect,
  phoneNumber,
  onPhoneChange,
  className,
  ...props
}: MobileMoneySelectorsProps) {
  return (
    <div
      data-slot="mobile-money-selector"
      data-portal="https://mzizi.dev/components/mobile-money-selector"
      className={cn("space-y-3", className)}
      role="radiogroup"
      aria-label="Select mobile money provider"
      {...props}
    >
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {providers.map((provider) => (
          <button
            key={provider.id}
            role="radio"
            aria-checked={selected === provider.id}
            onClick={() => onSelect?.(provider.id)}
            className={cn(
              "flex items-center gap-2 rounded-[var(--radius-lg,14px)] border p-3 text-left transition-colors",
              selected === provider.id
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "border-border hover:bg-muted/30"
            )}
          >
            <div
              className="flex size-8 items-center justify-center rounded-full text-[10px] font-bold text-white"
              style={{ backgroundColor: provider.color }}
            >
              {provider.shortName}
            </div>
            <div>
              <div className="text-xs font-medium">{provider.name}</div>
              {provider.ussdCode && (
                <div className="font-mono text-[9px] text-muted-foreground">
                  {provider.ussdCode}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
      {selected && onPhoneChange && (
        <div>
          <label className="text-xs text-muted-foreground">Phone number</label>
          <input
            type="tel"
            value={phoneNumber || ""}
            onChange={(e) => onPhoneChange(e.target.value)}
            placeholder="07X XXX XXXX"
            className="mt-1 h-12 w-full rounded-full border border-input bg-input/30 px-4 text-sm outline-none focus:border-ring focus:ring-[3px] focus:ring-ring/50"
          />
        </div>
      )}
    </div>
  )
}

export { MobileMoneySelector }
export type { MobileMoneySelectorsProps }
