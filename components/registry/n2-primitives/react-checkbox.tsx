import * as React from "react";

import { cn } from "@/lib/ui-utils";

/**
 * Checkbox — a NATIVE `<input type="checkbox">` styled to the design
 * system's semantic tokens.
 *
 * Deliberately NOT Radix: this is the minimal accessible, form-native,
 * SSR-friendly implementation. It uses the CSS `accent-color`
 * (`accent-primary`) so the browser's built-in checked glyph is tinted
 * to the brand `--primary` token — no client JS, fully keyboard- and
 * screen-reader-accessible, and it submits inside a `<form>` like any
 * native checkbox. The 20px box sits inside a comfortable label hit
 * area; pair it with a `<Label>` for a larger touch target.
 */
export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  class?: string;
  className?: string;
}

export function Checkbox({
  class: astroClass,
  className,
  ...props
}: CheckboxProps) {
  return (
    <input
      type="checkbox"
      data-slot="checkbox"
      className={cn(
        "h-5 w-5 shrink-0 cursor-pointer rounded-[7px] border border-border bg-background accent-primary transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
        astroClass,
        className,
      )}
      {...props}
    />
  );
}
