/**
 * Money, provider-neutral (mzizi-registry#569): an amount in minor units plus
 * an ISO 4217 currency code, formatted for a locale with `Intl.NumberFormat`.
 *
 * Installs to lib/money.ts. Framework-free (no React, no `@/` import), so the
 * Astro and React builds of `app/money` and `app/plan-summary` and any server
 * share it.
 *
 * THE RULE. There is no default currency and no default locale: the caller
 * always passes both, because the platform cannot know what a business
 * charges in or where its reader is. Amounts are integers in the currency's
 * minor unit (cents for USD, none for JPY, fils for KWD), never floats, so
 * nothing is lost to rounding; the decimal is placed by the currency's own
 * digits from `Intl`. A code that is not three capital letters is refused
 * (RangeError) rather than shown wrongly.
 */

/** An amount of money: integer minor units and an ISO 4217 code. */
export interface Money {
  /** The amount in the currency's minor unit, as an integer (1250 = 12.50 USD). */
  amountMinor: number | bigint
  /** An ISO 4217 code: three capital letters ("USD", "ZWG", "ZAR", "KES"). */
  currency: string
}

/** How the currency is shown. */
export type CurrencyDisplay = "symbol" | "narrowSymbol" | "code" | "name"

/** Whether `code` is a well-formed ISO 4217 code (three capital letters). */
export function isCurrencyCode(code: unknown): code is string {
  return typeof code === "string" && /^[A-Z]{3}$/.test(code)
}

function assertMoney(money: Money): void {
  if (!isCurrencyCode(money.currency))
    throw new RangeError(`money: "${String(money.currency)}" is not an ISO 4217 currency code (three capital letters)`)
  const a = money.amountMinor
  if (typeof a === "number" ? !Number.isSafeInteger(a) : typeof a !== "bigint")
    throw new RangeError(`money: amountMinor must be an integer number of minor units, not ${String(a)}`)
}

/** The number of minor-unit digits a currency uses (2 for USD, 0 for JPY, 3 for KWD). */
export function currencyDigits(currency: string): number {
  if (!isCurrencyCode(currency))
    throw new RangeError(`money: "${currency}" is not an ISO 4217 currency code (three capital letters)`)
  return new Intl.NumberFormat("en", { style: "currency", currency }).resolvedOptions().maximumFractionDigits ?? 2
}

/**
 * The amount as an exact decimal string in major units ("12.50", "-0.05",
 * "1235"), built from the integer, never through a float. It is the
 * machine-readable value (`<data value>`) and what `formatMoney` formats.
 */
export function moneyValue(money: Money): string {
  assertMoney(money)
  const digits = currencyDigits(money.currency)
  const n = BigInt(money.amountMinor)
  const negative = n < BigInt(0)
  const abs = (negative ? -n : n).toString().padStart(digits + 1, "0")
  const major = digits === 0 ? abs : `${abs.slice(0, -digits)}.${abs.slice(-digits)}`
  return negative ? `-${major}` : major
}

/**
 * Format money for a locale: `formatMoney({ amountMinor: 1250, currency: "USD" }, "en-ZW")`
 * → "US$12.50". Both the currency and the locale are required.
 */
export function formatMoney(money: Money, locale: string, display: CurrencyDisplay = "symbol"): string {
  const value = moneyValue(money)
  const digits = currencyDigits(money.currency)
  const format = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: money.currency,
    currencyDisplay: display,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
  // A decimal string keeps the exact value (Intl.NumberFormat v3).
  return format.format(value as unknown as number)
}
