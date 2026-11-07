import * as React from "react";

import { cn } from "@/lib/ui-utils";

/**
 * Separator — a thin rule using the semantic `border` token.
 *
 * NOT Radix: a plain, accessible `<div>` with the correct ARIA. When
 * `decorative` (the default) it's `role="none"` and hidden from the
 * a11y tree; set `decorative={false}` for a semantic separator that
 * exposes `role="separator"` + `aria-orientation`.
 */
export interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical";
  decorative?: boolean;
  class?: string;
  className?: string;
}

export function Separator({
  orientation = "horizontal",
  decorative = true,
  class: astroClass,
  className,
  ...props
}: SeparatorProps) {
  return (
    <div
      data-slot="separator"
      data-orientation={orientation}
      role={decorative ? "none" : "separator"}
      aria-orientation={
        decorative
          ? undefined
          : orientation === "vertical"
            ? "vertical"
            : "horizontal"
      }
      className={cn(
        "shrink-0 bg-border",
        orientation === "vertical" ? "h-full w-px" : "h-px w-full",
        astroClass,
        className,
      )}
      {...props}
    />
  );
}
