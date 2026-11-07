import * as React from "react";
import { type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/ui-utils";
import { cardVariants } from "@/lib/ui-variants";

/**
 * Card — shadcn CVA pattern over the design system's `.card` surface
 * token (defined in each app's global.css @layer components). Renders an
 * <a> when `href` is set so whole-card links stay a single component.
 */

export interface CardProps extends VariantProps<typeof cardVariants> {
  href?: string;
  external?: boolean;
  class?: string;
  className?: string;
  children?: React.ReactNode;
}

export function Card({
  padding,
  hover,
  href,
  external,
  class: astroClass,
  className,
  children,
}: CardProps) {
  const classes = cn(cardVariants({ padding, hover }), astroClass, className);

  if (href) {
    const ext = external
      ? { target: "_blank", rel: "noopener noreferrer" }
      : {};
    return (
      <a href={href} className={classes} data-slot="card" {...ext}>
        {children}
      </a>
    );
  }

  return (
    <div className={classes} data-slot="card">
      {children}
    </div>
  );
}

export { cardVariants };
