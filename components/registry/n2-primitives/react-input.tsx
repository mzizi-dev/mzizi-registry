import * as React from "react";

import { cn } from "@/lib/ui-utils";
import { inputClasses } from "@/lib/ui-variants";

/**
 * Input — native <input> styled to the Nyuchi Design System tokens
 * (shadcn pattern, mapped onto the Five-African-Minerals semantic
 * tokens). Dependency-free and SSR-friendly so it renders as plain HTML
 * inside Astro without a client directive.
 *
 * Forwards every standard input prop (type, name, id, placeholder,
 * required, value, defaultValue, autocomplete, inputmode, …) via
 * `...props`. The `h-12` floor keeps the Ubuntu 48px minimum touch
 * target for outdoor, all-ages use.
 */

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Astro-style class attribute (merged with `className`). */
  class?: string;
  className?: string;
}

export function Input({ class: astroClass, className, ...props }: InputProps) {
  return (
    <input
      data-slot="input"
      className={cn(inputClasses, astroClass, className)}
      {...props}
    />
  );
}

export { inputClasses };
