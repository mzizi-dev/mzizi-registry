/**
 * Section — the standard marketing page band: a <section> with the vertical
 * rhythm, a background surface and an optional hairline divider, wrapping its
 * content in `.container-custom` unless it is full-bleed.
 *
 * The React build of contract `site/section`, beside `site-section.astro`:
 * the same markup and classes.
 */
import type { ReactNode } from "react";

export interface SectionProps {
  /** Background surface token. */
  bg?: "canvas" | "secondary" | "transparent";
  /** Vertical rhythm — maps to the .section* utilities. */
  space?: "default" | "tight" | "loose";
  /** Hairline bottom border (the quiet section divider). */
  border?: boolean;
  /** Wrap children in `.container-custom` (default) or render full-bleed. */
  container?: boolean;
  id?: string;
  className?: string;
  children?: ReactNode;
}

const spaceClasses = {
  default: "section",
  tight: "section-tight",
  loose: "section-loose",
};

const bgClasses = {
  canvas: "bg-canvas",
  secondary: "bg-secondary",
  transparent: "",
};

export function Section({
  bg = "canvas",
  space = "default",
  border = false,
  container = true,
  id,
  className,
  children,
}: SectionProps) {
  const classes = [
    spaceClasses[space],
    bgClasses[bg],
    border && "border-b border-border",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <section className={classes} id={id} data-slot="section">
      {container ? (
        <div className="container-custom">{children}</div>
      ) : (
        children
      )}
    </section>
  );
}
