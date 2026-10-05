/**
 * Container — the max-width content wrapper of the marketing sites: one of
 * three widths (`.container-custom`, `.container-narrow`, `.container-prose`)
 * with the standard responsive gutters, as a div, section, main or article.
 *
 * The React build of contract `site/container`, beside `site-container.astro`:
 * the same markup and classes.
 */
import type { ReactNode } from "react";

export interface ContainerProps {
  /** Content width. Defaults to the wide grid column. */
  size?: "default" | "narrow" | "prose";
  /** Render element (defaults to a plain <div>). */
  as?: "div" | "section" | "main" | "article";
  id?: string;
  className?: string;
  children?: ReactNode;
}

const sizeClasses = {
  default: "container-custom",
  narrow: "container-narrow",
  prose: "container-prose",
};

export function Container({
  size = "default",
  as: Tag = "div",
  id,
  className,
  children,
}: ContainerProps) {
  const classes = [sizeClasses[size], className].filter(Boolean).join(" ");
  return (
    <Tag className={classes} id={id} data-slot="container">
      {children}
    </Tag>
  );
}
