import * as React from "react";

import { cn } from "@/lib/ui-utils";

/**
 * Select — native <select> styled to the Nyuchi Design System tokens
 * (shadcn pattern over the Five-African-Minerals tokens). Deliberately
 * NOT Radix: kept dependency-free and SSR-friendly so it renders as
 * plain HTML inside Astro without a client directive.
 *
 * Forwards every standard select prop (name, id, required, value,
 * defaultValue, …) via `...props`, and renders its <option> children
 * as-is.
 */
export const selectClasses =
  "flex h-field w-full appearance-none rounded-lg border border-border bg-background px-4 text-body text-foreground transition-colors outline-none cursor-pointer focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  /** Astro-style class attribute (merged with `className`). */
  class?: string;
  className?: string;
  children?: React.ReactNode;
}

export function Select({
  class: astroClass,
  className,
  children,
  ...props
}: SelectProps) {
  return (
    <select
      data-slot="select"
      className={cn(selectClasses, astroClass, className)}
      {...props}
    >
      {children}
    </select>
  );
}
