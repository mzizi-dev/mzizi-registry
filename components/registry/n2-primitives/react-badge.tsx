import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/ui-utils";

/**
 * Badge — shadcn CVA pattern mapped onto the Five-African-Minerals
 * container tokens. Variants name the semantic role, not the colour, so
 * a brand re-skin lands everywhere at once.
 */
export const badgeVariants = cva(
  "inline-flex items-center rounded-full font-medium",
  {
    variants: {
      variant: {
        default: "bg-muted text-muted-foreground",
        primary: "bg-cobalt-container text-cobalt-on-container",
        success: "bg-malachite-container text-malachite-on-container",
        warning: "bg-gold-container text-gold-on-container",
        info: "bg-cobalt-container text-cobalt-on-container",
        accent: "bg-terracotta-container text-terracotta-on-container",
        premium: "bg-tanzanite-container text-tanzanite-on-container",
        outline: "border border-border text-foreground",
      },
      size: {
        // 14px of inline inset at every size: the spacing floor holds a label
        // chip on its inline axis; the block axis is the line height.
        sm: "px-3.5 py-0.5 text-caption",
        md: "px-3.5 py-1 text-body-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);

export interface BadgeProps extends VariantProps<typeof badgeVariants> {
  class?: string;
  className?: string;
  children?: React.ReactNode;
}

export function Badge({
  variant,
  size,
  class: astroClass,
  className,
  children,
}: BadgeProps) {
  return (
    <span
      className={cn(badgeVariants({ variant, size }), astroClass, className)}
      data-slot="badge"
    >
      {children}
    </span>
  );
}
