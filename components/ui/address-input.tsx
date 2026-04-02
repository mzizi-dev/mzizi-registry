"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

interface AddressValue {
  street: string
  city: string
  state: string
  postalCode: string
  country: string
}

interface AddressInputProps {
  value?: Partial<AddressValue>
  onChange?: (value: AddressValue) => void
  className?: string
}

const AFRICAN_COUNTRIES = [
  "Zimbabwe", "South Africa", "Kenya", "Nigeria", "Ghana", "Tanzania",
  "Uganda", "Ethiopia", "Rwanda", "Mozambique", "Zambia", "Botswana",
  "Namibia", "Malawi", "Senegal", "Cameroon", "Egypt", "Morocco",
] as const

const OTHER_COUNTRIES = [
  "United Kingdom", "United States", "Canada", "Australia",
  "Germany", "France", "India", "Brazil", "China", "Japan",
] as const

const DEFAULT_VALUE: AddressValue = {
  street: "",
  city: "",
  state: "",
  postalCode: "",
  country: "",
}

function AddressInput({ value, onChange, className }: AddressInputProps) {
  const address = { ...DEFAULT_VALUE, ...value }

  function update(field: keyof AddressValue, v: string) {
    onChange?.({ ...address, [field]: v })
  }

  return (
    <div data-slot="address-input" className={cn("flex flex-col gap-3", className)}>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Street address</label>
        <Input
          value={address.street}
          onChange={(e) => update("street", e.target.value)}
          placeholder="123 Main Street"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">City</label>
          <Input
            value={address.city}
            onChange={(e) => update("city", e.target.value)}
            placeholder="Harare"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">State / Province</label>
          <Input
            value={address.state}
            onChange={(e) => update("state", e.target.value)}
            placeholder="Harare Province"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Postal code</label>
          <Input
            value={address.postalCode}
            onChange={(e) => update("postalCode", e.target.value)}
            placeholder="00263"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Country</label>
          <select
            value={address.country}
            onChange={(e) => update("country", e.target.value)}
            aria-label="Country"
            className="border-input bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-4xl border px-3 text-sm outline-none transition-colors focus-visible:ring-[3px]"
          >
            <option value="">Select country</option>
            <optgroup label="Africa">
              {AFRICAN_COUNTRIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </optgroup>
            <optgroup label="Other">
              {OTHER_COUNTRIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </optgroup>
          </select>
        </div>
      </div>
    </div>
  )
}

export { AddressInput }
export type { AddressInputProps, AddressValue }
