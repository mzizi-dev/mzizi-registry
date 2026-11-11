import * as React from "react";

import { cn } from "@/lib/ui-utils";
import { skeletonClasses } from "@/lib/ui-variants";

/**
 * Skeleton — a loading placeholder using the semantic `muted` token
 * and Tailwind's `animate-pulse`. Dependency-free and SSR-friendly.
 * Size it with utility classes (`h-4 w-32`, `h-10 w-10 rounded-full`,
 * …) via `class` / `className`.
 */
export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  class?: string;
  className?: string;
}

export function Skeleton({
  class: astroClass,
  className,
  ...props
}: SkeletonProps) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn(skeletonClasses, astroClass, className)}
      {...props}
    />
  );
}
