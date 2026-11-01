import { Icon } from "@/components/ui/site-icon";
import {
  ASSURANCE_DATA,
  ASSURANCE_ORDER,
  ATTESTATION_DATA,
  legacyTier,
  legacyTierToAssurance,
  nextAssurance,
  attestationProvenance,
  normalizeAttestationRecords,
  type AssuranceLevel,
  type AttestationInput,
  type AttestationType,
  type VerificationTier,
} from "@/lib/mzizi-trust-tier-data";
import { cn } from "@/lib/ui-utils";
import { appButtonVariants } from "@/lib/ui-variants";

/**
 * TierStatus — where a business or a person stands in the Bundu trust model
 * (nyuchi/nyuchi-api `gateway/lib/assurance.py`, #577): the current assurance
 * level, the attestations held beside it as separate chips (Community Vouched,
 * Registered Business, Domain Verified), the five levels as an ordered list
 * (Unverified, Contact Verified, Documents Checked, Government Verified,
 * Licensed Professional), the facts held, and what the next level needs, with
 * a link to submit evidence.
 *
 * Community is an attestation, never a rung below otp: a tuck shop vouched
 * for by its street is "Contact Verified" plus a "Community Vouched" chip, and
 * nothing ranks one above the other. A legacy `tier` is read into the model the
 * way assurance.py's fallback does (`legacyTierToAssurance`), so `tier="community"`
 * shows the community chip, not a rung.
 *
 * It takes data and computes nothing about access: whether someone may do
 * something is decided on the server (`assurance.py`), never here. Labels,
 * glyphs and the `--assurance-*` / `--attestation-*` classes come from
 * `mzizi-trust-tier-data`. Every state is written in words ("Done",
 * "Current", "Next"), so colour is never the only cue.
 *
 * An attestation may carry provenance (`source`, `sourceRef`, `checkedAt`):
 * its chip keeps the canonical name and adds a second line, "via
 * OpenStreetMap · checked 14 Mar 2026", read with the name. No `checkedAt`,
 * no date (a date is never invented); an unknown source id shows as the id.
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
  attested?: string;
  held?: string;
  none?: string;
  next?: string;
  top?: string;
  done?: string;
  here?: string;
  upcoming?: string;
  /** Before an attestation's source: "via". */
  via?: string;
  /** Before an attestation's check date: "checked". */
  checked?: string;
}

interface TierStatusProps {
  /** The current assurance level (assurance.py). Takes precedence over `tier`. */
  assurance?: AssuranceLevel;
  /**
   * The attestations in force, as type names or stored records; revoked ones are dropped. A
   * record may carry provenance (`source`, `sourceRef`, `checkedAt`), shown as a second line
   * in its chip: "via OpenStreetMap · checked 14 Mar 2026".
   */
  attestationTypes?: AttestationInput[];
  /** A BCP 47 locale for an attestation's check date. Default `en-GB` ("14 Mar 2026"). */
  locale?: string;
  /** Display names for attestation source ids, ahead of the built-in ones (osm → OpenStreetMap). */
  sourceNames?: Record<string, string>;
  /** Legacy: a `bundu.verificationTier` code, read into the model when `assurance` is not set. */
  tier?: VerificationTier;
  /** Facts the account holds. */
  attestations?: Attestation[];
  /** What the next level needs, in words, as the server decided it. */
  requirements?: string[];
  /** Where to submit evidence for the next level. */
  action?: { label: string; href: string };
  /** The panel's heading. */
  title?: string;
  /** Rename levels in the app's words or another language. */
  levelLabels?: Partial<Record<AssuranceLevel, string>>;
  /** Rename attestations in the app's words or another language. */
  attestationLabels?: Partial<Record<AttestationType, string>>;
  /** Legacy: rename by tier code; `community` names the community chip. */
  tierLabels?: Partial<Record<VerificationTier, string>>;
  /** The panel's other words, for another language. */
  copy?: TierStatusCopy;
  /** The id the heading and the panel's parts are built from. */
  id?: string;
  /** The heading's level (2 or 3); the sections take the next one. */
  headingLevel?: 2 | 3;
  className?: string;
}

/** The legacy tier code that names a level, for `tierLabels`. */
const LEGACY_NAME: Record<AssuranceLevel, VerificationTier | null> = {
  none: "unverified",
  otp: "otp",
  documented: null,
  government: "government",
  licensed: "licensed",
};

function TierStatus({
  assurance,
  attestationTypes = [],
  locale,
  sourceNames,
  tier,
  attestations = [],
  requirements = [],
  action,
  title = "Verification",
  levelLabels = {},
  attestationLabels = {},
  tierLabels = {},
  copy = {},
  id = "tier-status",
  headingLevel = 2,
  className,
}: TierStatusProps) {
  const words = {
    current: "Current level:",
    ladder: "Verification levels",
    attested: "Attestations",
    held: "What you hold",
    none: "No attestations yet.",
    next: "Next:",
    top: "This is the highest level.",
    done: "Done",
    here: "Current",
    upcoming: "Next",
    ...copy,
  };
  const legacy = legacyTierToAssurance(tier);
  const level: AssuranceLevel =
    assurance && assurance in ASSURANCE_DATA ? assurance : legacy.level;
  const chips = normalizeAttestationRecords([
    ...(assurance ? [] : legacy.attestations),
    ...attestationTypes,
  ]);
  const provenanceOf = (r: (typeof chips)[number]) =>
    attestationProvenance(r, {
      locale,
      sourceNames,
      words: { via: words.via, checked: words.checked },
    });
  const nameOf = (l: AssuranceLevel) => {
    const old = LEGACY_NAME[l];
    return (
      levelLabels[l] ??
      (old ? tierLabels[old] : undefined) ??
      ASSURANCE_DATA[l].label
    );
  };
  const chipName = (t: AttestationType) =>
    attestationLabels[t] ??
    (t === "community" ? tierLabels.community : undefined) ??
    ATTESTATION_DATA[t].label;
  const data = ASSURANCE_DATA[level];
  const next = nextAssurance(level);
  const H = headingLevel === 3 ? "h3" : "h2";
  const Sub = headingLevel === 3 ? "h4" : "h3";
  const stateOf = (rank: number) =>
    rank < data.rank
      ? "done"
      : rank === data.rank
        ? "current"
        : rank === data.rank + 1
          ? "next"
          : "ahead";

  return (
    <section
      data-slot="tier-status"
      data-assurance={level}
      data-tier={legacyTier(level, chips)}
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
              {nameOf(level)}
            </strong>
          </p>
          {chips.length > 0 && (
            <ul
              data-slot="tier-attested"
              aria-label={words.attested}
              className="mt-2 flex flex-wrap gap-1.5"
            >
              {chips.map((r) => {
                const t = r.type;
                const a = ATTESTATION_DATA[t];
                const p = provenanceOf(r);
                return (
                  <li
                    key={t}
                    data-attestation={t}
                    data-source={p?.source}
                    data-checked-at={p?.checkedAt}
                    className={cn(
                      "inline-flex min-h-7 items-center gap-1.5 rounded-full px-2.5 text-caption font-medium",
                      p && "py-1",
                      a.classes.container,
                      a.classes.onContainer,
                    )}
                  >
                    <Icon name={a.glyph} />
                    {p ? (
                      <span className="flex min-w-0 flex-col">
                        <span>{chipName(t)}</span>{" "}
                        <span
                          data-slot="tier-attested-provenance"
                          className="font-normal"
                        >
                          {p.checkedLabel
                            ? p.text.slice(0, -p.checkedLabel.length)
                            : p.text}
                          {p.checkedLabel && (
                            <time dateTime={p.checkedAt}>{p.checkedLabel}</time>
                          )}
                        </span>
                      </span>
                    ) : (
                      chipName(t)
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <ol
        data-slot="tier-ladder"
        aria-label={words.ladder}
        className="mt-4 grid gap-0.5"
      >
        {ASSURANCE_ORDER.map((l) => {
          const rung = ASSURANCE_DATA[l];
          const state = stateOf(rung.rank);
          const reached = state === "done" || state === "current";
          return (
            <li
              key={l}
              data-level={l}
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
                {rung.rank}
              </span>
              <span className="min-w-0 flex-1">{nameOf(l)}</span>
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
              {`${words.next} ${nameOf(next.level)}`}
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
