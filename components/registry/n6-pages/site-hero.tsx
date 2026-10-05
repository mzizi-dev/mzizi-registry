/**
 * Hero — the top band of a marketing page: an optional status badge and
 * eyebrow, the page's one serif <h1>, a lead, and at most two pill calls to
 * action, with an optional `media` region beside (split) or below (stack) the
 * text. With no media, no split, no badge and no showcase variant it renders
 * the 0.1.x markup exactly (the legacy branch).
 *
 * The React build of contract `site/hero`, beside `site-hero.astro`: the same
 * markup and classes. It composes `CtaButton` (`site-cta-button`).
 */
import type { ReactNode } from "react";

import { CtaButton } from "@/components/ui/site-cta-button";

export interface HeroCTA {
  text: string;
  href: string;
  external?: boolean;
}

export interface HeroProps {
  title: string;
  subtitle?: string;
  description?: string;
  primaryCTA?: HeroCTA;
  secondaryCTA?: HeroCTA;
  variant?: "default" | "gradient" | "light" | "showcase";
  align?: "center" | "start";
  /** "stack" (default): one text column. "split": text beside the `media` slot at `lg`. */
  layout?: "stack" | "split";
  /** Short status pill above the headline. Keep it honest — it is read as a claim. */
  badge?: string;
  /** Accessible name for the media region; when set it renders as `role="group"` with this label. */
  mediaLabel?: string;
  /** The `media` slot: a demo, screenshot or live widget. */
  media?: ReactNode;
}

const sectionClasses = {
  default: "bg-canvas",
  light: "bg-secondary",
  gradient: "gradient-hero",
  showcase: "gradient-showcase",
};

const alignClasses = {
  start: "text-left",
  center: "text-center mx-auto",
};

/** Astro's `class:list`: falsy parts dropped, the rest joined by a space. */
const list = (...parts: (string | false | null | undefined)[]) =>
  parts.filter(Boolean).join(" ");

function Copy({
  subtitle,
  title,
  description,
  primaryCTA,
  secondaryCTA,
  align,
}: Pick<
  HeroProps,
  "subtitle" | "title" | "description" | "primaryCTA" | "secondaryCTA"
> & {
  align: "center" | "start";
}) {
  return (
    <>
      {subtitle && <p className="eyebrow">{subtitle}</p>}

      <h1 className="font-serif text-display text-foreground text-balance">
        {title}
      </h1>

      {description && (
        <p
          className={list(
            "mt-6 text-body-lg text-muted-foreground text-pretty max-w-2xl",
            align === "center" && "mx-auto",
          )}
        >
          {description}
        </p>
      )}

      {(primaryCTA || secondaryCTA) && (
        <div
          className={list(
            "mt-8 flex flex-wrap items-center gap-3",
            align === "center" && "justify-center",
          )}
        >
          {primaryCTA && (
            <CtaButton href={primaryCTA.href} external={primaryCTA.external}>
              {primaryCTA.text}
            </CtaButton>
          )}
          {secondaryCTA && (
            <CtaButton
              href={secondaryCTA.href}
              external={secondaryCTA.external}
              variant="ghost"
              arrow
            >
              {secondaryCTA.text}
            </CtaButton>
          )}
        </div>
      )}
    </>
  );
}

export function Hero({
  title,
  subtitle,
  description,
  primaryCTA,
  secondaryCTA,
  variant = "default",
  align = "start",
  layout = "stack",
  badge,
  mediaLabel,
  media,
}: HeroProps) {
  const hasMedia = media !== undefined && media !== null && media !== false;
  const split = layout === "split";
  /** 0.1.x markup, exactly: no media, no split, no badge, no showcase. */
  const legacy = !hasMedia && !split && !badge && variant !== "showcase";
  const copy = {
    subtitle,
    title,
    description,
    primaryCTA,
    secondaryCTA,
    align,
  };

  if (legacy) {
    return (
      <section
        className={list("py-12 md:py-16 lg:py-20", sectionClasses[variant])}
        data-slot="hero"
      >
        <div className="container-custom">
          <div className={list("max-w-3xl", alignClasses[align])}>
            <Copy {...copy} />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className={list(
        "py-12 md:py-16",
        variant === "showcase" ? "lg:py-24" : "lg:py-20",
        sectionClasses[variant],
      )}
      data-slot="hero"
      data-layout={layout}
    >
      <div
        className={list(
          "container-custom",
          split &&
            "grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-14",
        )}
      >
        <div
          className={list(
            "min-w-0",
            split ? "max-w-2xl" : "max-w-3xl",
            alignClasses[align],
          )}
          data-slot="hero-text"
        >
          {badge && (
            <p
              className={list(
                "mb-5 flex w-fit items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-caption font-medium text-foreground",
                align === "center" && "mx-auto",
              )}
              data-slot="hero-badge"
            >
              <span
                className="inline-block h-2 w-2 shrink-0 rounded-full bg-primary"
                aria-hidden="true"
              />
              {badge}
            </p>
          )}

          <Copy {...copy} />
        </div>

        {hasMedia && (
          <div
            className={list("min-w-0", !split && "mt-12")}
            data-slot="hero-media"
            role={mediaLabel ? "group" : undefined}
            aria-label={mediaLabel}
          >
            {media}
          </div>
        )}
      </div>
    </section>
  );
}
