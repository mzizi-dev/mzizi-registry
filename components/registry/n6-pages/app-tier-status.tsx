import { Icon } from "@/components/ui/site-icon";
import {
  TIER_DATA,
  TIER_ORDER,
  nextTier,
  type VerificationTier,
} from "@/lib/mzizi-trust-tier-data";
import { cn } from "@/lib/ui-utils";
import { appButtonVariants } from "@/lib/ui-variants";

/**
 * TierStatus — where a business or a person stands on the verification
 * ladder: the current rung, the whole ladder as an ordered list (Unverified,
 * Community Verified, Contact Verified, Government Verified, Licensed
 * Professional), the attestations held, written as facts ("Domain ownership
 * checked"), and what the next rung needs, with a link to submit evidence.
 *
 * It takes data and computes nothing about access: whether someone may do
 * something is decided on the server (api-gateway `assurance.py`), never
 * here. The ladder's labels, levels, glyphs and `--tier-*` classes come from
 * `mzizi-trust-tier-data`. Every state is written in words ("Done",
 * "Current", "Next"), so colour is never the only cue.
 *
 * The React build of contract `app/tier-status`, beside
 * `app-tier-status.astro` (the default build): the same markup and classes,
 * a server component.
 */
interface Attestation {
  /** The fact, in words ("Business registration checked"). */
  label: string;
  /** Where or when ("Companies Registry, 12 March 2026"). */
  detail?: string;
}

interface TierStatusCopy {
  current?: string;
  ladder?: string;
  held?: string;
  none?: string;
  next?: string;
  top?: string;
  done?: string;
  here?: string;
  upcoming?: string;
}

interface TierStatusProps {
  /** The current rung (system.verification_tier.tier_code). */
  tier: VerificationTier;
  /** Facts the account holds. */
  attestations?: Attestation[];
  /** What the next rung needs, in words, as the server decided it. */
  requirements?: string[];
  /** Where to submit evidence for the next rung. */
  action?: { label: string; href: string };
  /** The panel's heading. */
  title?: string;
  /** Rename tiers in the app's words or another language. */
  tierLabels?: Partial<Record<VerificationTier, string>>;
  /** The panel's other words, for another language. */
  copy?: TierStatusCopy;
  /** The id the heading and the panel's parts are built from. */
  id?: string;
  /** The heading's level (2 or 3); the sections take the next one. */
  headingLevel?: 2 | 3;
  className?: string;
}

function TierStatus({
  tier,
  attestations = [],
  requirements = [],
  action,
  title = "Verification",
  tierLabels = {},
  copy = {},
  id = "tier-status",
  headingLevel = 2,
  className,
}: TierStatusProps) {
  const words = {
    current: "Current level:",
    ladder: "Verification levels",
    held: "What you hold",
    none: "No attestations yet.",
    next: "Next:",
    top: "This is the highest level.",
    done: "Done",
    here: "Current",
    upcoming: "Next",
    ...copy,
  };
  const nameOf = (t: VerificationTier) => tierLabels[t] ?? TIER_DATA[t].label;
  const data = TIER_DATA[tier];
  const next = nextTier(tier);
  const H = headingLevel === 3 ? "h3" : "h2";
  const Sub = headingLevel === 3 ? "h4" : "h3";
  const stateOf = (level: number) =>
    level < data.level
      ? "done"
      : level === data.level
        ? "current"
        : level === data.level + 1
          ? "next"
          : "ahead";

  return (
    <section
      data-slot="tier-status"
      data-tier={tier}
      aria-labelledby={`${id}-title`}
      className={cn(
        "rounded-md border border-border bg-card p-5 text-card-foreground",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className={cn(
            "inline-flex size-10 shrink-0 items-center justify-center rounded-full text-[20px]",
            data.classes.container,
            data.classes.onContainer,
          )}
        >
          <Icon name={data.glyph ?? "shield"} />
        </span>
        <div className="min-w-0">
          <H
            id={`${id}-title`}
            className="text-body font-semibold text-foreground"
          >
            {title}
          </H>
          <p data-slot="tier-current" className="text-body-sm">
            <span className="text-muted-foreground">{words.current}</span>{" "}
            <strong className={cn("font-semibold", data.classes.text)}>
              {nameOf(tier)}
            </strong>
          </p>
        </div>
      </div>

      <ol
        data-slot="tier-ladder"
        aria-label={words.ladder}
        className="mt-4 grid gap-0.5"
      >
        {TIER_ORDER.map((t) => {
          const rung = TIER_DATA[t];
          const state = stateOf(rung.level);
          const reached = state === "done" || state === "current";
          return (
            <li
              key={t}
              data-tier={t}
              data-state={state}
              aria-current={state === "current" ? "step" : undefined}
              className={cn(
                "flex min-h-9 items-center gap-3 rounded-sm px-2 text-body-sm pointer-coarse:min-h-11",
                state === "current" && "bg-muted font-medium",
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "inline-flex size-6 shrink-0 items-center justify-center rounded-full text-caption font-medium",
                  reached
                    ? [rung.classes.container, rung.classes.onContainer]
                    : "border border-border text-muted-foreground",
                )}
              >
                {rung.level}
              </span>
              <span className="min-w-0 flex-1">{nameOf(t)}</span>
              {state !== "ahead" && (
                <span
                  data-slot="tier-rung-state"
                  className="text-caption text-muted-foreground"
                >
                  {state === "done"
                    ? words.done
                    : state === "current"
                      ? words.here
                      : words.upcoming}
                </span>
              )}
            </li>
          );
        })}
      </ol>

      <div className="mt-5 grid gap-2" data-slot="tier-attestations">
        <Sub className="text-body-sm font-semibold text-foreground">
          {words.held}
        </Sub>
        {attestations.length === 0 ? (
          <p className="text-body-sm text-muted-foreground">{words.none}</p>
        ) : (
          <ul className="grid gap-1.5">
            {attestations.map((a) => (
              <li key={a.label} className="flex items-start gap-2 text-body-sm">
                <Icon
                  name="check"
                  className="mt-0.5 h-4 w-4 shrink-0 text-status-success"
                />
                <span className="min-w-0">
                  {a.label}
                  {a.detail && (
                    <span className="block text-caption text-muted-foreground">
                      {a.detail}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div
        className="mt-5 grid gap-2 border-t border-border pt-4"
        data-slot="tier-next"
      >
        {next ? (
          <>
            <Sub className="text-body-sm font-semibold text-foreground">
              {`${words.next} ${nameOf(next.tier)}`}
            </Sub>
            {requirements.length > 0 && (
              <ul className="grid list-disc gap-1 ps-5 text-body-sm text-muted-foreground">
                {requirements.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            )}
            {action && (
              <a
                href={action.href}
                className={cn(
                  appButtonVariants({ variant: "primary", size: "sm" }),
                  "w-fit",
                )}
              >
                {action.label}
              </a>
            )}
          </>
        ) : (
          <p className="text-body-sm text-muted-foreground">{words.top}</p>
        )}
      </div>
    </section>
  );
}

export {
  TierStatus,
  type Attestation,
  type TierStatusCopy,
  type TierStatusProps,
};
