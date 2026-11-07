import * as React from "react";

import { cn } from "@/lib/ui-utils";

/**
 * Textarea — native <textarea> styled to the Nyuchi Design System
 * tokens (shadcn pattern over the Five-African-Minerals tokens).
 * Dependency-free and SSR-friendly. Forwards every standard textarea
 * prop (name, id, placeholder, required, rows, value, defaultValue, …)
 * via `...props`.
 */
export const textareaClasses =
  "flex min-h-24 w-full rounded-lg border border-border bg-background px-4 py-3 text-body text-foreground transition-colors placeholder:text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Astro-style class attribute (merged with `className`). */
  class?: string;
  className?: string;
}

export function Textarea({
  class: astroClass,
  className,
  ...props
}: TextareaProps) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(textareaClasses, astroClass, className)}
      {...props}
    />
  );
}
