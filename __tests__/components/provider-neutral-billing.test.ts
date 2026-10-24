/**
 * Provider-neutral billing (mzizi-registry#569; owner, 2026-10-24: "mzizi is not
 * an internal architecture it's also public so mzizi should never limit to our
 * providers"). The money module and the components built on it name no payment
 * provider, no platform token and no brand, and default no currency and no
 * locale: the caller always passes both.
 */
import { readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

import { currencyDigits, formatMoney, isCurrencyCode, moneyValue } from "@/components/registry/n2-primitives/money"

const ROOT = path.resolve(__dirname, "../..")
const FILES = [
  "components/registry/n2-primitives/money.ts",
  "components/registry/n2-primitives/app-money.astro",
  "components/registry/n2-primitives/app-money.tsx",
  "components/registry/n6-pages/app-plan-summary.astro",
  "components/registry/n6-pages/app-plan-summary.tsx",
]
/** Comments explain the rule, so they are stripped before the scan. */
const code = (f: string) =>
  readFileSync(path.join(ROOT, f), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "")

describe("no provider, no token, no default currency", () => {
  it.each(FILES)("%s names no payment provider, platform token or brand", (f) => {
    expect(code(f)).not.toMatch(/ecocash|onemoney|innbucks|paynow|m-?pesa|stripe|paypal|nyuchi|mukoko|\bMXT\b|\bMIT\b|\bNST\b|\bNHC\b/i)
  })

  it.each(FILES)("%s defaults no currency and no locale", (f) => {
    expect(code(f)).not.toMatch(/\b(?:currency|locale)\s*(?:=|\?\?|\|\|)\s*["']/)
  })
})

describe("money", () => {
  it("formats minor units with the currency's own digits", () => {
    expect(moneyValue({ amountMinor: 1250, currency: "USD" })).toBe("12.50")
    expect(moneyValue({ amountMinor: 1235, currency: "JPY" })).toBe("1235")
    expect(moneyValue({ amountMinor: 1500, currency: "KWD" })).toBe("1.500")
    expect(currencyDigits("XOF")).toBe(0)
  })

  it("is exact for negative and very large amounts", () => {
    expect(moneyValue({ amountMinor: -5, currency: "USD" })).toBe("-0.05")
    expect(moneyValue({ amountMinor: BigInt("123456789012345678901"), currency: "ZAR" })).toBe("1234567890123456789.01")
  })

  it("formats for the locale it is given", () => {
    expect(formatMoney({ amountMinor: 1250, currency: "USD" }, "en-US")).toBe("$12.50")
    expect(formatMoney({ amountMinor: 150000, currency: "ZWG" }, "en-ZW", "code")).toContain("1,500.00")
  })

  it("refuses a code that is not ISO 4217 and an amount that is not an integer", () => {
    expect(isCurrencyCode("usd")).toBe(false)
    expect(() => formatMoney({ amountMinor: 1, currency: "usd" }, "en")).toThrow(RangeError)
    expect(() => formatMoney({ amountMinor: 1, currency: "" }, "en")).toThrow(RangeError)
    expect(() => moneyValue({ amountMinor: 12.5, currency: "USD" })).toThrow(RangeError)
  })
})
