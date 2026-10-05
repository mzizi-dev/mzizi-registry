/**
 * SectionHeader — the eyebrow, serif heading and lead cluster at the top of a
 * marketing section. `as` sets the heading level for the outline; `size`
 * decouples its visual size. The Astro build's `title` and `description`
 * slots share their names with the props, so here the two props are
 * ReactNodes: pass text or markup (a coloured <span>, a link).
 *
 * The React build of contract `site/section-header`, beside
 * `site-section-header.astro`: the same markup and classes.
 */
import type { ReactNode } from "react";

export interface SectionHeaderProps {
  eyebrow?: string;
  /** The heading: text, or markup (the Astro `title` slot). */
  title?: ReactNode;
  /** The lead: text, or markup (the Astro `description` slot). */
  description?: ReactNode;
  align?: "start" | "center";
  /** Heading level for correct document outline. */
  as?: "h1" | "h2" | "h3";
  /** Visual size override; defaults to match `as`. */
  size?: "display" | "h1" | "h2" | "h3";
  /** Tailwind max-width for the block (default constrains the lead text). */
  max?: string;
  /** Tint the eyebrow (e.g. text-primary). */
  eyebrowClass?: string;
  className?: string;
}

const sizeClasses = {
  display: "text-display",
  h1: "text-h1",
  h2: "text-h2",
  h3: "text-h3",
};

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "start",
  as: Heading = "h2",
  size,
  max = "max-w-2xl",
  eyebrowClass,
  className,
}: SectionHeaderProps) {
  const sizeClass = sizeClasses[size ?? Heading];
  const wrapper = [max, align === "center" && "mx-auto text-center", className]
    .filter(Boolean)
    .join(" ");
  const eyebrowClasses = [
    "eyebrow",
    align === "center" && "justify-center",
    eyebrowClass,
  ]
    .filter(Boolean)
    .join(" ");
  const hasDescription = description !== undefined && description !== null;

  return (
    <div className={wrapper} data-slot="section-header">
      {eyebrow && <p className={eyebrowClasses}>{eyebrow}</p>}
      <Heading
        className={`font-serif ${sizeClass} text-foreground text-balance`}
      >
        {title}
      </Heading>
      {hasDescription && (
        <p className="mt-4 text-body text-muted-foreground text-pretty">
          {description}
        </p>
      )}
    </div>
  );
}
