import { formatMoney, moneyValue, type CurrencyDisplay } from "@/lib/money";
import { cn } from "@/lib/ui-utils";

/**
 * Money — an amount formatted for the reader's locale, from integer minor
 * units and an ISO 4217 code, inside a <data> element whose `value` is the
 * exact decimal ("12.50") and `data-currency` the code, so a machine reads it
 * without parsing the formatted text.
 *
 * Provider-neutral (mzizi-registry#569): no default currency and no default
 * locale; the caller passes both. The React build of contract `app/money`,
 * beside `app-money.astro` (the default build); both format with `formatMoney`
 * from the framework-free `money` module. A server component.
 */
interface MoneyProps {
  /** The amount in the currency's minor unit, as an integer (1250 = 12.50). */
  amountMinor: number;
  /** An ISO 4217 code ("USD", "ZWG", "ZAR"). Required: there is no default. */
  currency: string;
  /** A BCP 47 locale ("en-ZW", "sn-ZW", "fr-SN"). Required: there is no default. */
  locale: string;
  /** How the currency is shown. */
  display?: CurrencyDisplay;
  className?: string;
}

function Money({
  amountMinor,
  currency,
  locale,
  display = "symbol",
  className,
}: MoneyProps) {
  const money = { amountMinor, currency };
  return (
    <data
      data-slot="money"
      data-currency={currency}
      value={moneyValue(money)}
      className={cn("tabular-nums", className)}
    >
      {formatMoney(money, locale, display)}
    </data>
  );
}

export { Money, type MoneyProps };
