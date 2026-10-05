/**
 * CtaButton — the marketing pill call to action that Hero composes. An `<a>`
 * when `href` is set, otherwise a `<button>`; `external` opens in a new tab
 * with a safe `rel`; `arrow` appends the trailing arrow glyph.
 *
 * The React twin of `site-cta-button.astro` (a support file of contract
 * `site/hero`, not a contract of its own): the same markup and the same
 * `buttonVariants` classes.
 */
import type { ReactNode } from "react";

import { cn } from "@/lib/ui-utils";
import { buttonVariants } from "@/lib/ui-variants";

export interface CtaButtonProps {
  href?: string;
  external?: boolean;
  arrow?: boolean;
  variant?:
    | "primary"
    | "secondary"
    | "outline"
    | "ghost"
    | "destructive"
    | "destructive-outline";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  className?: string;
  children?: ReactNode;
}

function Arrow() {
  return (
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
        strokeWidth="1.75"
        d="M17 8l4 4m0 0l-4 4m4-4H3"
      />
    </svg>
  );
}

export function CtaButton({
  href,
  external = false,
  arrow = false,
  variant,
  size,
  fullWidth,
  type = "button",
  disabled,
  className,
  children,
}: CtaButtonProps) {
  const classes = cn(buttonVariants({ variant, size, fullWidth }), className);
  if (href) {
    return (
      <a
        href={href}
        className={classes}
        data-slot="button"
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
      >
        {children}
        {arrow && <Arrow />}
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
      {arrow && <Arrow />}
    </button>
  );
}
