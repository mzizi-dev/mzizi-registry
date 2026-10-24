import { Money } from "@/components/ui/app-money";
import { Icon } from "@/components/ui/site-icon";
import { cn } from "@/lib/ui-utils";
import {
  appButtonVariants,
  statusToneClasses,
  type StatusTone,
} from "@/lib/ui-variants";

/**
 * PlanSummary — the plan an account is on: its name, its price and billing
 * interval, its status in words and a status pill, the date it renews or
 * ends, what it includes, and its actions (change, cancel, choose a plan).
 *
 * Provider-neutral (mzizi-registry#569): it names no payment provider and no
 * payment method, and has no default currency or locale. The price is
 * `Money` (integer minor units and an ISO 4217 code) formatted for `locale`;
 * the status is one of active, past_due, cancelled, expired or none. It takes
 * data and computes nothing about billing. Pair a cancel action with
 * ConfirmAction.
 *
 * The React build of contract `app/plan-summary`, beside
 * `app-plan-summary.astro` (the default build): the same markup and classes,
 * a server component.
 */
type PlanStatus = "active" | "past_due" | "cancelled" | "expired" | "none";
type PlanInterval = "day" | "week" | "month" | "year";

interface PlanSummaryCopy {
  status?: Partial<Record<PlanStatus, string>>;
  per?: Partial<Record<PlanInterval, string>>;
  date?: Partial<Record<PlanStatus, string>>;
  features?: string;
  none?: string;
}

interface PlanSummaryProps {
  /** The plan's name ("Business", "Kweli Pro"). */
  name: string;
  /** Where the plan stands. */
  status: PlanStatus;
  /** A BCP 47 locale for the price and the date. Required: there is no default. */
  locale: string;
  /** The price: integer minor units and an ISO 4217 code. No default currency. */
  price?: { amountMinor: number; currency: string } | null;
  /** How often it is charged; without it the price is one-off. */
  interval?: PlanInterval;
  /** The date it renews or ends, as an ISO date ("2026-11-24"). */
  periodEnd?: string;
  /** What the plan includes. */
  features?: string[];
  /** The main action ("Change plan", "Choose a plan", "Update payment"). */
  action?: { label: string; href: string };
  /** A second action ("Cancel plan" — pair it with ConfirmAction). */
  secondaryAction?: { label: string; href: string };
  /** Words, for another language. */
  copy?: PlanSummaryCopy;
  /** The id the heading is built from. */
  id?: string;
  /** The heading's level (2 or 3). */
  headingLevel?: 2 | 3;
  className?: string;
}

const STATUS: Record<PlanStatus, string> = {
  active: "Active",
  past_due: "Payment due",
  cancelled: "Cancelled",
  expired: "Expired",
  none: "No plan",
};
const TONE: Record<PlanStatus, StatusTone> = {
  active: "success",
  past_due: "warning",
  cancelled: "neutral",
  expired: "neutral",
  none: "neutral",
};
const PER: Record<PlanInterval, string> = {
  day: "per day",
  week: "per week",
  month: "per month",
  year: "per year",
};
const DATE: Record<PlanStatus, string> = {
  active: "Renews on",
  past_due: "Payment was due on",
  cancelled: "Ends on",
  expired: "Ended on",
  none: "",
};

function PlanSummary({
  name,
  status,
  locale,
  price,
  interval,
  periodEnd,
  features = [],
  action,
  secondaryAction,
  copy = {},
  id = "plan-summary",
  headingLevel = 2,
  className,
}: PlanSummaryProps) {
  const statusWord = copy.status?.[status] ?? STATUS[status];
  const dateWord = copy.date?.[status] ?? DATE[status];
  const when = periodEnd
    ? new Intl.DateTimeFormat(locale, {
        dateStyle: "long",
        timeZone: "UTC",
      }).format(new Date(periodEnd))
    : null;
  const H = headingLevel === 3 ? "h3" : "h2";
  const none = status === "none";
  return (
    <section
      data-slot="plan-summary"
      data-status={status}
      aria-labelledby={`${id}-title`}
      className={cn(
        "rounded-md border border-border bg-card p-5 text-card-foreground",
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <H
            id={`${id}-title`}
            className="text-body font-semibold text-foreground"
          >
            {name}
          </H>
          {!none && price && (
            <p
              data-slot="plan-price"
              className="mt-1 flex flex-wrap items-baseline gap-x-1.5"
            >
              <Money
                amountMinor={price.amountMinor}
                currency={price.currency}
                locale={locale}
                className="text-h3 font-semibold text-foreground"
              />
              {interval && (
                <span className="text-body-sm text-muted-foreground">
                  {copy.per?.[interval] ?? PER[interval]}
                </span>
              )}
            </p>
          )}
        </div>
        <span
          data-slot="status"
          data-tone={TONE[status]}
          className={statusToneClasses(TONE[status])}
        >
          {statusWord}
        </span>
      </div>
      {none && (
        <p data-slot="plan-none" className="mt-2 text-body-sm text-muted-foreground">
          {copy.none ?? "There is no plan on this account."}
        </p>
      )}
      {!none && when && periodEnd && (
        <p data-slot="plan-date" className="mt-2 text-body-sm text-muted-foreground">
          {`${dateWord} `}
          <time dateTime={periodEnd} className="font-medium text-foreground">
            {when}
          </time>
        </p>
      )}
      {!none && features.length > 0 && (
        <ul
          data-slot="plan-features"
          aria-label={copy.features ?? "Included"}
          className="mt-4 grid gap-1.5"
        >
          {features.map((f) => (
            <li key={f} className="flex items-start gap-2 text-body-sm">
              <Icon
                name="check"
                className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
              />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      )}
      {(action || secondaryAction) && (
        <div data-slot="plan-actions" className="mt-5 flex flex-wrap gap-2">
          {action && (
            <a
              href={action.href}
              className={appButtonVariants({ variant: "primary" })}
            >
              {action.label}
            </a>
          )}
          {secondaryAction && (
            <a
              href={secondaryAction.href}
              className={appButtonVariants({ variant: "outline" })}
            >
              {secondaryAction.label}
            </a>
          )}
        </div>
      )}
    </section>
  );
}

export {
  PlanSummary,
  type PlanInterval,
  type PlanStatus,
  type PlanSummaryCopy,
  type PlanSummaryProps,
};
