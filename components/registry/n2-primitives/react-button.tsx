import * as React from "react";
import { type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/ui-utils";
import { buttonVariants } from "@/lib/ui-variants";

/**
 * Button — shadcn CVA pattern (the source the Nyuchi Design System is
 * built on), mapped onto the Five-African-Minerals semantic tokens.
 *
 * Astro adaptation: renders an <a> when `href` is set, otherwise a
 * <button>. Touch targets follow the Ubuntu checklist — 56px (h-14)
 * for the large size, 48px (h-12) minimum — for outdoor, all-ages use.
 */

const ArrowRight = () => (
  <svg
    className="h-4 w-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
      d="M17 8l4 4m0 0l-4 4m4-4H3"
    />
  </svg>
);

export interface ButtonProps extends VariantProps<typeof buttonVariants> {
  /** Render as a link when set. */
  href?: string;
  /** Opens in a new tab with safe rel. */
  external?: boolean;
  /** Append a trailing arrow glyph (keeps the SVG out of pages). */
  arrow?: boolean;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  class?: string;
  className?: string;
  children?: React.ReactNode;
}

export function Button({
  variant,
  size,
  fullWidth,
  href,
  external,
  arrow,
  type = "button",
  disabled,
  class: astroClass,
  className,
  children,
}: ButtonProps) {
  const classes = cn(
    buttonVariants({ variant, size, fullWidth }),
    astroClass,
    className,
  );

  if (href) {
    const ext = external
      ? { target: "_blank", rel: "noopener noreferrer" }
      : {};
    return (
      <a href={href} className={classes} data-slot="button" {...ext}>
        {children}
        {arrow && <ArrowRight />}
      </a>
    );
  }

  return (
    <button
      type={type}
      disabled={disabled}
      className={classes}
      data-slot="button"
    >
      {children}
      {arrow && <ArrowRight />}
    </button>
  );
}

export { buttonVariants };
